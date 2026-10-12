import { z } from 'zod';

export const createSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Workspace name is required' })
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name too long'),

        description: z.string().max(200).optional().default(''),
    }),
});

export const updateWorkspaceSchema = z.object({
    params: z.object({
        workspaceId: z.string().min(1),
    }),

    body: z.object({
        name: z.string().trim().min(2).max(50).optional(),
        description: z.string().max(200).optional(),
    }),
});


export const inviteMemberSchema = z.object({
    params: z.object({
        workspaceId: z.string().min(1),
    }),
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        role: z.enum(['admin', 'member']).default('member'),
    }),
});


export const updateMemberRoleSchema = z.object({
    params: z.object({
        workspaceId: z.string().min(1),
        memberId: z.string().min(1),
    }),
    body: z.object({
        role: z.enum(['admin', 'member']),
    }),
});

export const workspaceParamsSchema = z.object({
    params: z.object({
        workspaceId: z.string().min(1),
    }),
});

export const removeMemberSchema = z.object({
    params: z.object({
        workspaceId: z.string().min(1),
        memberId: z.string().min(1),
    }),
});
