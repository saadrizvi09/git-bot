import { SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './app-sidebar'
import { MainNavbar } from './nav-bar'

type Props = {
  children: React.ReactNode
}

const Sidebarlayout = ({ children }: Props) => {
  return (
    // The outermost container should handle the full viewport height.
    <SidebarProvider>
      {/* Main Navbar: fixed at the top, full width, high z-index.
          Its height is set to h-16 (64px) in MainNavbar.tsx.
      */}
      <MainNavbar className="fixed top-0 w-full z-50" />

      {/* This div wraps all content that appears BELOW the fixed navbar.
          'flex' and 'flex-col' correctly stack its children vertically.
          'min-h-screen' ensures it covers the full viewport height.
          'pt-16' is CRUCIAL to push content down below the fixed MainNavbar.
      */}
      <div className="flex flex-col min-h-screen bg-gray-50 pt-16">

        {/* This inner div manages the horizontal layout: Sidebar + Main Content.
            'flex' makes it a flex container.
            'flex-grow' allows it to fill the remaining vertical space.
            'overflow-hidden' prevents horizontal overflow issues.
        */}
        <div className="flex flex-grow overflow-hidden">
          {/* AppSidebar: This will occupy its defined width. */}
          <AppSidebar />

          {/* Main Content Area: CRITICAL CHANGES HERE
              - 'flex-grow': This makes the <main> element expand to fill ALL
                             remaining horizontal space after AppSidebar.
              - 'overflow-y-auto': Allows the main content area to scroll independently if needed.
              - 'p-4': Adds padding around the entire main content area (between sidebar/edges and the content box).
          */}
          <main className='flex-grow p-4 overflow-y-auto'>
            {/* Content Wrapper: This div is where the actual 'children' (page content) will reside.
                - 'w-full': Ensures this div takes the full width of its parent (the <main> tag).
                - 'h-full': Ensures it fills the available height.
                - 'overflow-y-auto': Makes this specific box scrollable if its content is too tall.
            */}
            <div className='border-sidebar-border bg-sidebar border shadow rounded-md w-full h-full'>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Sidebarlayout