'use client'
import useProject from '@/hooks/use-project'
import { useUser } from '@clerk/nextjs'
import { ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import AskQuestionCard from './ask-question-card'

const DashboardPage = () => {
    const {project}= useProject()

  return (
    <div>
       <div className="w-[80vw]"></div>

    <div className='flex items-center justify-between flex-wrap gapy-y-4'>
      <div className='w-fit rounded-mg bg-primary px-4 py-3'>
        <div className="flex items-center">

        
        <Github className='size-5 text-white'/>
      <div className="ml-2">
        <p className='text-sm font-medium text-white'>
          This Repository is linked to {''}
          <Link href={project?.githubUrl ?? ""} className='inline-flex
          items-center text-white/80 hover:underline'>
            {project?.githubUrl}
            <ExternalLink className='ml-1 size-4'/>
          </Link>
        </p>
      </div>
      </div>
      </div>

      <div className="h-4">
      </div>
      
    
   
    </div>
    <div className="mt-4">
      <div className="flex-1 p-6 overflow-y-auto">
        <AskQuestionCard/>
      </div>
    </div>
    
    </div>
  )
}

export default DashboardPage
