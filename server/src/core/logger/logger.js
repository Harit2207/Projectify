import winston from 'winston';
import { env } from '../../config/env.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
};

//dev
const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : '';
        return `${timestamp} [${level}]: ${stack ?? message}${metaStr}`;
    }),
);

//prod
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json(),
);


export const logger = winston.createLogger({
    levels: customLevels.levels,
    level: env.isProduction ? 'info' : 'debug',
    format: env.isProduction ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
    ],

    //app doesnt crash on logger error
    exitOnError: false,
});

winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
});