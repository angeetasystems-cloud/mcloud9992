import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { BearerStrategy } from 'passport-azure-ad';
import { auditLogger } from '../middleware/audit.js';

const users = new Map();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  }, (accessToken, refreshToken, profile, done) => {
    auditLogger('oauth_login', {
      provider: 'Google',
      userId: profile.id,
      email: profile.emails?.[0]?.value,
    });

    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      provider: 'google',
      accessToken,
    };

    users.set(user.id, user);
    return done(null, user);
  }));
}

if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_TENANT_ID) {
  passport.use(new BearerStrategy({
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_AD_CLIENT_ID,
    validateIssuer: true,
    passReqToCallback: false,
  }, (token, done) => {
    auditLogger('oauth_login', {
      provider: 'Azure AD',
      userId: token.oid,
      email: token.preferred_username,
    });

    const user = {
      id: token.oid,
      email: token.preferred_username,
      name: token.name,
      provider: 'azure',
      token: token,
    };

    users.set(user.id, user);
    return done(null, user);
  }));
}

export default passport;
