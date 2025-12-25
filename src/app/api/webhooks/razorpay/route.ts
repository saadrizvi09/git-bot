import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/env';
import { db } from '@/server/db';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // Get the webhook signature from headers
    const signature = req.headers.get('x-razorpay-signature');
    
    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse the webhook payload
    const event = JSON.parse(body);
    
    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const amount = payment.amount;
      
      // Fetch the payment entity to get notes
      const razorpayPayment = await razorpay.payments.fetch(paymentId);
      const order = await razorpay.orders.fetch(orderId);
      
      // Get userId and points from order notes
      const userId = order.notes?.userId ? String(order.notes.userId) : null;
      const pointsToAdd = order.notes?.points ? parseInt(String(order.notes.points)) : 0;
      
      if (!userId) {
        console.error('userId not found in order notes', { orderId });
        return NextResponse.json(
          { error: 'userId not found in order notes' },
          { status: 400 }
        );
      }

      if (!pointsToAdd || pointsToAdd <= 0) {
        console.error('Invalid points in order notes', { orderId, pointsToAdd });
        return NextResponse.json(
          { error: 'Invalid points amount' },
          { status: 400 }
        );
      }

      // Check if this order has already been processed (idempotency check)
      const existingPayment = await db.payment.findUnique({
        where: {
          razorpayOrderId: orderId,
        },
      });

      if (!existingPayment) {
        console.error('Payment record not found for order', { orderId });
        return NextResponse.json(
          { error: 'Payment record not found' },
          { status: 404 }
        );
      }

      // If already processed, return 200 to acknowledge the webhook
      if (existingPayment.status === 'captured') {
        console.log('Payment already processed', { orderId, paymentId });
        return NextResponse.json({ 
          success: true, 
          message: 'Payment already processed' 
        });
      }

      // Update the database in a transaction
      await db.$transaction(async (tx) => {
        // Update the payment record
        await tx.payment.update({
          where: {
            razorpayOrderId: orderId,
          },
          data: {
            status: 'captured',
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            pointsAdded: pointsToAdd,
          },
        });

        // Add points to the user
        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            points: {
              increment: pointsToAdd,
            },
          },
        });
      });

      console.log('Payment processed successfully', { 
        orderId, 
        paymentId, 
        userId, 
        pointsAdded: pointsToAdd 
      });

      return NextResponse.json({ 
        success: true,
        message: 'Payment processed successfully',
        pointsAdded: pointsToAdd,
      });
    }

    // Handle payment.failed event (optional)
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Update the payment status to failed
      await db.payment.updateMany({
        where: {
          razorpayOrderId: orderId,
        },
        data: {
          status: 'failed',
          razorpayPaymentId: paymentId,
        },
      });

      console.log('Payment failed', { orderId, paymentId });

      return NextResponse.json({ 
        success: true,
        message: 'Payment failure recorded',
      });
    }

    // For other events, just acknowledge
    console.log('Webhook event received', { event: event.event });
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
