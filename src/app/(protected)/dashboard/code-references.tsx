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
        if (filesReferences.length > 0 && (!tab || !filesReferences.some(f => f.fileName === tab))) {
         
            setTab(filesReferences[0]!.fileName);
        }
        else if (filesReferences.length === 0 && tab !== '') {
            setTab(''); 
        }
    }, [filesReferences, tab]);

    

    if (!tab && filesReferences.length > 0) {
        setTab(filesReferences[0]!.fileName); 
        return null; 
    }
  
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