// src/dataview/controllers/PublicQueryController.ts
import {validateToken} from "../middleware/auth";
import {auditLog} from "../middleware/audit";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {db} from "../config/firebase";
export const getAirQualityByComuna = onRequest(
  {region: "southamerica-west1"},
  async (req, res) => {
    const comuna = req.query.comuna as string;
    const user = await validateToken(req);
    if (!user) {
      res.status(401).json({error: "Usuario no autenticado"});
      return;
    }
    if (!comuna) {
      res.status(400).json({error: "Falta el parámetro 'comuna'"});
      return;
    }

    try {
      const user = await validateToken(req);
      if (!user) {
        res.status(401).json({error: "No autorizado"});
        return;
      }
      const snapshot = await db
        .collection("daily_measurements")
        .where("comuna", "==", comuna)
        .orderBy("date", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).json({error: `No hay datos para ${comuna}`});
        return;
      }

      const doc = snapshot.docs[0];
      res.json(doc.data());
    } catch (error: any) {
      logger.error(`❌ Error al consultar comuna ${comuna}`, {
        error: error?.message || error
      });
      res.status(500).json({error: "Error interno del servidor"});
    }
  }
);
export const getAirQualityHistory = onRequest(
  {region: "southamerica-west1"},
  async (req, res) => {
    const user = await validateToken(req);
    if (!user.subscribed) {
      res.status(403).json({error: "Esta función requiere suscripción activa"});
      return;
    }
    const comuna = req.query.comuna as string;

    if (!comuna) {
      res.status(400).json({error: "Falta el parámetro 'comuna'"});
      return;
    }

    try {
      const snapshot = await db
        .collection("daily_measurements")
        .where("comuna", "==", comuna)
        .orderBy("date", "desc")
        .limit(7)
        .get();

      if (snapshot.empty) {
        res.status(404).json({error: `No hay historial para ${comuna}`});
        return;
      }

      const datos = snapshot.docs.map((doc) => doc.data());
      res.json(datos);
    } catch (error: any) {
      logger.error(`❌ Error al consultar historial para ${comuna}`, {
        error: error?.message || error
      });
      res.status(500).json({error: "Error interno del servidor"});
    }
  }
);
export const getAllComunaData = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    try {
      const user = await validateToken(req);
      const comuna = req.query.comuna as string;
      if (!user.subscribed) {
        res.status(403).json({error: 'Requiere suscripción activa'});
        auditLog(req, {
          action: 'DENY_ACCESS',
          uid: user.uid,
          path: req.path,
          query: req.query,
          status: '403'
        });
        return;
      }

      const snapshot = await db
        .collection('daily_measurements')
        .where('comuna', '==', comuna)
        .orderBy('date', 'desc')
        .get();

      const datos = snapshot.docs.map((doc) => doc.data());

      auditLog(req, {
        action: 'GET_ALL_DATA',
        uid: user.uid,
        path: req.path,
        query: req.query,
        status: '200'
      });

      res.json(datos);
    } catch (error: any) {
      auditLog(req, {
        action: 'ERROR',
        uid: 'unknown',
        path: req.path,
        query: req.query,
        status: '401'
      });
      res.status(401).json({error: error.message});
    }
  }
);
