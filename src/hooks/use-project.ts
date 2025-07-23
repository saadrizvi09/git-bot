import { api } from '@/trpc/react'
import React from 'react'
import {useLocalStorage} from 'usehooks-ts'

const useProject = () => {
  // Destructure 'refetch' from the useQuery hook result
  const { data: projects, refetch: refreshProjects } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage('gitbot-projectId', '');
  const project = projects?.find(project => project.id === projectId);

  return {
    projects,
    project,
    projectId,
    setProjectId,
    refreshProjects // Now, refreshProjects is correctly returned
  }
}

export default useProject;
