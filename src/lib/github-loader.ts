import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'
import { Octokit } from 'octokit';
import {Document} from '@langchain/core/documents'
import { generateEmbedding, summariseCode } from './gemini'
import { db } from '@/server/db'

export const loadGithubRepo = async(githubUrl:string,githubToken?:string)=>
    {
        // Extract owner and repo from URL to detect default branch
        const [owner, repo] = githubUrl.split('/').slice(-2);
        
        // Use Octokit to get repository info and default branch
        const octokit = new Octokit({ auth: githubToken || process.env.GITHUB_TOKEN || '' });  
              const { data: repoInfo } = await octokit.rest.repos.get({
            owner: owner || '',
            repo: repo || ''
        });
        
        const defaultBranch = repoInfo.default_branch;
        
        const loader= new GithubRepoLoader(githubUrl,{
            accessToken:githubToken || '',
            branch: defaultBranch, // Use the actual default branch
            ignoreFiles:['package-lock.json','yarn-lock','pnpm-lock.yaml','bun.lockb'],
            recursive:true,
            unknown:'warn',
            maxConcurrency:5
        })
        const docs =await loader.load()
        return docs
    }

export const indexGithubRepo =async(projectId:string,githubUrl:string,githubToken?:string)=>{
    const docs=await loadGithubRepo(githubUrl,githubToken)
    const allEmbeddings= await generateEmbeddings(docs) // Calls generateEmbeddings
    await Promise.allSettled(allEmbeddings.map(async (embedding,index)=>
    {
        console.log(`processing ${index} of ${allEmbeddings.length}`)

        if(!embedding)return
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data:{
                summary:embedding.summary,
                sourceCode:embedding.sourceCode,
                fileName:embedding.fileName,
                projectId,
            }
        })
        await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `
    }))
}

const generateEmbeddings = async (docs: Document[]) => {
    // Map each document to a promise. summariseCode and generateEmbedding are ALREADY rate-limited.
    return await Promise.all(docs.map(async doc => {
        // REMOVE THE apiLimiter WRAPPER HERE.
        // return await apiLimiter(async () => { // <--- REMOVE THIS LINE
        console.log(`Processing document: ${doc.metadata.source}`);
        try {
            // These calls are now handled by the geminiApiLimiter in gemini.ts
            const summary = await summariseCode(doc);
            let embedding = null;

            if (summary) {
                embedding = await generateEmbedding(summary);
                console.log(`Successfully summarized and embedded: ${doc.metadata.source}`);
            } else {
                console.warn(`Summary for ${doc.metadata.source} was empty, skipping embedding.`);
            }

            return {
                summary,
                embedding,
                sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                fileName: doc.metadata.source,
            };
        } catch (error) {
            console.error(`Failed to process ${doc.metadata.source}:`, error);
            return {
                summary: '',
                embedding: null as any,
                sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                fileName: doc.metadata.source,
                error: (error as Error).message
            };
        }
    }));
}