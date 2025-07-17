import {Request} from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

interface AuditLogParams {
  action: string;
  uid: string;
  path: string;
  params?: any;
  query?: any;
  status?: string;
}

export function auditLog(req: Request, data: AuditLogParams) {
  logger.info('📘 AUDITORÍA', {
    user: data.uid,
    action: data.action,
    path: data.path,
    query: data.query,
    params: data.params,
    status: data.status,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'desconocido',
    timestamp: new Date().toISOString()
  });
}
