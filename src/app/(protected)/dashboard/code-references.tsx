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
    const [tab, setTab] = React.useState('');

    React.useEffect(() => {
        // Condition 1: If filesReferences is NOT empty AND
        //             (no tab is currently selected OR the current tab is no longer in the list)
        if (filesReferences.length > 0 && (!tab || !filesReferences.some(f => f.fileName === tab))) {
            // TypeScript still sees a theoretical possibility of filesReferences[0] being undefined
            // if filesReferences.length was 0 before this check in some very complex flow.
            // The non-null assertion operator `!` after `filesReferences[0]` tells TypeScript
            // "I know this won't be undefined here because I just checked the length."
            setTab(filesReferences[0]!.fileName); // <-- FIX APPLIED HERE
        }
        // Condition 2: If filesReferences IS empty AND a tab is currently selected
        else if (filesReferences.length === 0 && tab !== '') {
            setTab(''); // Clear the selected tab
        }
    }, [filesReferences, tab]);

    

    // Additional safeguard for immediate render cycles before useEffect updates `tab`
    // This is useful if filesReferences goes from empty to non-empty.
    if (!tab && filesReferences.length > 0) {
        setTab(filesReferences[0]!.fileName); // <-- FIX APPLIED HERE
        return null; // Return null for this render cycle to avoid rendering with an invalid `tab`
                     // The component will re-render immediately with the correct `tab`.
    }
    // This second check for `!tab && filesReferences.length === 0` is technically redundant
    // with the first `if (filesReferences.length === 0)` block, but harmless.
    // I'll remove it for conciseness as the first check covers it.

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
                                'text-muted-foreground hover:bg-muted hover:text-foreground',
                                {
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
                            language={getFileLanguage(file.fileName)}
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

// Helper function to dynamically determine language for SyntaxHighlighter
const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js': case 'jsx': return 'javascript';
        case 'ts': case 'tsx': return 'typescript';
        case 'py': return 'python';
        case 'java': return 'java';
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'go': return 'go';
        case 'rs': return 'rust';
        case 'json': return 'json';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'md': return 'markdown';
        case 'sh': case 'bash': return 'bash';
        case 'yml': case 'yaml': return 'yaml';
        default: return 'plaintext';
    }
};