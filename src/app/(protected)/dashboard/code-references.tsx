'use client'
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import { lucario } from 'react-syntax-highlighter/dist/esm/styles/prism';
import React from 'react'

type Props = {
    filesReferences: { fileName: string; sourceCode: string; summary: string }[]
}

const CodeReferences = ({ filesReferences }: Props) => {
    // Initialize tab state. Ensure it's not undefined if filesReferences is empty.
    // We'll use useEffect to handle dynamic updates.
    const [tab, setTab] = React.useState(filesReferences[0]?.fileName || '');
        if(filesReferences.length===0)return null

    // Effect to set the default tab when filesReferences changes or on initial load
    
    
    return (
        <div className='h-full flex flex-col'>
            <Tabs value={tab} onValueChange={setTab} className="flex-grow flex flex-col">
                {/* Tab buttons (file names) */}
                <div className="overflow-x-auto flex gap-2 bg-gray-200 p-1 rounded-md mb-2">
                    {filesReferences.map(file => (
                        <button
                            onClick={() => setTab(file.fileName)}
                            key={file.fileName}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                                // --- Hover Color Change ---
                                // Default text color for non-selected tabs.
                                // On hover, change background to muted and text to foreground for better contrast.
                                'text-muted-foreground hover:bg-muted hover:text-foreground',
                                {
                                    // Active tab styling: primary background, primary foreground text.
                                    'bg-primary text-primary-foreground': tab === file.fileName,
                                }
                            )}
                        >
                            {file.fileName}
                        </button>
                    ))}
                </div>

                {/* Tab content (source code) */}
                {filesReferences.map(file => (
                    <TabsContent
                        key={file.fileName}
                        value={file.fileName}
                        className='flex-grow h-full m-0 p-0 !border-0 rounded-md'
                    >
                        <SyntaxHighlighter
                            language='typescript' // Consider dynamic language detection based on file.fileName
                            style={lucario}
                            className='!h-full !w-full overflow-auto rounded-md'
                        >
                            {file.sourceCode}
                        </SyntaxHighlighter>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default CodeReferences;