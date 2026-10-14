import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../features/auth/auth.model.js';
import { env } from './env.js';
import { logger } from '../core/logger/logger.js';

if (env.google.isConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email returned from Google'), null);
          }

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            user.avatar = avatar ?? user.avatar;
            await user.save({ validateBeforeSave: false });
            return done(null, user);
          }

          user = await User.findOne({ email });

          if (user) {
            // Link Google account to existing email account
            user.googleId = profile.id;
            user.avatar = avatar ?? user.avatar;
            user.isVerified = true;
            await user.save({ validateBeforeSave: false });
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName || email.split('@')[0],
            email,
            googleId: profile.id,
            avatar,
            isVerified: true,
          });

          logger.info('New user via Google OAuth', { userId: user._id });
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );
  logger.info('Google OAuth strategy initialized');
} else {
  logger.warn('Google OAuth is not configured; Google sign-in is disabled');
}

export default passport;
