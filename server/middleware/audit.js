import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogPath = path.join(logsDir, 'audit.log');
const accessLogPath = path.join(logsDir, 'access.log');

export function auditLogger(action, details, userId = 'system') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    details,
    ip: details.ip || 'unknown',
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(auditLogPath, logLine, (err) => {
    if (err) console.error('Failed to write audit log:', err);
  });

  return logEntry;
}

export function accessLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(accessLogPath, logLine, (err) => {
      if (err) console.error('Failed to write access log:', err);
    });
  });

  next();
}

export function complianceLogger(event, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    data,
    compliance: {
      gdpr: true,
      hipaa: true,
      soc2: true,
    },
  };

  auditLogger('compliance_event', logEntry);
}
