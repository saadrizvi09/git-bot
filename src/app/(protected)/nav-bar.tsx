"use client"
import { Github, ExternalLink, MenuIcon, Plus } from "lucide-react"
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { UserButton } from "@clerk/nextjs"
import useProject from "@/hooks/use-project" 

type MainNavbarProps = {
  className?: string;
};

const items = [
  { title: "Dashboard", url: '/dashboard' },
  { title: "Summarised Commits", url: '/commit' },
  { title: "Payments", url: "/billings"}

];

const sidebarItems = [
  { title: "Ask Questions", url: "/dashboard/askQuestions" },
  { title: "Add Components", url: "/dashboard/addFeatures" },
  { title: "Bug Scanner", url: "/dashboard/error" },
];

export function MainNavbar({ className }: MainNavbarProps) {
  const pathname = usePathname();
  const { projects, projectId, setProjectId } = useProject(); // <--- [2] Make sure this line is present and correct

  const activeLinkClasses = "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600";
  const defaultLinkClasses = "px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-700 dark:text-gray-300";


  return (
    <header className={cn("sticky top-0 z-40 w-full border-b bg-background dark:bg-gray-950 h-16 flex items-center", className)}>
      <div className="container flex h-full items-center justify-between px-2 md:px-4 mx-auto">

        {/* LEFT GROUP: Brand/Logo + Desktop Navigation Links */}
        <div className="flex items-center space-x-6 h-full">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <h1 className='text-xl font-bold text-primary/80 whitespace-nowrap'>
              GitBot
            </h1>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 h-full">
            <ul className="flex items-center space-x-4 h-full text-sm font-medium">
              {items.map(item => (
                <li key={item.title}>
                  <Link
                    href={item.url}
                    className={cn(
                      defaultLinkClasses,
                      { [activeLinkClasses]: item.url === '/' ? pathname === '/' : pathname.startsWith(item.url) }
                    )}
                    suppressHydrationWarning={true}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* RIGHT GROUP: UserButton + Mobile Menu Trigger */}
        <div className="flex items-center gap-4 h-full">
          {/* Clerk UserButton */}
          <div className="flex items-center justify-center w-10 h-10">
            <UserButton />
          </div>

          {/* Mobile Navigation Trigger (Hamburger Menu) */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 sm:max-w-xs flex flex-col">
              <div className="flex flex-col gap-2 py-6 overflow-y-auto">
                {/* Main Navigation Links (from `items` array) */}
                <h3 className="text-lg font-semibold mb-2 px-2 text-gray-800 dark:text-gray-200">Navigation</h3>
                {items.map(item => (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={cn(
                      "font-medium hover:text-primary py-2 px-4 rounded-md",
                      { "bg-gray-100 dark:bg-gray-700":  pathname=== item.url
                      },'list-none')}
                    suppressHydrationWarning={true}
                  >
                    {item.title}
                  </Link>
                ))}

                {/* Separator */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                {/* Sidebar Main Links (from `sidebarItems` array) */}
                <h3 className="text-lg font-semibold mb-2 px-2 text-gray-800 dark:text-gray-200">Tools</h3>
                {sidebarItems.map(item => (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={cn(
                      "font-medium hover:text-primary py-2 px-4 rounded-md",
                      { "bg-gray-100 dark:bg-gray-700":  pathname=== item.url
                      },'list-none')}
                    suppressHydrationWarning={true}
                  >
                    {item.title}
                  </Link>
                ))}

                {/* Separator */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h3 className="text-lg font-semibold mb-2 px-2 text-gray-800 dark:text-gray-200">Updated Repositories</h3>
                <nav className="grid gap-1">
                  {projects?  (
                    projects.map(project => (
                      <Link
                        key={project.id || project.name}
                        href={`/dashboard?projectId=${project.id}`}
                        onClick={() => { setProjectId(project.id) }}
                        className={cn(
                          "block px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          { "bg-gray-100 dark:bg-gray-700": project.id === projectId }
                        )}
                        suppressHydrationWarning={true}
                      >
                        {project.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 px-4">No repositories found.</p>
                  )}
                  {/* Add New Repository button */}
                  <Link href='/create' className="mt-4 block px-4">
                    <Button size='sm' variant={'outline'} className='w-full'>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Repository
                    </Button>
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}