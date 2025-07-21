'use client';

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Only Plus is needed from lucide-react now
import Link from "next/link";
import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// --- START: GitHub SVG Icon Component ---
// You can put this directly in this file, or in a separate file like components/GitHubIcon.tsx
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    className={className}
    fill="currentColor" // Ensures the icon takes on the text color from Tailwind
    aria-hidden="true" // Good for accessibility
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
// --- END: GitHub SVG Icon Component ---


export default function DashboardPage() {
  const { projects, projectId, setProjectId } = useProject();
  const router = useRouter();

  const handleProjectClick = (id: string) => {
    setProjectId(id);
    router.push(`/dashboard/askQuestions`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      <p className="text-lg text-gray-700 mb-8">Welcome to your dashboard! Here you can manage your tools and updated repositories.</p>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Updated Repositories</h2>
                     <div className="w-[70vw]"></div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg shadow-sm cursor-pointer",
                  "hover:shadow-md transition-all duration-200 group",
                  {
                    'bg-blue-50 border-blue-300 shadow-blue-200': project.id === projectId,
                    'bg-white': project.id !== projectId
                  }
                )}
              >
                {/* Replaced FolderClosed with GitHubIcon */}
                <GitHubIcon className={cn(
                  "h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200",
                  { 'text-blue-600': project.id === projectId }
                )}/>
                <span className={cn(
                  "mt-3 text-lg font-medium text-gray-800 text-center group-hover:text-blue-700 transition-colors duration-200",
                  { 'text-blue-900': project.id === projectId }
                )}>
                  {project.name}
                </span>
                {project.id === projectId && (
                  <span className="absolute top-2 right-2 text-xs text-blue-600 px-2 py-0.5 bg-blue-100 rounded-full">
                    Active
                  </span>
                )}
              </div>
            ))}
            <Link href='/create'>
              <div className={cn(
                "flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg shadow-sm cursor-pointer h-full",
                "hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all duration-200"
              )}>
                <Plus className="h-16 w-16 text-gray-400 hover:text-blue-500 transition-colors duration-200"/>
                <span className="mt-3 text-lg font-medium text-gray-600 text-center">
                  Add New Repository
                </span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg shadow-sm bg-gray-50 h-64">
            <Link href='/create' className="flex flex-col items-center gap-4 text-center">
              <Plus className="h-20 w-20 text-gray-400 hover:text-blue-500 transition-colors duration-200"/>
              <span className="text-xl font-semibold text-gray-700">
                Click here to Add Your First Repository!
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}