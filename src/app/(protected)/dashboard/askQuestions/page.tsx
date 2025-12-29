'use client'
import MDEditor from '@uiw/react-md-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import React from 'react'
import { readStreamableValue } from 'ai/rsc'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { askQuestion } from '../actions'
import CodeReferences from '../code-references'
import { ProjectSelector } from '../project-selector'

const AskQuestionCard = () => {
    const { project } = useProject()
    const [open, setOpen] = React.useState(false)
    const [question, setQuestion] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [filesReferences, setFilesReferences] = React.useState<{ fileName: string; sourceCode: string; summary: string }[]>([])
    const [answer, setAnswer] = React.useState('')
    const saveAnswer = api.project.saveAnswer.useMutation()

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setAnswer('') // Clear previous answer
        setFilesReferences([]) // Clear previous references
        e.preventDefault()

        if (!project?.id) {
            toast.error('Project not loaded. Please try again.')
            return
        }

        setLoading(true)
        setOpen(true) // Open dialog immediately to show loading state

        try {
            const { output, filesReferences: fetchedFilesReferences } = await askQuestion(question, project.id)

            setFilesReferences(fetchedFilesReferences)

            // Stream the answer
            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    setAnswer(ans => ans + delta)
                }
            }
        } catch (error) {
            console.error("Error asking question:", error);
            toast.error('Failed to get an answer. Please try again.');
            setOpen(false); // Close dialog on error or handle error display within dialog
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
             <div className="w-[80vw]"></div>
            <ProjectSelector />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-[80vw] flex flex-col h-full max-h-[95vh] p-4'>
                    <DialogHeader className="mb-2">
                        <div className="flex items-center justify-between px-6">
                            <DialogTitle>
                                GitBot 
                            </DialogTitle>
                            
                            <Button 
                                disabled={saveAnswer.isPending || answer.length === 0}
                                variant={'outline'}
                                onClick={() => {
                                    if (!project?.id) {
                                        toast.error('Project ID not found. Cannot save.');
                                        return;
                                    }
                                    saveAnswer.mutate({
                                        projectId: project.id,
                                        question,
                                        answer,
                                        filesReferences
                                    }, {
                                        onSuccess: () => {
                                            toast.success('Answer saved!');
                                        },
                                        onError: () => {
                                            toast.error('Failed to save answer!');
                                        }
                                    })
                                }}>
                                {saveAnswer.isPending ? 'Saving...' : 'Save Answer'}
                            </Button>
                           
                        </div>
                    </DialogHeader>

                    <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                        {/* MDEditor.Markdown Column */}
                        <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                            <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">Answer</h3>
                            <div className="flex-grow overflow-y-auto p-2">
                                 {(loading && answer.length === 0) ? (
                                    // Loader animation displayed when loading and no answer yet
                                    <div className="flex items-center justify-center h-full w-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : (
                                    <MDEditor.Markdown
                                        source={answer}
                                        className='prose prose-sm md:prose-base lg:prose-lg xl:prose-xl max-w-none bg-white text-black'
                                    />
                                )}
                            </div>
                        </div>

                        {/* CodeReferences Column */}
                        <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                            <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">Code References</h3>
                            <div className="flex-grow overflow-y-auto p-2">
                                <CodeReferences filesReferences={filesReferences} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button type='button' onClick={() => { setOpen(false) }}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Ask a question
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Textarea placeholder='Ask GitBot a question about your code...' value={question} onChange={e => setQuestion(e.target.value)}>
                        </Textarea>
                        <div className="h-4"> </div>
                        <Button type='submit' disabled={loading || !question.trim()}>
                            {loading ? 'Asking...' : 'Ask GitBot'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard;