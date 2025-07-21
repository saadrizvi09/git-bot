'use client'

import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import useProject from "@/hooks/use-project"
import { cn } from "@/lib/utils"
import { Bot, Bug, Plus, PlusCircle } from "lucide-react"
// import Image from "next/image" // Removed: Image is no longer used in this sidebar
import Link from "next/link"
import { usePathname } from "next/navigation"

const items=[
  {
    title:"Ask Questions", // Changed to "Dashboard" for consistency with navbar
    url:'/dashboard',
    icon:Bot,
  },
  {
    title:"Add Components",
    url:"/dashboard/addFeatures",
    icon:PlusCircle,
  },
  {
    title:"Bug Scanner", // Changed to "Payments" for consistency
    url:"/dashboard/error",
    icon: Bug,
  },
  
  
]

export function AppSidebar()
{
  const pathName=usePathname()
  const {open}=useSidebar();
  const {projects,projectId,setProjectId}= useProject()

  return (
    <Sidebar collapsible='icon' variant='floating'>
      <SidebarHeader>
        {/*
          Removed Image and GitBot h1 from here as they are now in the Navbar.
          Added pt-16 to this div to ensure sidebar content starts below the fixed navbar.
          Adjust pt-16 if your navbar's height is different.
        */}
        <div className='flex items-center gap-2 pt-16'> {/* Added pt-16 here */}
          {/* Content that remains in sidebar header, if any, goes here */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
           <strong >TOOLS</strong> 
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item=>{
                return(
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className={cn({
                        '!bg-primary !text-white': pathName=== item.url
                      },'list-none')}>
                        <item.icon className="h-5 w-5"/> {/* Added size for consistency */}
                        <span>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
           <strong>UPDATED REPOSITORIES</strong> 
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects?.map(project=>{
                return(
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton asChild>
                      <div onClick={()=> { setProjectId(project.id) }} className={cn(
                        'flex items-center gap-2', // Ensure it's a flex container
                        {
                          'bg-primary text-white':project.id===projectId // Adjusted from !bg-primary to just bg-primary for less aggression
                        }
                      )}>
                        <span>{project.name}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <div className="h-2"></div>
              <SidebarMenuItem>
                <Link href='/create'>
                  <Button size='sm' variant={'outline'} className='w-fit'>
                    <Plus className="h-4 w-4 mr-2"/> {/* Added icon size and margin */}
                    Add New Repository
                  </Button>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}