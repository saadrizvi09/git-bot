"use client"
import * as React from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Bot } from "lucide-react"

import { UserButton } from "@clerk/nextjs"

// Wrap UserButton to prevent hydration mismatch
const ClientUserButton = dynamic(
  () => Promise.resolve(UserButton),
  { ssr: false }
) 

type MainNavbarProps = {
  className?: string;
};

// Main navigation tabs (like GitHub's Overview, Repositories, etc.)
const navTabs = [
  { title: "Dashboard", url: '/dashboard', exact: true },
    { title: "AI Tools", url: '/dashboard/askQuestions', isAiTools: true },

  { title: "Saved", url: '/saved' },
  { title: "Payments", url: "/billings" },
];

// AI Tools paths - sidebar shows when on these paths
const aiToolsPaths = [
  '/dashboard/askQuestions',
  '/dashboard/addFeatures', 
  '/dashboard/error',
  '/dashboard/commits',
];

export function isAiToolsPath(pathname: string) {
  return aiToolsPaths.some(path => pathname.startsWith(path));
}

export function MainNavbar({ className }: MainNavbarProps) {
  const pathname = usePathname();

  const isActive = (item: typeof navTabs[0]) => {
    if (item.isAiTools) {
      return isAiToolsPath(pathname);
    }
    if (item.exact) {
      return pathname === item.url;
    }
    return pathname.startsWith(item.url);
  };

  return (
    <div className={cn("fixed top-0 w-full z-50", className)}>
      {/* Top Bar - Logo and User */}
      <header className="w-full border-b bg-white dark:bg-gray-950 h-14 flex items-center">
        <div className="flex h-full w-full items-center justify-between px-4">
          {/* LEFT: Brand/Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
                GitBot
              </h1>
            </Link>
          </div>

          {/* RIGHT: User Button */}
          <div className="flex items-center justify-center">
            <ClientUserButton />
          </div>
        </div>
      </header>

      {/* Second Bar - Navigation Tabs */}
      <nav className="w-full border-b bg-white dark:bg-gray-950">
        <div className="px-4">
          <ul className="flex items-center gap-1 -mb-px">
            {navTabs.map(item => (
              <li key={item.title}>
                <Link
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive(item)
                      ? "text-gray-900 dark:text-white border-orange-500"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  {item.isAiTools && <Bot className="h-4 w-4" />}
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  )
}