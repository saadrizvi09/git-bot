import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import { Mistral } from '@mistralai/mistralai';
import pLimit from 'p-limit';


const geminiApiKey = process.env.GEMINI_API_KEY;
const mistralApiKey = process.env.MISTRAL_API_KEY;
export const geminiApiLimiter = pLimit(1); // Set concurrency to 1

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;
if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey);
} else {
  console.error('GEMINI_API_KEY is not set. Gemini features will not work.');
}

// Initialize Mistral AI client
let mistralClient: Mistral | null = null;
if (mistralApiKey) {
  mistralClient = new Mistral({ apiKey: mistralApiKey });
} else {
  console.error('MISTRAL_API_KEY is not set. Mistral AI features will not work.');
}

// --- Gemini Models ---
// Using the recommended embedding model for Gemini
const embeddingModel = genAI ? genAI.getGenerativeModel({ model: "gemini-embedding-001" }) : null;

// --- Mistral AI Rate Limiter (60 RPM) ---
// This is a simple in-memory rate limiter. For production in serverless,
// consider a distributed rate limiter (e.g., backed by Redis).
const MISTRAL_RATE_LIMIT_RPM = 60;
const MISTRAL_RATE_LIMIT_MS = (60 / MISTRAL_RATE_LIMIT_RPM) * 1000; // Time per request in ms

let lastMistralRequestTime = 0;

async function applyMistralRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastMistralRequestTime;

  if (timeSinceLastRequest < MISTRAL_RATE_LIMIT_MS) {
    const timeToWait = MISTRAL_RATE_LIMIT_MS - timeSinceLastRequest;
    console.warn(`Mistral AI client-side rate limit hit. Waiting for ${timeToWait.toFixed(0)}ms.`);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  lastMistralRequestTime = Date.now(); // Update last request time after waiting
}

// --- Constants for Model Input Limits ---
// Mistral-large-latest has a context window of 131,072 tokens.
// Assuming ~4 characters per token, this is roughly 524,288 characters.
// We'll set a conservative limit to account for prompt overhead.
const MAX_MODEL_INPUT_CHARS = 500000; // Approximately 125,000 tokens for the input content

// --- Exponential Backoff for Mistral AI ---
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000; // 1 second

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check if it's a Mistral SDK error and a 429 status code
    if (error && error.statusCode === 429 && retries < MAX_RETRIES) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, retries) + Math.random() * 1000; // Exponential + jitter
      console.warn(`Mistral AI server-side rate limit hit. Retrying in ${delay.toFixed(0)}ms (retry ${retries + 1}/${MAX_RETRIES}).`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithExponentialBackoff(fn, retries + 1);
    }
    throw error; // Re-throw if not a 429 or max retries reached
  }
}


// --- Wrapper function for Gemini Embedding (no explicit rate limiting here) ---
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!geminiApiKey || !embeddingModel) {
        console.error('Gemini API key not configured or embedding model not initialized.');
        return [];
    }
    try {
        console.log(`Generating embedding for text length: ${text.length}`);
        const result = await embeddingModel.embedContent(text);
        if (result.embedding && result.embedding.values) {
            return result.embedding.values;
        } else {
            console.error("Embedding result did not contain expected values:", result);
            return [];
        }
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

// --- aisummariseCommit now uses Mistral AI ---
export const aisummariseCommit = async (diff: string) => {
    if (!mistralApiKey || !mistralClient) {
        console.error('Mistral AI API key not configured or client not initialized.');
        return '';
    }

    let processedDiff = diff;
    if (diff.length > MAX_MODEL_INPUT_CHARS) {
        console.warn(`Commit diff too large (${diff.length} chars). Truncating to ${MAX_MODEL_INPUT_CHARS} chars.`);
        processedDiff = diff.substring(0, MAX_MODEL_INPUT_CHARS);
        // Optionally, add a note to the summary indicating truncation
        processedDiff += "\n\n... (Diff truncated due to length limit)";
    }

    const prompt = `
        You are an expert programmer, and you are trying to summarize a git diff
        Example Summary comments
        \`\`\`
        *Raised the amount of returned recording from \`10\` to \`100\`[packages/serverrecordings_api.ts],[packages/server/constants.ts]
        *Fixed a typo in the github action name[.github/workflow/gpt-commit-summariser.yml]
        \`\`\`
        Please summarise the following diff file: \n\n${processedDiff}`;

    try {
        const chatResponse = await retryWithExponentialBackoff(async () => {
            await applyMistralRateLimit(); // Apply client-side rate limit before calling Mistral AI
            return await mistralClient!.chat.complete({
                model: 'mistral-large-latest', // Using mistral-large-latest for commit summaries
                messages: [{ role: 'user', content: prompt }],
            });
        });

        const text = chatResponse.choices[0]?.message?.content;
        if (!text) {
            throw new Error('No summary generated by Mistral AI.');
        }
        return text;
    } catch (error: any) {
        console.error("Error during Mistral AI commit summarization:", error);
        throw error;
    }
};

// --- summariseCode now uses Mistral AI ---
export async function summariseCode(doc: Document) {
    console.log("getting summary for", doc.metadata.source);
    if (!mistralApiKey || !mistralClient) {
        console.error('Mistral AI API key not configured or client not initialized.');
        return '';
    }

    try {
        let processedCode = doc.pageContent;
        if (processedCode.length > MAX_MODEL_INPUT_CHARS) {
            console.warn(`Code content for ${doc.metadata.source} too large (${processedCode.length} chars). Truncating to ${MAX_MODEL_INPUT_CHARS} chars.`);
            processedCode = processedCode.substring(0, MAX_MODEL_INPUT_CHARS);
            // Optionally, add a note to the summary indicating truncation
            processedCode += "\n\n... (Code truncated due to length limit)";
        }

        const prompt = `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
            Here is the code:
            ---
            ${processedCode}
            ---
            Give a deep summary (Give directly, don't use Okay, alright etc) of code in the file explaining each stuff. Use as low amount of words as possible.
            **Very Important- If there is any bug, give the bug in detail after the summary`;

        const chatResponse = await retryWithExponentialBackoff(async () => {
            await applyMistralRateLimit(); // Apply client-side rate limit before calling Mistral AI
            return await mistralClient!.chat.complete({
                model: 'mistral-large-latest', // Using mistral-large-latest for code summarization
                messages: [{ role: 'user', content: prompt }],
            });
        });

        const text = chatResponse.choices[0]?.message?.content;
        if (!text) {
            throw new Error('No summary generated by Mistral AI.');
        }
        return text;
    } catch (error: any) {
        console.error(`!!!! ERROR summarizing file: ${doc.metadata.source} !!!!`);
        console.error("Error details:", error);
        return '';
    }
}