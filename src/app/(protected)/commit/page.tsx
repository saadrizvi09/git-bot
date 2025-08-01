'use client'
import useProject from '@/hooks/use-project'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const CommitLog = () => {
    const {projectId,project}=useProject()
    const {data:commits}=api.project.getCommits.useQuery({projectId})
  return (
    <>
         <div className="w-[80vw]"></div>

    <ul className='space-y-6'>
        {commits?.map((commit,commitIdx)=>
            {
                return <li key={commit.id} className='relative flex gap-x-4'>
                    
                    <div className={cn(
                        commitIdx ===commits.length-1 ?'h-6':'bottom-6',
                        'absolute left-0 top-0 flex w-6 justify-center'
                    )}>

                        <div className='w-px translate-x-1 bg-gray-200'>

                        </div>
                    </div>
                    <>
                    <img src={commit.commitAuthorAvatar} alt='commit avatar' className='relative mt-4 size-8 flex-none rounded-full bg-gray-50 '/>
                    <div className="flex-auto rounded-mg bg-white p-3 ring-1 ring-inset ring-gray-200">
                        <div className='flex justify-between gap-x-4'>
                            <Link target='_blank' href={`${project?.githubUrl}/commits/${commit.commitHash}`} className='py-0.5 text-xs loading-5 text-gray-500'>
                            <span className='font-medium text-gray-900'>
                                {commit.commitAuthorName}
                            </span>{" "}
                            <span className='inline-flex items-center'>
                                commited
                                <ExternalLink className='m-1 size4'>

                                </ExternalLink>
                            </span>
                            </Link>
                        </div>
                          <span className='font-semibold'>
                        {commit.commitMessage}
                    </span>
                    <pre className='mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500'>
                        {commit.summary}
                    </pre>
                    </div>
                  
                    </>
                </li>
            })}
    </ul>
    </>
  )
}

export default CommitLog
