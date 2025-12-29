// src/app/(protected)/dashboard/addFeatures/page.tsx
'use client';
import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import useProject from '@/hooks/use-project';
import { toast } from 'sonner';
import { readStreamableValue } from 'ai/rsc';
import { api } from '@/trpc/react';
import { agentAddFeature } from '@/app/api/agent/add-feature/route';
import { ProjectSelector } from '../project-selector';
import CodeReferences from '../code-references';

const AddFeatures = () => {
  const { project } = useProject();
  const [componentDescription, setComponentDescription] = React.useState('');
  const [isResultsDialogOpen, setIsResultsDialogOpen] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<{ fileName: string; sourceCode: string; summary: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState('');
  const saveAnswer = api.project.saveAnswer.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!project?.id) {
      toast.error('Project not loaded. Please select a repository.');
      return;
    }

    if (!componentDescription.trim()) {
      toast.error('Please describe the what you want to change in this repository.');
      return;
    }

    // Reset state
    setFilesReferences([]);
    setAiOutput('');
    setIsLoading(true);
    setIsResultsDialogOpen(true);

    try {
      // Call the agentic server action
      const { output, filesReferences: filesRefsStream } = await agentAddFeature(componentDescription, project.id);

      // Stream the AI response
      const outputPromise = (async () => {
        for await (const delta of readStreamableValue(output)) {
          if (delta) {
            setAiOutput((prev) => prev + delta);
          }
        }
      })();

      // Stream the file references
      const filesPromise = (async () => {
        for await (const files of readStreamableValue(filesRefsStream)) {
          if (files) {
            setFilesReferences(files);
          }
        }
      })();

      // Wait for both streams to complete
      await Promise.all([outputPromise, filesPromise]);
    } catch (error) {
      console.error('Agent error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const question = `: ${componentDescription}`;

  return (
    <>
      <div className="w-[100vw]"></div>
      <ProjectSelector />

      {/* Dialog for displaying AI Agent Workflow */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] flex flex-col h-full max-h-[95vh] p-4">
          <DialogHeader className="mb-2">
            <div className="flex items-center justify-between px-6">
              <DialogTitle>GitBot Agent</DialogTitle>

              <Button
                disabled={saveAnswer.isPending || aiOutput.length === 0}
                variant={'outline'}
                onClick={() => {
                  if (!project?.id) {
                    toast.error('Project ID not found. Cannot save.');
                    return;
                  }
                  saveAnswer.mutate(
                    {
                      projectId: project.id,
                      question,
                      answer: aiOutput,
                      filesReferences,
                    },
                    {
                      onSuccess: () => {
                        toast.success('Answer saved!');
                      },
                      onError: () => {
                        toast.error('Failed to save answer!');
                      },
                    }
                  );
                }}
              >
                {saveAnswer.isPending ? 'Saving...' : 'Save Answer'}
              </Button>
            </div>
          </DialogHeader>

          {/* Main content area */}
          <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
            {/* MDEditor.Markdown Column - Implementation Plan */}
            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
              <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">
                Implementation Plan
              </h3>
              <div className="flex-grow overflow-y-auto p-2">
                {isLoading && aiOutput.length === 0 ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <MDEditor.Markdown
                    source={aiOutput}
                    className="prose prose-sm md:prose-base lg:prose-lg xl:prose-xl max-w-none bg-white text-black"
                  />
                )}
              </div>
            </div>

            {/* CodeReferences Column */}
            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
              <h3 className="p-2 text-lg font-semibold bg-gray-100 dark:bg-gray-800 border-b rounded-t-md">
                Code References
              </h3>
              <div className="flex-grow overflow-y-auto p-2">
                <CodeReferences filesReferences={filesReferences} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={() => setIsResultsDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Card for input - matching askQuestions style */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Tell the agent what you want to build/change (e.g., 'Add a payment gateway')..."
              value={componentDescription}
              onChange={(e) => setComponentDescription(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={isLoading || !componentDescription.trim()}>
              {isLoading ? 'Agent Working...' : 'Run Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AddFeatures;