import { pollCommits } from "@/lib/github";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { indexGithubRepo } from '@/lib/github-loader';
import { TRPCError } from "@trpc/server"; // Import TRPCError for throwing specific errors

export const projectRouter =createTRPCRouter({
// Update the createProject mutation to deduct points
createProject: protectedProcedure.input(
    z.object({
      name: z.string(),
      githubUrl: z.string(),
      gitHubToken: z.string().optional()
    })
  ).mutation(async ({ctx, input}) => {  
    // First check if user has enough points
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.userId! },
      select: { points: true }
    });
  
    if (!user || user.points < 1) {
      throw new Error('Not enough points to create a project');
    }
  
    const project = await ctx.db.project.create({
      data: {
        githubUrl: input.githubUrl,
        name: input.name,
        userToProjects: {
          create: {
            userId: ctx.user.userId!,
          }
        }
      }
    });
  
  
    await indexGithubRepo(project.id, input.githubUrl, input.gitHubToken);
    await pollCommits(project.id);
      // Deduct 1 point from user
      await ctx.db.user.update({
        where: { id: ctx.user.userId! },
        data: {
          points: {
            decrement: 1,
          },
        },
      });
    
    return project;
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
    addPoints: protectedProcedure
    .input(z.object({
      points: z.number().positive(),
      paymentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.userId!;
      
      return await ctx.db.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: input.points,
          },
        },
      });
    }),

    // Fetch new commits from GitHub and summarize them
    fetchNewCommits: protectedProcedure
      .input(z.object({
        projectId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.userId!;

        // Verify user has access to this project
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            userToProjects: {
              some: {
                userId: userId
              }
            }
          }
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found or you do not have access.',
          });
        }

        // Get count of commits before polling
        const commitsBefore = await ctx.db.commit.count({
          where: { projectId: input.projectId }
        });

        // Poll for new commits using existing function
        await pollCommits(input.projectId);

        // Get count after polling
        const commitsAfter = await ctx.db.commit.count({
          where: { projectId: input.projectId }
        });

        const newCommitsCount = commitsAfter - commitsBefore;

        return {
          success: true,
          newCommitsCount,
          totalCommits: commitsAfter
        };
      }),
})
