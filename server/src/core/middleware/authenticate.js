import asyncHandler from 'express-async-handler';
import { verifyAccessToken } from '../../shared/utils/jwt.js';
import { UnauthorizedError } from '../errors/errorTypes.js';
import { User } from '../../features/auth/auth.model.js';

export const authenticate = asyncHandler(async (req, res, next) => {
// console.log('==== AUTH DEBUG ====');
//     console.log('req.cookies:', req.cookies);
//     console.log('cookie header:', req.headers.cookie);
//     console.log('host:', req.headers.host);
//     console.log('method:', req.method);
//     console.log('path:', req.path);


    const token = req.cookies?.accessToken;

    

    if (!token) {
        throw new UnauthorizedError('No token provided');
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
        throw new UnauthorizedError('user no longer exists');
    }

    req.user = user;

    next();
})

//role based
export function requireRole(...roles) {
    return asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.workspaceRole)) {
            throw new ForbiddenError();
        }
        next();
    });
}