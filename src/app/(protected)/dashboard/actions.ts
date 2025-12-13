'use server'
import {streamText} from 'ai'
import{createStreamableValue} from 'ai/rsc'
import{createGoogleGenerativeAI} from'@ai-sdk/google'
import { generateEmbedding, geminiApiLimiter } from '@/lib/gemini'
import { db } from '@/server/db'

// Initialize the Google Generative AI model for AI SDK,
// making sure to pass the rate limiter to its fetch calls.
const google = createGoogleGenerativeAI({
    apiKey:process.env.GEMINI_API_KEY_2,
    fetch: async (input, init) => {
        // This ensures every fetch request made by this AI SDK instance is rate-limited
        return geminiApiLimiter(() => fetch(input, init));
    }
})
export async function askQuestion(question: string, projectId: string) {
    const stream = createStreamableValue();

    // Define keywords to detect bug-related questions (case-insensitive)
    const bugKeywords = ['bug', 'error', 'vulnerability', 'issue', 'defect', 'fix bug', 'scan', 'debug','add'];
    const isBugRelatedQuestion = bugKeywords.some(keyword =>
        question.toLowerCase().includes(keyword)
    );

    let result: { fileName: string; sourceCode: string; summary: string }[] = [];
    let context = '';
    let promptOverride = ''; // To hold a specific message for bug-related questions

    if (isBugRelatedQuestion) {
        // If it's a bug-related question, do not fetch file references
        // result remains an empty array as initialized above
        console.log("Bug-related question detected. Skipping file reference fetching.");
        promptOverride = `
            Very Important: If the question is asking anything related to bugs or errors,
            reply with "I'm sorry, but I don't have the answer you are looking for."
            Do not provide any other information.
        `;
    } else {
        // Only generate embedding and query DB if not a bug-related question
        const queryVector = await generateEmbedding(question);
        const vectorQuery = `[${queryVector.join(',')}]`;

        result = await db.$queryRaw`
            SELECT "fileName","sourceCode","summary",
            1- ("summaryEmbedding"<=>${vectorQuery}::vector) AS similarity
            FROM "SourceCodeEmbedding"
            WHERE 1-("summaryEmbedding"<=> ${vectorQuery}::vector)> .5
            AND "projectId"=${projectId}
            ORDER BY similarity DESC
            LIMIT 10
        ` as { fileName: string; sourceCode: string; summary: string }[];

        for (const doc of result) {
            context += `source:${doc.fileName}\n code content:${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
        }
    }


    (async () => {
        try {
            const { textStream } = await streamText({
                model: google('gemini-2.5-flash'),
                prompt: `
                    You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern.
                    The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
                    AI is a well-behaved and well-mannered individual.
                    AI has the sum of all knowledge in their brain and is able to accurately answer nearly any question about any topics.
                    If the question is asking about code or a specific file, AI will provide the detailed answer, giving step-by-step instructions.
                    START OF CONTEXT BLOCK
                    ${context}
                    END OF CONTEXT BLOCK

                    START QUESTION
                    ${question}
                    END OF QUESTION
                    AI assistant will take into account any context block that is provided in a conversation.

                    If the context does not provide the answer to the question, AI assistant will say, "I'm sorry, but I don't know the answer."
                    AI assistant will not apologize for previous responses but instead will indicate new information was gained.
                    AI assistant will not invent anything that is not drawn directly from the context.
                    Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering.

                   
                    `
                    // The previous instruction regarding bugs is now handled by promptOverride.
                    // The conditional above makes sure it's only added if it's NOT a bug-related question
                    // according to our keywords, avoiding redundancy.
                ,
            });
            for await (const delta of textStream) {
                stream.update(delta);
            }
            stream.done();
        } catch (error) {
            console.error("Error in askQuestion streamText:", error);
            stream.error(error);
        }
    })()
    return {
        output:stream.value,
        filesReferences:result
    }
}

export async function checkBugs(question:string,projectId:string)
{
    const stream= createStreamableValue()

    // The generateEmbedding call is already rate-limited by the changes in gemini.ts
    const queryVector =await generateEmbedding(question)
    const vectorQuery =`[${queryVector.join(',')}]`

    const result = await db.$queryRaw`
        SELECT "fileName","sourceCode","summary",
        1- ("summaryEmbedding"<=>${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1-("summaryEmbedding"<=> ${vectorQuery}::vector)> .5
        AND "projectId"=${projectId}
        ORDER BY similarity DESC
        LIMIT 10

    `as {fileName:string;sourceCode:string;summary:string}[]

    let context=''
    for(const doc of result)
    {
        context += `source:${doc.fileName}\n code content:${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
    }

    (async ()=>{
        try {
            const{textStream} = await streamText({
                model:google('gemini-2.5-flash'), 
                prompt:`
                You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern.
                The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
                AI is a well-behaved and well-mannered individual.
                AI has the sum of all knowledge in their brain and is able to accurately answer nearly any question about any topics.
                If the question is asking about code or a specific file, AI will provide the detailed answer, giving step-by-step instructions.
                START OF CONTEXT BLOCK
                ${context}
                END OF CONTEXT BLOCK

                START QUESTION
                ${question}
                END OF QUESTION
                AI assistant will take into account any context block that is provided in a conversation.
                If the context does not provide the answer to the question, AI assistant will say, "I'm sorry, but I don't know the answer."
                AI assistant will not apologize for previous responses but instead will indicate new information was gained.
                AI assistant will not invent anything that is not drawn directly from the context.
                Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering.
               
                `,
            });
            for await(const delta of textStream)
            {
                stream.update(delta)
            }
            stream.done()
        } catch (error) {
            console.error("Error in askQuestion streamText:", error);
            stream.error(error); // Propagate the error to the client side
        }
    })()

    return {
        output:stream.value,
        filesReferences:result
    }
}
export async function addComponent(componentDescription: string, projectId: string) {
    const stream = createStreamableValue();

    let result: { fileName: string; sourceCode: string; summary: string }[] = [];
    let context = '';

    try {
        // Generate embedding for the component description
        const queryVector = await generateEmbedding(componentDescription);
        const vectorQuery = `[${queryVector.join(',')}]`;

        // Query the database for relevant files based on the component description.
        // These files serve as CONTEXT for the AI to understand the *functionality*
        // and surrounding code, not necessarily direct integration points.
        result = await db.$queryRaw`
            SELECT "fileName","sourceCode","summary",
            1- ("summaryEmbedding"<=>${vectorQuery}::vector) AS similarity
            FROM "SourceCodeEmbedding"
            WHERE 1-("summaryEmbedding"<=> ${vectorQuery}::vector)> .1
            AND "projectId"=${projectId}
            ORDER BY similarity DESC
            LIMIT 10
        ` as { fileName: string; sourceCode: string; summary: string }[];

        // Build context string from the fetched results
        for (const doc of result) {
            context += `source:${doc.fileName}\n code content:\n${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
        }

    } catch (dbError) {
        console.error("Error querying database for component context:", dbError);
        // We'll proceed without context if DB query fails, but log the error
    }

    // Start streaming the AI response
    (async () => {
        try {
             const{textStream} = await streamText({
                model:google('gemini-2.5-flash'), // This call is now rate-limited
                prompt:`
                You are an AI assistant specialized in full stack component architecture and integration.
                    Your task is to provide clear, step-by-step instructions on how and where to add a new component
                    into an existing codebase.

                    The user wants to add a component with the following description:
                    "${componentDescription}"

                If the question is asking about code or a specific file, AI will provide the detailed answer, giving step-by-step instructions.
                START OF CONTEXT BLOCK
                ${context}
                END OF CONTEXT BLOCK

                No specific relevant codebase context was provided. You should still provide general best practices for component integration in a React/Next.js project.
                    

                    Based on the component description and common React/Next.js project structures (e.g., \`src/components\`, \`src/features/[featureName]/components\`, \`src/app\` or \`src/pages\` for pages), explain in detail, formatted in markdown:

                    1.  **Recommended Component File Path:**
                        Provide a specific, logical file path where this new component file should be placed. Justify your choice based on the component's purpose (e.g., common UI element, specific feature part, page component) and standard React/Next.js project organization. Example: \`src/components/common/MyNewComponent.tsx\` or \`src/features/user/components/UserProfileCard.tsx\`.

                    2.  **Basic Component Code Structure:**
                        Provide a basic React functional component code structure for the component. Include typical imports (e.g., 'react', 'react-dom/client' if needed, UI components from shadcn/ui if relevant) and a simple functional component definition. Use TypeScript if tsx is implied, otherwise plain JavaScript.
                        Example:
                        \`\`\`typescript
                        // src/components/common/Button.tsx
                        import React from 'react';

                        interface ButtonProps {
                          label: string;
                          onClick: () => void;
                        }

                        const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
                          return (
                            <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white rounded">
                              {label}
                            </button>
                          );
                        };

                        export default Button;
                        \`\`\`

                    3.  **Integration Steps & Example Usage:**
                        Clearly explain how this component should typically be integrated into other parts of the application. Provide a simple JSX example showing its usage. This might include:
                        -   Where it should be imported (e.g., in a parent page or another feature component).
                        -   How it should be rendered (JSX example).
                        -   Considerations for passing props.
                        -   Briefly mention if routing or state management is relevant for this type of component.

                    4.  **Dependencies & Best Practices:**
                        Suggest any immediate or likely external dependencies (e.g., other UI components like Button, hooks like useState/useEffect, external libraries). Mention general best practices for component design, naming, and reusability (e.g., keeping components focused, using props effectively, avoiding prop drilling).

                    If, after considering the provided description and context, you cannot provide a reasonable suggestion, state: "I'm sorry, but I don't have enough information to provide a precise recommendation for adding this component."
                    Ensure all code snippets are within markdown code blocks (e.g., \`\`\`typescript ... \`\`\`).
                `,
            });
            for await (const delta of textStream) {
                stream.update(delta);
            }
            stream.done();
        } catch (error) {
            console.error("Error in addComponent streamText:", error);
            stream.error(error); // Propagate the error to the client side
        }
    })();

    return {
        output: stream.value,
        filesReferences: result // Return the files that were used as context for functionality
    };
}