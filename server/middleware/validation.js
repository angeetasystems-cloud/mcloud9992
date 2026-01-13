export function validateProviders(req, res, next) {
  const { providers } = req.body;
  
  if (!providers || !Array.isArray(providers)) {
    return res.status(400).json({ 
      error: 'Invalid request: providers array is required' 
    });
  }

  const validProviders = ['aws', 'azure', 'gcp'];
  const invalidProviders = providers.filter(p => !validProviders.includes(p));
  
  if (invalidProviders.length > 0) {
    return res.status(400).json({ 
      error: `Invalid providers: ${invalidProviders.join(', ')}`,
      validProviders 
    });
  }

  if (providers.length === 0) {
    return res.status(400).json({ 
      error: 'At least one provider must be specified' 
    });
  }

  next();
}

export function sanitizeInput(req, res, next) {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
}
