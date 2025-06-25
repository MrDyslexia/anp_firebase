// src/user/controllers/PreferencesController.ts

import {onRequest} from 'firebase-functions/v2/https';
import {db} from '../config/firebase';
import * as logger from 'firebase-functions/logger';

/**
 * POST /user/preferences
 * Body: { uid: string, favoritas: string[], fcmToken?: string }
 */
export const setUserPreferences = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({error: 'Método no permitido'});
      return;
    }

    const {uid, favoritas, fcmToken} = req.body;

    if (!uid || !Array.isArray(favoritas)) {
      res
        .status(400)
        .json({error: 'Faltan campos requeridos (uid, favoritas[])'});
      return;
    }

    try {
      await db
        .collection('users')
        .doc(uid)
        .set(
          {
            favoritas,
            ...(fcmToken && {fcmToken})
          },
          {merge: true}
        );

      res.json({status: 'ok', favoritas});
    } catch (error: any) {
      logger.error('❌ Error al guardar preferencias', {
        error: error.message || error
      });
      res.status(500).json({error: 'Error interno al guardar preferencias'});
    }
  }
);

/**
 * GET /user/preferences?uid=xyz
 */
export const getUserPreferences = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    const uid = req.query.uid as string;

    if (!uid) {
      res.status(400).json({error: "Falta el parámetro 'uid'"});
      return;
    }

    try {
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        res.status(404).json({error: 'Usuario no encontrado'});
        return;
      }

      res.json(userDoc.data());
    } catch (error: any) {
      logger.error('❌ Error al obtener preferencias', {
        error: error.message || error
      });
      res.status(500).json({error: 'Error interno al obtener preferencias'});
    }
  }
);
