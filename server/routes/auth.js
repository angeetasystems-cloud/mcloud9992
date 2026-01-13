import express from 'express';
import passport from '../auth/passport.js';
import { generateToken } from '../auth/jwt.js';
import { auditLogger } from '../middleware/audit.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login?error=auth_failed' 
  }),
  (req, res) => {
    const token = generateToken(req.user);
    
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
  }
);

router.get('/azure', passport.authenticate('azure-ad', {
  session: false,
}));

router.get('/azure/callback',
  passport.authenticate('azure-ad', { 
    session: false,
    failureRedirect: '/login?error=auth_failed' 
  }),
  (req, res) => {
    const token = generateToken(req.user);
    
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
  }
);

router.post('/token/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  const { verifyToken } = require('../auth/jwt.js');
  const result = verifyToken(token);

  if (!result.valid) {
    return res.status(401).json({ 
      valid: false, 
      error: result.error 
    });
  }

  res.json({ 
    valid: true, 
    user: result.user 
  });
});

router.post('/logout', (req, res) => {
  if (req.user) {
    auditLogger('user_logout', {
      userId: req.user.id,
      email: req.user.email,
    });
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/status', (req, res) => {
  const authMethods = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    azure: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_TENANT_ID),
    apiKey: true,
  };

  res.json({
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      provider: req.user.provider,
    } : null,
    availableMethods: authMethods,
  });
});

export default router;
