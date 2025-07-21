// src/components/dashboard/add-features.tsx
'use client'
import React from 'react';
import MDEditor from '@uiw/react-md-editor'; // For displaying AI output in markdown
import { Button } from '@/components/ui/button'; // Reusing your Button component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Reusing your Card components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // For the results popup
import { Textarea } from '@/components/ui/textarea'; // For user input
import useProject from '@/hooks/use-project'; // To get the current project ID
import { toast } from 'sonner'; // For user notifications
import { Loader } from 'lucide-react'; // For the spinning loader icon
import { readStreamableValue } from 'ai/rsc'; // For streaming AI responses
import CodeReferences from '../code-references';
import { addComponent } from '../actions';
import { api } from '@/trpc/react';

const AddFeatures = () => {
  const { project } = useProject();
  const [componentDescription, setComponentDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState('');
  const [contextFiles, setContextFiles] = React.useState<{ fileName: string; sourceCode: string; summary: string }[]>([]);
      const saveAnswer = api.project.saveAnswer.useMutation()
  
const question=`INFORMATION ABOUT ADDING COMPONENT:${componentDescription} `;
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAiOutput(''); // Clear previous output
    setContextFiles([]); // Clear previous references

    if (!project?.id) {
      toast.error('Project not loaded. Please select a repository.');
      return;
    }

    if (!componentDescription.trim()) {
      toast.error('Please describe the component you want to add.');
      return;
    }

    setLoading(true);
    setIsResultsDialogOpen(true); // Open the dialog immediately to show loading state

    try {
      // Call the new addComponent action
      const { output, filesReferences: fetchedFilesReferences } = await addComponent(componentDescription, project.id);

      setContextFiles(fetchedFilesReferences);

      // Stream the AI response
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAiOutput(prev => prev + delta);
        }
      }
    } catch (error) {
      console.error("Error adding component:", error);
      toast.error('Failed to get component recommendation. Please try again.');
      setIsResultsDialogOpen(false); // Close dialog on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
     <div className="w-[80vw]"></div>

      {/* Main Card for "Add a Component" input */}
      <Card className='w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700'>
        <CardHeader className="pb-4 text-center">
          <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Add a New Component
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-md mt-2">
            Describe the component you want to add, and GitBot will provide guidance.
          </p>
        </CardHeader>
        <CardContent className="pt-4 px-0 pb-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              placeholder='e.g., "A user profile card displaying name and email," or "A reusable modal for form submission."'
              value={componentDescription}
              onChange={e => setComponentDescription(e.target.value)}
              className='min-h-[60px] resize-y
                      border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-gray-100 dark:bg-gray-700
                      text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                      p-4 text-lg'
            />
            <Button
              type='submit'
              disabled={ !componentDescription.trim()}
             
            >
              
                Get Component Guidance
              
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dialog for displaying AI Guidance */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className='sm:max-w-[80vw] flex flex-col h-full max-h-[95vh] p-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl'>
          <DialogHeader className="mb-2">
                              <div className="flex items-center justify-between px-6">
                                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                      GitBot Component Guidance
                                  </DialogTitle>
                                  
                                  <Button 
                                      disabled={saveAnswer.isPending || aiOutput.length === 0}
                                      variant={'outline'}
                                      onClick={() => {
                                          if (!project?.id) {
                                              toast.error('Project ID not found. Cannot save.');
                                              return;
                                          }
                                          saveAnswer.mutate({
                                              projectId: project.id,
                                              question,
                                              answer:aiOutput,
                                              filesReferences:contextFiles
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

          {/* Two-column layout for Guidance and Context Files */}
          <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
            {/* AI Guidance Column */}
            <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-800">
              <h3 className="p-3 text-lg font-semibold bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-t-lg">Guidance</h3>
              {/*
                FIX APPLIED HERE:
                - Removed `items-center justify-center` from this div.
                - Added `bg-white dark:bg-gray-800` to this div to ensure consistent background on scroll.
              */}
              <div className="flex-grow overflow-y-auto p-4 bg-white dark:bg-gray-800">
                {(loading && aiOutput.length === 0) ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <MDEditor.Markdown
                    source={aiOutput}
                    className='prose prose-sm md:prose-base lg:prose-lg xl:prose-xl max-w-none bg-white text-black'
                  />
                )}
              </div>
            </div>

            {/* Context Code References Column */}
            <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-800">
              <h3 className="p-3 text-lg font-semibold bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-t-lg">Context Files</h3>
              <div className="flex-grow overflow-y-auto p-4 bg-white dark:bg-gray-800">
                <CodeReferences filesReferences={contextFiles} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type='button'
              onClick={() => { setIsResultsDialogOpen(false) }}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 rounded-md py-2 px-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddFeatures;