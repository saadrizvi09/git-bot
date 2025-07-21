'use client'

import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import useProject from "@/hooks/use-project"
import { cn } from "@/lib/utils"
import { Bot, Bug, Plus, PlusCircle, ChevronDown } from "lucide-react" // Import ChevronDown for the dropdown
import Link from "next/link"
import { usePathname } from "next/navigation"

// Shadcn UI dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// GitHub SVG Icon Component (re-used from previous responses)
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const items=[
  {
    title:"Ask Questions",
    url:'/dashboard/askQuestions',
    icon:Bot,
  },
  {
    title:"Add Components",
    url:"/dashboard/addFeatures",
    icon:PlusCircle,
  },
  {
    title:"Bug Scanner",
    url:"/dashboard/error",
    icon: Bug,
  },
]

export function AppSidebar()
{
  const pathName=usePathname()
  const {open}=useSidebar();
  const {project, projects, setProjectId}= useProject() // Get current project and all projects

  return (
    <Sidebar collapsible='icon' variant='floating'>
      <SidebarHeader>
        <div className='flex items-center gap-2 pt-16'>
          {/* Content that remains in sidebar header, if any, goes here */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* New "Current Project" section with Dropdown */}
        <SidebarGroup className="mb-4">
          <SidebarGroupLabel>
            <strong>CURRENT PROJECT</strong>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

            <SidebarMenuItem>
              {/* DropdownMenuTrigger to act as the clickable area for current project */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* Using a div that styles like a SidebarMenuButton and handles hover */}
                  <div className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md bg-black text-white cursor-pointer',
                      'hover:bg-primary hover:text-white transition-colors duration-200' // Apply hover styles
                      )}>
                    <GitHubIcon className="h-5 w-5 text-white" />
                    <span className="truncate flex-grow"> {/* flex-grow to push chevron to the right */}
                      {project ? project.name : 'No Project Selected'}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-auto" /> {/* Chevron for dropdown */}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white shadow-lg rounded-md border border-gray-200">
                    {/* Add a button to go to the dashboard to select/add projects */}
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-gray-900">
                            <Plus className="h-4 w-4" /> Add/Manage Repos
                        </Link>
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-gray-200" /> {/* Separator */}

                    {projects && projects.length > 0 ? (
                        projects.map((proj) => (
                            <DropdownMenuItem
                                key={proj.id}
                                onClick={() => setProjectId(proj.id)}
                                className={cn(
                                    "cursor-pointer flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-gray-900",
                                    { "font-semibold text-gray-900": proj.id === project?.id } // Highlight current project
                                )}
                            >
                                {proj.name}
                                {proj.id === project?.id && (
                                    <span className="ml-auto text-gray-800">✓</span>
                                )}
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled className="text-gray-500">
                            No other repositories found.
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
                        </SidebarMenu>

          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
           <strong>TOOLS</strong> 
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
                        <item.icon className="h-5 w-5"/>
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
        
      </SidebarContent>
    </Sidebar>
  )
}