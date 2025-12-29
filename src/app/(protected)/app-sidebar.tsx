'use client'

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Bot, Bug, GitCommit, MessageSquare } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const toolItems = [
  {
    title: "Ask Questions",
    url: '/dashboard/askQuestions',
    icon: MessageSquare,
  },
  {
    title: "AI Agent",
    url: "/dashboard/addFeatures",
    icon: Bot,
  },
  {
    title: "Bug Scanner",
    url: "/dashboard/error",
    icon: Bug,
  },
  {
    title: "Commits",
    url: "/dashboard/commits",
    icon: GitCommit,
  },
]

export function AppSidebar()
{
  const pathName = usePathname()

  return (
    <Sidebar collapsible='icon' variant='floating' className='h-full border-r'>
      <SidebarContent className='pt-30'>
        <SidebarGroup>
          <SidebarGroupLabel>
            AI TOOLS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className={cn({
                      '!bg-primary !text-white': pathName === item.url || pathName.startsWith(item.url + '/')
                    }, 'list-none')}>
                      <item.icon className="h-5 w-5"/>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}