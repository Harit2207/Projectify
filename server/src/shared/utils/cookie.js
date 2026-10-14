import { env } from '../../config/env.js';

const isProd = env.isProduction || process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const BASE_OPTION = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
};

export function setAccessTokenCookie(res, token) {
    res.cookie('accessToken', token, {
        ...BASE_OPTION,
        maxAge: 15 * 60 * 1000, // 15min
    });
}

export function setRefreshTokenCookie(res, token) {
    res.cookie('refreshToken', token, {
        ...BASE_OPTION,
        maxAge: 7 * 24 * 60 * 1000, // 7days
        path: '/api/auth/refresh',
    });
}

export function clearAuthCookies(res) {
    res.clearCookie('accessToken', {
        ...BASE_OPTION,
        path: '/',
    });
    res.clearCookie('refreshToken', {
        ...BASE_OPTION,
        path: '/api/auth/refresh',
    });
}
