'use server';
import { createGroq } from '@ai-sdk/groq';
import { streamText, tool, generateText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { z } from 'zod';
import { db } from '@/server/db';
import { generateEmbedding } from '@/lib/gemini';

// Configure Groq provider
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Tavily API configuration
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Files to skip (large or not useful for context)
const SKIP_FILES = [
  'package-lock.json',
  'package.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env',
  '.env.local',
];

// Max file size to read (in characters) - keep under token limits for free tier
const MAX_FILE_CONTENT_LENGTH = 1500;

// File reference type (matches askQuestion format)
export type FileReference = {
  fileName: string;
  sourceCode: string;
  summary: string;
};

export async function agentAddFeature(
  componentDescription: string,
  projectId: string
) {
  const stream = createStreamableValue<string>();
  const filesReferencesStream = createStreamableValue<FileReference[]>();
  const filesReferences: FileReference[] = [];

  // Get all files in the project for the file tree
  const projectFiles = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: { fileName: true, summary: true },
  });

  const fileTree = projectFiles
    .map((f) => f.fileName)
    .filter((name) => !SKIP_FILES.some((skip) => name.includes(skip)))
    .sort()
    .join('\n');



  // Define tools
  const readFileTool = tool({
    description:
      'Read the contents of a specific file from the codebase. Use this to understand implementation details and patterns.',
    parameters: z.object({
      fileName: z
        .string()
        .describe('The file path to read (e.g., "src/components/ui/button.tsx")'),
    }),
    execute: async ({ fileName }) => {
      try {
        const file = await db.sourceCodeEmbedding.findFirst({
          where: {
            projectId,
            fileName: { contains: fileName, mode: 'insensitive' },
          },
          select: { fileName: true, sourceCode: true, summary: true },
        });

        if (!file) {
          const result = { success: false, error: `File "${fileName}" not found.` };
          return result;
        }

        // Truncate large files
        const content =
          file.sourceCode.length > MAX_FILE_CONTENT_LENGTH
            ? file.sourceCode.slice(0, MAX_FILE_CONTENT_LENGTH) + '\n// ... truncated'
            : file.sourceCode;

        const result = {
          success: true,
          fileName: file.fileName,
          summary: file.summary,
          content,
        };

        // Add to files references if not already present
        if (!filesReferences.some(f => f.fileName === file.fileName)) {
          filesReferences.push({
            fileName: file.fileName,
            sourceCode: content,
            summary: file.summary,
          });
          console.log(`[Agent] Added file to references: ${file.fileName}. Total files: ${filesReferences.length}`);
          filesReferencesStream.update([...filesReferences]);
        }

        return result;
      } catch (error) {
        const result = { success: false, error: 'Failed to read file.' };
        return result;
      }
    },
  });

  const searchCodebaseTool = tool({
    description:
      'Search the codebase semantically to find files related to a concept.',
    parameters: z.object({
      query: z.string().describe('What to search for (e.g., "authentication", "button component")'),
    }),
    execute: async ({ query }) => {
      try {
        const queryVector = await generateEmbedding(query);
        const vectorQuery = `[${queryVector.join(',')}]`;

        const results = (await db.$queryRaw`
          SELECT "fileName", "summary", "sourceCode",
          1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
          FROM "SourceCodeEmbedding"
          WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
          AND "projectId" = ${projectId}
          ORDER BY similarity DESC
          LIMIT 5
        `) as { fileName: string; summary: string; sourceCode: string; similarity: number }[];

        // Add searched files to references so they show in the UI
        for (const r of results) {
          if (!filesReferences.some(f => f.fileName === r.fileName)) {
            const truncatedCode = r.sourceCode.length > MAX_FILE_CONTENT_LENGTH
              ? r.sourceCode.slice(0, MAX_FILE_CONTENT_LENGTH) + '\n// ... truncated'
              : r.sourceCode;
            filesReferences.push({
              fileName: r.fileName,
              sourceCode: truncatedCode,
              summary: r.summary,
            });
            console.log(`[Agent] Added searched file to references: ${r.fileName}. Total files: ${filesReferences.length}`);
          }
        }
        filesReferencesStream.update([...filesReferences]);

        const result = {
          success: true,
          results: results.map((r) => ({
            fileName: r.fileName,
            summary: r.summary.slice(0, 150),
            relevance: Math.round(r.similarity * 100) + '%',
          })),
        };

        return result;
      } catch (error) {
        const result = { success: false, error: 'Search failed.' };
        return result;
      }
    },
  });

  const getFileTreeTool = tool({
    description: 'Get the file tree structure of the project.',
    parameters: z.object({
      directory: z.string().optional().describe('Optional: Filter by directory'),
    }),
    execute: async ({ directory }) => {
      try {
        const files = await db.sourceCodeEmbedding.findMany({
          where: {
            projectId,
            ...(directory && { fileName: { startsWith: directory, mode: 'insensitive' } }),
          },
          select: { fileName: true },
          orderBy: { fileName: 'asc' },
        });

        const filteredFiles = files
          .map((f) => f.fileName)
          .filter((name) => !SKIP_FILES.some((skip) => name.includes(skip)));

        const result = { success: true, totalFiles: filteredFiles.length, files: filteredFiles.slice(0, 30) };
        return result;
      } catch (error) {
        const result = { success: false, error: 'Failed to get file tree.' };
        return result;
      }
    },
  });

  const webSearchTool = tool({
    description:
      'Search the web using Tavily for current information, best practices, documentation, or solutions. Use this when you need external knowledge not in the codebase.',
    parameters: z.object({
      query: z.string().describe('The search query (e.g., "Next.js 14 server actions best practices")'),
      searchDepth: z.enum(['basic', 'advanced']).optional().describe('Search depth - basic for quick results, advanced for comprehensive'),
    }),
    execute: async ({ query, searchDepth = 'basic' }) => {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query,
            search_depth: searchDepth,
            include_answer: true,
            max_results: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        const result = {
          success: true,
          answer: data.answer || 'No direct answer available',
          results: data.results?.slice(0, 5).map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content?.slice(0, 300),
          })) || [],
        };

        return result;
      } catch (error) {
        console.error('Tavily search error:', error);
        const result = { success: false, error: 'Web search failed.' };
        return result;
      }
    },
  });

  // Run the agent in background
  (async () => {
    try {
      console.log('[Agent] Starting generation...');
      
      if (!process.env.GROQ_API_KEY) {
        console.error('[Agent] CRITICAL: GROQ_API_KEY is missing from environment variables');
      }

      const { fullStream } = await streamText({
        model: groq('llama-3.3-70b-versatile'),
        maxSteps: 6,
        maxTokens: 12000,
        system: `You are a Senior Software Architect AI assistant. Help developers add new features and components.

## MANDATORY First Steps (You MUST do these):
1. **REQUIRED**: Use get_file_tree to explore the project structure
2. **REQUIRED**: Use search_codebase to find related files (e.g., existing routes, components, APIs)
3. **REQUIRED**: Use read_file on AT LEAST 2-3 relevant files to understand existing patterns
4. Use web_search if you need external documentation or best practices

## Workflow:
1. Analyze the user's request carefully
2. Use get_file_tree to explore the project structure
3. **YOU MUST use read_file** to examine relevant files - don't skip this step!
4. Use search_codebase to find similar implementations or related code
5. Use web_search when you need external knowledge (libraries, best practices, documentation)
6. Provide a detailed, context-aware implementation plan with COMPLETE CODE

## Project Structure:
\`\`\`
${fileTree.slice(0, 2000)}
\`\`\`

## Critical Guidelines:
- **YOU MUST USE read_file TOOL** - This is not optional! Read at least 2-3 relevant files
- ALWAYS use get_file_tree first to understand the project structure
- ALWAYS use read_file to examine actual implementation patterns before suggesting code
- Use search_codebase to find similar features or components
- Use web_search for external documentation, npm packages, or best practices
- Tech stack: Assume on your own using the file patterns (e.g., Next.js, React, TypeScript)
- Maintain consistency with existing code patterns
- **MOST IMPORTANT**: Provide COMPLETE, PRODUCTION-READY code for ALL new files
- Include ALL imports, ALL functions, ALL exports - no placeholders or "..." in code
- Each code block should be copy-paste ready with FULL implementation

## Output Format (Markdown):
1. **Overview** - Brief summary of what will be implemented

2. **File Analysis** - Files you examined and key patterns found (mention which files you read)

3. **Complete File Implementations** - For EACH new/modified file, provide:
   ### \`path/to/file.ts\` (New File / Modified)
   \`\`\`typescript
   // COMPLETE file contents here
   // Include ALL imports
   // Include ALL code - no placeholders
   // Make it production-ready
   \`\`\`
   **Explanation**: What this file does and why

4. **Integration Steps** - Step-by-step instructions on:
   - Where to place each file
   - What to modify in existing files (with exact code changes)
   - How to wire everything together

5. **Dependencies** - Installation commands for any packages:
   \`\`\`bash
   npm install package-name
   \`\`\`

6. **Environment Variables** - Any required .env additions:
   \`\`\`
   VARIABLE_NAME=value
   \`\`\`

7. **Testing** - How to verify the implementation works
`,
        prompt: componentDescription,
        tools: {
          read_file: readFileTool,
          search_codebase: searchCodebaseTool,
          get_file_tree: getFileTreeTool,
          web_search: webSearchTool,
        },
        toolChoice: 'auto',
        onError: (error) => {
          console.error('[Agent] streamText internal error:', error);
        },
        onStepFinish: (event) => {
          console.log(`[Agent] Step finished. Type: ${event.stepType}`);
          if (event.toolCalls?.length) {
            console.log(`[Agent] Tool calls: ${event.toolCalls.map(t => t.toolName).join(', ')}`);
          }
          if (event.toolResults?.length) {
            console.log(`[Agent] Tool results: ${event.toolResults.length}`);
          }
        },
        onFinish: (event) => {
          console.log('[Agent] Generation finished. Usage:', JSON.stringify(event.usage, null, 2));
          console.log('[Agent] Finish reason:', event.finishReason);
          console.log('[Agent] Full text length:', event.text.length);
        },
      });

      let eventCount = 0;
      for await (const part of fullStream) {
        eventCount++;
        if (part.type === 'text-delta') {
          stream.update(part.textDelta);
        } else if (part.type === 'error') {
          console.error('[Agent] Stream error event:', part.error);
        } else if (part.type === 'finish') {
          console.log('[Agent] Stream finish event. Reason:', part.finishReason);
        } else {
          // Log other events (tool-call, tool-result, etc.) to see activity
          console.log(`[Agent] Stream event: ${part.type}`);
        }
      }
      console.log(`[Agent] Stream completed. Total events: ${eventCount}`);
      stream.done();
      filesReferencesStream.done();
    } catch (error) {
      console.error('[Agent] Fatal error:', error);
      if (error instanceof Error) {
        console.error('[Agent] Error stack:', error.stack);
      } else {
        console.error('[Agent] Unknown error object:', JSON.stringify(error, null, 2));
      }
      stream.error(error);
      filesReferencesStream.error(error);
    }
  })();

  return {
    output: stream.value,
    filesReferences: filesReferencesStream.value,
  };
}
