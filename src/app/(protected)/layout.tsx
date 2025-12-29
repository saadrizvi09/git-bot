'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import React from 'react'
import { AppSidebar } from './app-sidebar'
import { MainNavbar, isAiToolsPath } from './nav-bar'
import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

const Sidebarlayout = ({ children }: Props) => {
  const pathname = usePathname();
  const showSidebar = isAiToolsPath(pathname);

  return (
    <SidebarProvider>
      {/* Main Navbar: fixed at the top, two-layered (h-14 + ~h-12 = ~104px total) */}
      <MainNavbar />

      {/* Content area below the fixed navbar with extra padding */}
      <div className="flex flex-col min-h-screen bg-gray-50 pt-[128px]">
        <div className="flex flex-grow overflow-hidden">
          {/* Sidebar only shows when in AI Tools section */}
          {showSidebar && <AppSidebar />}

          <main className='flex-grow overflow-y-auto'>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Sidebarlayout