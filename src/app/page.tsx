import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bug, Bot, Code, PlusCircle } from 'lucide-react';
import React from 'react';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

const HomePage = () => {
  return (
    
    <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-gray-100 flex flex-col">
      <header className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 p-4 flex justify-between items-center shadow-md">
        <Link href="/" className="text-2xl font-bold">
          Git-Bot
        </Link>
        <nav className="space-x-4">
          <SignedOut>
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </header>

      {/* Main content area, pushed down by the Navbar's height */}
      <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

        {/* Hero Section - Prominent top section with main call to action */}
        <section className="text-center mb-16 max-w-4xl w-full">
          {/* Main Headline - Now in solid black/white */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Your <span className="text-black dark:text-white">AI Code Assistant</span>
          </h1>
          {/* Tagline - Greyscale for subtlety */} 
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Streamline your development workflow with intelligent insights and automated tasks.
          </p>
          {/* "Get Started" Button - Solid black/white theme */}
          <Link href="/dashboard" passHref>
            <Button className="
              bg-black text-white hover:bg-gray-800
              dark:bg-white dark:text-black dark:hover:bg-gray-200
              font-semibold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300
              hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700
              text-lg sm:text-xl
            ">
              Get Started
            </Button>
          </Link>
        </section>

        {/* Features Section - Highlights key functionalities in a grid */}
        <section className="w-full max-w-6xl">
          {/* Section Title */}
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            Features that Empower Your Workflow
          </h2>
          {/* Grid layout for feature cards, responsive across screen sizes */} 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1: AI Code Assistant */}
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <Bot className="w-16 h-16 text-gray-700 dark:text-gray-300 mb-4" /> {/* Greyscale icon */}
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">AI Code Assistant</h3>
              <p className="text-gray-600 dark:text-gray-400">Ask questions about your codebase and get instant, context-aware answers.</p>
            </div>

            {/* Feature Card 2: Repository Bug Scanner */}
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <Bug className="w-16 h-16 text-gray-700 dark:text-gray-300 mb-4" /> {/* Greyscale icon */}
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Repository Bug Scanner</h3>
              <p className="text-gray-600 dark:text-gray-400">Scan your entire repository for potential bugs, vulnerabilities, and code issues.</p>
            </div>

            {/* Feature Card 3: Component Generator */}
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <PlusCircle className="w-16 h-16 text-gray-700 dark:text-gray-300 mb-4" /> {/* Greyscale icon */}
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Add New Component</h3>
              <p className="text-gray-600 dark:text-gray-400">Get AI-guided recommendations on where and how to integrate new components.</p>
            </div>

            {/* Feature Card 4: Contextual Code References (Implicitly from AI answers) */}
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <Code className="w-16 h-16 text-gray-700 dark:text-gray-300 mb-4" /> {/* Greyscale icon */}
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Contextual Code References</h3>
              <p className="text-gray-600 dark:text-gray-400">View relevant code snippets alongside AI explanations for deeper understanding.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomePage;