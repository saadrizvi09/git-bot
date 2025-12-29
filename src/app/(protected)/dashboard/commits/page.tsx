'use client'
import useProject from '@/hooks/use-project'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'
import { ExternalLink, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { ProjectSelector } from '../project-selector'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const CommitsPage = () => {
  const { projectId, project } = useProject()
  const { data: commits, refetch, isLoading: isLoadingCommits } = api.project.getCommits.useQuery({ projectId })
  
  const fetchNewCommits = api.project.fetchNewCommits.useMutation({
    onSuccess: (data) => {
      toast.success(`Fetched ${data.newCommitsCount} new commits!`)
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch new commits')
    }
  })

  const handleFetchNewCommits = () => {
    if (!projectId) {
      toast.error('Please select a project first')
      return
    }
    fetchNewCommits.mutate({ projectId })
  }

  return (
    <>
      <div className="w-[80vw]"></div>
      <ProjectSelector />

      {/* Header with Fetch Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Commit History
        </h1>
        <Button
          onClick={handleFetchNewCommits}
          disabled={fetchNewCommits.isPending || !projectId}
          variant="outline"
          className="gap-2"
        >
          {fetchNewCommits.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Fetch New Commits
            </>
          )}
        </Button>
      </div>

      {/* Commits List */}
      {isLoadingCommits ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : commits && commits.length > 0 ? (
        <ul className='space-y-6'>
          {commits.map((commit, commitIdx) => (
            <li key={commit.id} className='relative flex gap-x-4'>
              <div className={cn(
                commitIdx === commits.length - 1 ? 'h-6' : 'bottom-6',
                'absolute left-0 top-0 flex w-6 justify-center'
              )}>
                <div className='w-px translate-x-1 bg-gray-200'></div>
              </div>
              <>
                <img 
                  src={commit.commitAuthorAvatar || '/default-avatar.png'} 
                  alt='commit avatar' 
                  className='relative mt-4 size-8 flex-none rounded-full bg-gray-50'
                />
                <div className="flex-auto rounded-md bg-white p-3 ring-1 ring-inset ring-gray-200">
                  <div className='flex justify-between gap-x-4'>
                    <Link 
                      target='_blank' 
                      href={`${project?.githubUrl}/commits/${commit.commitHash}`} 
                      className='py-0.5 text-xs leading-5 text-gray-500 hover:text-gray-700'
                    >
                      <span className='font-medium text-gray-900'>
                        {commit.commitAuthorName}
                      </span>{" "}
                      <span className='inline-flex items-center'>
                        committed
                        <ExternalLink className='ml-1 h-3 w-3' />
                      </span>
                    </Link>
                    <time className='text-xs text-gray-500'>
                      {commit.commitDate ? new Date(commit.commitDate).toLocaleDateString() : ''}
                    </time>
                  </div>
                  <span className='font-semibold text-gray-900'>
                    {commit.commitMessage}
                  </span>
                  <pre className='mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500'>
                    {commit.summary}
                  </pre>
                </div>
              </>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No commits found for this project.</p>
          <p className="mt-2 text-sm">Click "Fetch New Commits" to sync from GitHub.</p>
        </div>
      )}
    </>
  )
}

export default CommitsPage
