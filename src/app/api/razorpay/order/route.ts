import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { env } from '@/env';
import { db } from '@/server/db';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
      },
    };

    const order = await razorpay.orders.create(options);
    
    // Create a payment record in the database
    await db.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        status: 'pending',
        userId,
      },
    });
    
    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}