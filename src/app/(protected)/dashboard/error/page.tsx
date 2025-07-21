'use client'
import React from 'react';
import MDEditor from '@uiw/react-md-editor'; // For displaying markdown output
import { Button } from '@/components/ui/button'; // For the "Go" and "Close" buttons
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // For the results popup
import useProject from '@/hooks/use-project'; // To get the project ID for askQuestion
import { readStreamableValue } from 'ai/rsc'; // For streaming AI responses
import { toast } from 'sonner'; // For notifications
import { Loader } from 'lucide-react'; // For the spinning loader icon
import Image from 'next/image'; // For displaying GitBot logo in dialog header (if desired)
import CodeReferences from '../code-references';
import {  checkBugs } from '../actions';
import { api } from '@/trpc/react';

const Scanerror = () => {
  const { project } = useProject();
  const [loading, setLoading] = React.useState(false);
  const [scanAnswer, setScanAnswer] = React.useState(''); // State for the streamed answer
  const [scanFilesReferences, setScanFilesReferences] = React.useState<{ fileName: string; sourceCode: string; summary: string }[]>([]); // State for file references
  const [isResultsDialogOpen, setIsResultsDialogOpen] = React.useState(false); // State to control the results dialog
    const saveAnswer = api.project.saveAnswer.useMutation()
  const question = "SCANNED BUGS"; 
  const handleGoClick = async () => {
    setScanAnswer(''); // Clear previous results
    setScanFilesReferences([]);
    setLoading(true);
    setIsResultsDialogOpen(true); // Open the dialog immediately

    if (!project?.id) {
      toast.error('Project not loaded. Please select a repository.');
      setLoading(false);
      setIsResultsDialogOpen(false);
      return;
    }

    const fixedQuestion = "Give me all possible bugs in the repository, explaining them clearly ."; // The fixed question

    try {
      // Call the askQuestion function with the fixed question and project ID
      const { output, filesReferences: fetchedFilesReferences } = await checkBugs(fixedQuestion, project.id);

      setScanFilesReferences(fetchedFilesReferences);

      // Stream the answer into the state
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setScanAnswer(prev => prev + delta);
        }
      }
    } catch (error) {
      console.error("Error initiating bug scan:", error);
      toast.error('Failed to initiate scan. Please try again.');
      setIsResultsDialogOpen(false); // Close dialog on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
         <div className="w-[80vw]"></div>

      {/* The existing w-[80vw] div for positioning, as requested by the user */}

      {/* Main Container for the Scan Section */}
      <div className="flex flex-col pl-70 pt-10 justify-center w-[80vw] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="bg-white dark:bg-gray-800 shadow-xl w-[60vw] rounded-lg p-8 md:p-12  max-w-2xl text-center flex flex-col items-center">

          {/* Title/Header */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 ">
            Repository Bug Scanner
          </h1>

          {/* Description/Instruction */}
          <p className="text-lg md:text-xl text-black dark:text-gray-300 mb-10 leading-relaxed">
            Click the "Go" button to initiate a comprehensive scan of your repository
            for potential bugs, vulnerabilities, and code issues.
          </p>

          {/* The Big Centered Go Button */}
          <Button
            onClick={handleGoClick}
            disabled={ !project?.id} // Disable if loading or no project is selected
            className="
              relative
              w-36 h-36 md:w-48 md:h-48 rounded-full
              bg-gradient-to-br from-green-400 to-blue-600
              hover:from-green-500 hover:to-blue-700
              text-white font-bold text-3xl md:text-4xl
              flex items-center justify-center
              shadow-lg transform transition-all duration-300
              hover:scale-105 hover:shadow-2xl
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800
              overflow-hidden
            "
          >
            
              <span className="relative z-10"> GO </span>
            
          </Button>

          {/* Placeholder for future status/results */}
          
        </div>
      </div>

      {/* Dialog for displaying Scan Results */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className='sm:max-w-[80vw] flex flex-col h-full max-h-[95vh] p-4'>
          <DialogHeader className="mb-2">
                                  <div className="flex items-center justify-between px-6">
                                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                         GitBot Bug Scanner
                                      </DialogTitle>
                                                                        
                                      
                                      <Button 
                                          disabled={saveAnswer.isPending || scanAnswer.length === 0}
                                          variant={'outline'}
                                          onClick={() => {
                                              if (!project?.id) {
                                                  toast.error('Project ID not found. Cannot save.');
                                                  return;
                                              }
                                              saveAnswer.mutate({
                                                  projectId: project.id,
                                                  question,
                                                  answer:scanAnswer,
                                                  filesReferences:scanFilesReferences
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

          {/* Two-column layout for results: Answer (Markdown) and Code References */}
          <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
            {/* Answer Column */}
            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
              <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">Scan Report</h3>
              {/*
                Removed `items-center justify-center` from this div to allow content to start from the top.
                Removed `bg-white dark:bg-gray-800` from this div's classes.
              */}
              <div className="flex-grow overflow-y-auto p-2">
                {(loading && scanAnswer.length === 0) ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <MDEditor.Markdown
                    source={scanAnswer}
                    // RE-ADDED bg-white text-black here to match ask-question-card.tsx for consistent background
                    className='prose prose-sm md:prose-base lg:prose-lg xl:prose-xl max-w-none bg-white text-black'
                  />
                )}
              </div>
            </div>

            {/* Code References Column */}
            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
              <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">Relevant Code</h3>
              <div className="flex-grow overflow-y-auto p-2 bg-white dark:bg-gray-800"> {/* Retained bg for this side */}
                <CodeReferences filesReferences={scanFilesReferences} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type='button' onClick={() => { setIsResultsDialogOpen(false) }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Scanerror;