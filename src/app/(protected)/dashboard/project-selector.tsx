'use client'

import useProject from "@/hooks/use-project"
import { cn } from "@/lib/utils"
import { Plus, ChevronDown } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// GitHub SVG Icon Component
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

export function ProjectSelector() {
  const { project, projects, setProjectId } = useProject()

  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
        CURRENT PROJECT
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-md bg-black text-white cursor-pointer w-full max-w-md',
            'hover:bg-gray-800 transition-colors duration-200'
          )}>
            <GitHubIcon className="h-5 w-5 text-white flex-shrink-0" />
            <span className="truncate flex-grow">
              {project ? project.name : 'No Project Selected'}
            </span>
            <ChevronDown className="h-4 w-4 ml-auto flex-shrink-0" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[400px] bg-white shadow-lg rounded-md border border-gray-200">
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-gray-900">
              <Plus className="h-4 w-4" /> Add/Manage Repos
            </Link>
          </DropdownMenuItem>
          <div className="my-1 h-px bg-gray-200" />

          {projects && projects.length > 0 ? (
            projects.map((proj) => (
              <DropdownMenuItem
                key={proj.id}
                onClick={() => setProjectId(proj.id)}
                className={cn(
                  "cursor-pointer flex items-center gap-2 hover:bg-gray-100 focus:bg-gray-100 text-gray-900",
                  { "font-semibold text-gray-900": proj.id === project?.id }
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
    </div>
  )
}
