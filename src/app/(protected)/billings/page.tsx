'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define the available point packages
const pointPackages = [
  { id: 'pkg_1', name: '1 Points', price: '₹10', points: 1 },
  { id: 'pkg_5', name: '5 Points', price: '₹30', points: 5 },
  { id: 'pkg_10', name: '10 Points', price: '₹50', points: 10 },
  { id: 'pkg_20', name: '20 Points', price: '₹70', points: 20 },
];

// Razorpay loader utility
const loadRazorpay = (): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve((window as any).Razorpay);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve((window as any).Razorpay);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.head.appendChild(script);
  });
};

export default function BuyPointsPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch current user points
  const {
    data: userPointsData,
    isLoading: isLoadingPoints,
    error: pointsError,
    refetch: refetchPoints
  } = api.project.getMyCredits.useQuery();

  // Mutation for adding points
  const addPointsMutation = api.project.addPoints.useMutation();

  // Function to handle the purchase process
  const handlePurchase = async (packageId: string, points: number, price: string) => {
    setIsProcessing(true);
    try {
      toast.info(`Initiating purchase for ${points} points (${price})...`);
      
      // 1. Create order on server
      const amount = parseInt(price.replace('₹', ''));
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          currency: 'INR' 
        }),
      });
      
      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }
      
      const orderData = await orderResponse.json();
      
      // 2. Load Razorpay
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        throw new Error('Failed to load Razorpay');
      }
      
      // 3. Open payment dialog
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GitBot Points",
        description: `Purchase of ${points} points`,
        order_id: orderData.id,
        handler: async function(response: any) {
          // 4. Verify payment
          const verificationResponse = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          
          const verificationData = await verificationResponse.json();
          
          if (verificationData.success) {
            // 5. Add points to user
            await addPointsMutation.mutateAsync({
              points,
              paymentId: verificationData.paymentId,
            });
            
            toast.success(`Successfully added ${points} points!`);
            refetchPoints(); // Refresh points display
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@email.com",
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled');
            setIsProcessing(false);
          }
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
     <div className="w-[80vw]"></div>
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Get More GitBot Points
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Fuel your productivity! Purchase points to add and update more repositories.
          </CardDescription>
        </CardHeader>

        {/* Display Current Points */}
        <CardContent className="py-4 text-center border-b border-gray-200 dark:border-gray-700">
          {isLoadingPoints ? (
            <p className="text-xl text-gray-600 dark:text-gray-400">Loading your current points...</p>
          ) : pointsError ? (
            <p className="text-xl text-red-500">Error: Could not load points.</p>
          ) : (
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              You currently have <span className="text-primary text-3xl font-bold">{userPointsData?.points ?? 0}</span> points.
            </p>
          )}
        </CardContent>

        {/* Point Packages Grid */}
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 p-6">
          {pointPackages.map(pkg => (
            <Card
              key={pkg.id}
              className="text-center p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors duration-200 ease-in-out transform hover:-translate-y-1"
            >
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {pkg.name}
              </CardTitle>
              <CardDescription className="text-5xl font-extrabold text-primary my-4">
                {pkg.price}
              </CardDescription>
              <p className="text-md text-muted-foreground mb-6">Instantly get {pkg.points} points</p>
              <Button
                className="w-full py-3 text-lg font-semibold"
                onClick={() => handlePurchase(pkg.id, pkg.points, pkg.price)}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Buy Now"}
              </Button>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
