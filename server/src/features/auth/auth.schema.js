import { z } from 'zod';

export const signupSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'Name is required' })
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name too long'),
        email: z
            .string({ required_error: 'Email is required' })
            .email("Invalid email address")
            .toLowerCase(),
        password: z
            .string({ required_error: 'Password is required' })
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain uppercase, lowercase, and a number',
            ),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain uppercase, lowercase, and a number',
            ),
    }),
});