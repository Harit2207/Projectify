import mongoose from 'mongoose';
import { BadRequestError } from '../errors/errorTypes.js';

export function validateObjectId(...paramNames) {
    return (req, res, next) => {
        for (const param of paramNames) {
            const value = req.params[param];
            if (value && !mongoose.Types.ObjectId.isValid(value)) {
                throw new BadRequestError(`Invalid ${param} format`);
            }
        }
        next();
    };
}