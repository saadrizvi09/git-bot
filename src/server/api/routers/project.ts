import { pollCommits } from "@/lib/github";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { indexGithubRepo } from '@/lib/github-loader';
import { TRPCError } from "@trpc/server"; // Import TRPCError for throwing specific errors

export const projectRouter =createTRPCRouter({
    createProject:protectedProcedure.input(
    
       z.object({
        name: z.string(),
        githubUrl:z.string(),
        gitHubToken:z.string().optional()

       })
    ).mutation(async ({ctx,input})=>  {
        
      const project=await ctx.db.project.create({
            data:{
                githubUrl:input.githubUrl,
                name:input.name,
                userToProjects:{
                    create:{
                        userId:ctx.user.userId!,

                    }
                }
            }
        }
      ) 
      await indexGithubRepo(project.id,input.githubUrl,input.gitHubToken)
      await pollCommits(project.id) 
      return project                
    }),
    getProjects: protectedProcedure.query(async({ctx})=> {
        return await ctx.db.project.findMany({
            where:{
                userToProjects:{
                    some:{
                        userId:ctx.user.userId!
                    }
                },deletedAt:null
            }
        })
    }),
    getCommits: protectedProcedure.input(z.object({
        projectId: z.string()
    })).query(async ({ctx,input})=>
    {
        return await ctx.db.commit.findMany({where:{projectId: input.projectId}})

    }),
    
    saveAnswer: protectedProcedure.input(z.object({
        projectId: z.string(),
        question:z.string(),
        answer:z.string(),
        filesReferences:z.any()
    })).mutation(async({ctx,input})=>
    {
        return await ctx.db.question.create({
            data:{
                answer:input.answer,
                filesReferences:input.filesReferences,
                projectId:input.projectId,
                question:input.question,
                userId:ctx.user.userId!
            }
        })
    }), getMyCredits: protectedProcedure.query(async({ctx})=>{
        return await ctx.db.user.findUnique({where:{id:ctx.user.userId!},select:{points:true} })
    }),
    getQuestions: protectedProcedure.input(z.object({projectId:z.string()})).query(async({ctx,input})=>
    {
        return await ctx.db.question.findMany({
            where:{
                projectId:input.projectId
            },
            include:{
                user:true
            },
            orderBy:{
                createdAt:'desc'
            }
        })
    }),
    deleteProject: protectedProcedure.input(
        z.object({
            projectId: z.string()
        })
    ).mutation(async ({ ctx, input }) => {
        const userId = ctx.user.userId!;

        // 1. Find the project to ensure it exists and belongs to the user
        const project = await ctx.db.project.findUnique({
            where: {
                id: input.projectId,
            },
            include: {
                userToProjects: true // Include relation to check ownership
            }
        });

        if (!project) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Project not found.',
            });
        }

        // Check if the current user is associated with this project
        const isOwner = project.userToProjects.some(
            (userProject) => userProject.userId === userId
        );

        if (!isOwner) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You do not have permission to delete this project.',
            });
        }

        // 2. Perform a soft delete by updating the 'deletedAt' field
        const deletedProject = await ctx.db.project.update({
            where: {
                id: input.projectId,
            },
            data: {
                deletedAt: new Date(), // Set the deletion timestamp
            },
        });

        return deletedProject;
    }),
})
