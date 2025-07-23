import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import pLimit from 'p-limit';

// --- Global Rate Limiter for all Gemini API calls ---
// IMPORTANT: Drastically slowing down to stay within free tier limits (15 RPM).
// Setting concurrency to 1 and adding a delay of 4 seconds per call.
export const geminiApiLimiter = pLimit(1); // Set concurrency to 1

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2!);

const textModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

// Helper function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Wrapper function to apply rate limiting and delay to text generation calls ---
async function generateContentWithRateLimit(prompt: string | any[]) {
    return await geminiApiLimiter(async () => {
        try {
            const response = await textModel.generateContent(prompt);
            console.log("Gemini text generation successful. Adding delay...");
            await delay(4000); // Wait 4 seconds after the call
            return response;
        } catch (error) {
            console.error("Error during text generation:", error);
            // Re-throw or handle error as per your existing logic
            throw error;
        }
    });
}

// --- Wrapper function to apply rate limiting and delay to embedding calls ---
export async function generateEmbedding(text: string): Promise<number[]> {
    return await geminiApiLimiter(async () => {
        try {
            console.log(`Generating embedding for text length: ${text.length}`);
            const result = await embeddingModel.embedContent(text);
            if (result.embedding && result.embedding.values) {
                console.log("Gemini embedding successful. Adding delay...");
                await delay(4000); // Wait 4 seconds after the call
                return result.embedding.values;
            } else {
                console.error("Embedding result did not contain expected values:", result);
                return [];
            }
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }
    });
}

// --- aisummariseCommit and summariseCode remain largely the same,
// as they call generateContentWithRateLimit which now handles the delay ---

export const aisummariseCommit = async (diff: string) => {
    const prompt = `
        You are an expert programmer, and you are trying to summarize a git diff
        Example Summary comments
        \`\`\`
        *Raised the amount of returned recording from \`10\` to \`100\`[packages/serverrecordings_api.ts],[packages/server/constants.ts]
        *Fixed a typo in the github action name[.github/workflow/gpt-commit-summariser.yml]
        \`\`\`
        Please summarise the following diff file: \n\n${diff}`;

    const response = await generateContentWithRateLimit(prompt);
    const text = response.response.text();
    return text;
};

export async function summariseCode(doc: Document) {
    console.log("getting summary for", doc.metadata.source);
    try {
        const code = doc.pageContent;
        console.log(`Attempting to summarize ${doc.metadata.source} with code length: ${code.length}`);
        
        const response = await generateContentWithRateLimit([
            `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
            Here is the code:
            ---
            ${code}
            ---
            Give a very deep summary(Give directly, don't use Okay, alright etc) of code in the file explaining each stuff.
            **Very Important- If there is any bug, give the bug in detail after the summary`,
        ]);

        if (response.response && response.response.text) {
            return response.response.text();
        } else {
            console.error("Gemini API Response did not contain expected text:", response);
            return '';
        }
    } catch (error: any) {
        console.error(`!!!! ERROR summarizing file: ${doc.metadata.source} !!!!`);
        console.error("Error details:", error);
        // ... (existing error logging)
        return '';
    }
}