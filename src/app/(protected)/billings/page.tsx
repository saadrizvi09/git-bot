// app/buy-points/page.tsx
'use client'; // This directive is necessary for client-side components in App Router

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner"; // For notifications
import { api } from "@/trpc/react"; // Your tRPC client
import { useRouter } from "next/navigation"; // For navigation after purchase

// Define the available point packages. You can adjust prices and points as needed.
const pointPackages = [
  { id: 'pkg_1', name: '1 Points', price: '₹10', points: 1 },
  { id: 'pkg_5', name: '5 Points', price: '₹30', points: 5 },
  { id: 'pkg_10', name: '10 Points', price: '₹50', points: 10 },
  { id: 'pkg_20', name: '20 Points', price: '₹70', points: 20 },
];

export default function BuyPointsPage() {
  const router = useRouter(); // Initialize Next.js router

  // 1. Fetch current user points using your new getMyCredits query
  const {
    data: userPointsData,
    isLoading: isLoadingPoints,
    error: pointsError,
    refetch: refetchPoints // Function to manually refetch points if needed
  } = api.project.getMyCredits.useQuery();

  // 2. Mutation for initiating a payment order with Paytm

  // Function to handle the purchase process
  const handlePurchase = async (packageId: string, points: number, amount: string) => {
    toast.info(`Initiating purchase for ${points} points (${amount})...`);


  };

  return (
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
                
              >
                {  "Buy Now"}
              </Button>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}