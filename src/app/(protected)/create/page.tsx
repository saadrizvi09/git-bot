'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useRefetch from '@/hooks/use-refetch'
import { api } from '@/trpc/react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

type FormInput = {
  repoUrl: string
  projectName: string
  githubToken?: string
}

const CreatePage = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput>({
    defaultValues: {
      repoUrl: '',
      projectName: '',
      githubToken: '',
    }
  })
  const createProject = api.project.createProject.useMutation()
  const refetch = useRefetch()

  // Fetch current user points
  const {
    data: userPointsData,
    isLoading: isLoadingPoints,
    error: pointsError,
  } = api.project.getMyCredits.useQuery()

  const hasEnoughPoints = (userPointsData?.points ?? 0) > 0
  const isDisabled = createProject.isPending || !hasEnoughPoints

  function onSubmit(data: FormInput) {
    if (!hasEnoughPoints) {
      toast.error('Not enough points to create a project')
      return false
    }

    toast.message('Creating project.. This may take a few minutes')
    createProject.mutate(
      {
        githubUrl: data.repoUrl,
        name: data.projectName,
        gitHubToken: data.githubToken,
      },
      
      {
        
        onSuccess: () => {
          toast.success('Project created successfully!')
          refetch()
          reset()
        },
        onError: (error) => {
          toast.error(`Failed to create project: ${error.message || 'Unknown error'}`)
        },
      },
    )
    return true
  }

  return (
    <>
     <div className="w-[100vw]"></div>

    <div className="flex justify-center p-4 md:p-8 min-h-[calc(100vh-64px)] items-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Link your GitHub Repository</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter the URL of your repository and a project name to link it to GitBot.
          </CardDescription>
          
          {/* Points Display */}
          <div className="pt-2">
            {isLoadingPoints ? (
              <p className="text-sm text-muted-foreground">Loading your points...</p>
            ) : pointsError ? (
              <p className="text-sm text-red-500">Error loading points</p>
            ) : (
              <p className="text-sm font-medium">
                Available points: <span className="text-primary font-bold">{userPointsData?.points ?? 0}</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasEnoughPoints && !isLoadingPoints && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have enough points to create a project. Please purchase points first.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                {...register('projectName', { required: 'Project name is required' })}
                placeholder=""
                aria-invalid={errors.projectName ? "true" : "false"}
                autoComplete="new-text"
                disabled={isDisabled}
              />
              {errors.projectName && (
                <p className="text-red-500 text-sm">{errors.projectName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="repoUrl">GitHub Repository URL</Label>
              <Input
                id="repoUrl"
                {...register('repoUrl', {
                  required: 'Repository URL is required',
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$/,
                    message: 'Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)',
                  },
                })}
                placeholder=""
                type="url"
                aria-invalid={errors.repoUrl ? "true" : "false"}
                autoComplete="url-new"
                disabled={isDisabled}
              />
              {errors.repoUrl && (
                <p className="text-red-500 text-sm">{errors.repoUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubToken">GitHub Token   <p className="text-muted-foreground text-xs">
                (Provide a GitHub Personal Access Token to avoid API rate limits)
              </p></Label>
              <Input
                id="githubToken"
                {...register('githubToken')}
                placeholder=""
                autoComplete="new-password"
                disabled={isDisabled}
              />
            
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isDisabled}
            >
              {createProject.isPending ? 'Creating Project...' : 
               !hasEnoughPoints ? 'Not Enough Points' : 'Create Project'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  )
}

export default CreatePage