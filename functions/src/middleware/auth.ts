import {Request} from 'firebase-functions/v2/https';
import {admin} from '../config/firebase';

export interface DecodedToken {
  uid: string;
  subscribed?: boolean;
}

/**
 * Verifica el token JWT incluido en la cabecera Authorization.
 */
export async function validateToken(req: Request): Promise<DecodedToken> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Falta token de autorización');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      subscribed: decoded.subscribed ?? false
    };
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}
