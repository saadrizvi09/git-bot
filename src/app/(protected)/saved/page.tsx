'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import React from 'react'
import MDEditor from '@uiw/react-md-editor'
import CodeReferences from '../dashboard/code-references'
import { ProjectSelector } from '../dashboard/project-selector'

const QAPage = () => {
    const { projectId, project } = useProject()
    const { data: questions, isLoading, isError } = api.project.getQuestions.useQuery(
        { projectId },
        { enabled: !!projectId }
    )
    const [questionIndex, setQuestionIndex] = React.useState(0);
    const question = questions?.[questionIndex]

    return (
        <>
            <Sheet>
               
    
 <div className="w-[80vw]"></div>
                <ProjectSelector />
                <div className="h-4"></div> {/* Spacer */}

                <h1 className="text-xl font-semibold p-3">Saved </h1>
                <div className="h-2 "></div> {/* Spacer */}

                {/* Conditional rendering for saved questions or "no questions" message */}
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : isError ? (
                    <div className="text-center py-8 text-red-500">Error loading . Please try again.</div>
                ) : !questions || questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg shadow border text-center">
                        <p className="text-lg font-medium text-gray-700 mb-4">Nothing saved yet.</p>
                        <p className="text-gray-500">Start by asking a question in Ask Question tab</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 p-4">
                        {questions.map((q, index) => {
                            return (
                                <React.Fragment key={q.id}>
                                    <SheetTrigger onClick={() => setQuestionIndex(index)}>
                                        <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow border">
                                            <img className='rounded-full' height={30} width={30} src={q.user.imageUrl ?? ""} />
                                            <div className="text-left flex flex-col flex-grow">
                                                <div className="flex items-center gap-2">
                                                    <p className='text-gray-700 line-clamp-1 text-lg font-medium'>
                                                        {q.question}
                                                    </p>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {q.createdAt.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className='text-gray-500 line-clamp-1 text-sm'>
                                                    {q.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </SheetTrigger>
                                </React.Fragment>
                            )
                        })}
                    </div>
                )}

                {/* SheetContent: Displays the details of the selected question */}
                {question && (
                    <SheetContent
                        className='sm:max-w-[80vw] flex flex-col h-full max-h-[100vh] px-4 py-0'
                    >
                        <SheetHeader className="py-4">
                            <SheetTitle>
                                {question.question}
                            </SheetTitle>
                        </SheetHeader>

                        <div className="flex-grow flex flex-col md:flex-row gap-4 py-4 overflow-hidden">
                            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                                <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">Answer</h3>
                                <div className="flex-grow overflow-y-auto p-2">
                                    <MDEditor.Markdown
                                        source={question.answer}
                                        className='prose prose-sm md:prose-base lg:prose-lg xl:prose-xl max-w-none bg-white text-black'
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
                                <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">Code References</h3>
                                <div className="flex-grow overflow-y-auto p-2">
                                    <CodeReferences filesReferences={question.filesReferences ?? [] as any} />
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                )}
            </Sheet>
        </>
    )
}

export default QAPage;