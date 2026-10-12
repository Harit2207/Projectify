import { env } from '../../config/env.js';

const BASE_OPTION = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
};

export function setAccessTokenCookie(res, token) {
    res.cookie('accessToken', token, {
        ...BASE_OPTION,
        maxAge: 15 * 60 * 1000, //15min
    });
}

export function setRefreshTokenCookie(res, token) {
    res.cookie('refreshToken', token, {
        ...BASE_OPTION,
        maxAge: 7 * 24 * 60 * 1000, //7days
        path: '/api/auth/refresh',
    });
}

export function clearAuthCookies(res) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
}
