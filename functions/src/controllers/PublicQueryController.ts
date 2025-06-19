// src/dataview/controllers/PublicQueryController.ts

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../config/firebase";

/**
 * Endpoint HTTP para consultar la calidad del aire actual por comuna.
 * GET /airquality?comuna=Valparaiso
 */
export const getAirQualityByComuna = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
  const comuna = req.query.comuna as string;

  if (!comuna) {
    res.status(400).json({ error: "Falta el parámetro 'comuna'" });
    return;
  }

  try {
    const snapshot = await db
      .collection("daily_measurements")
      .where("comuna", "==", comuna)
      .orderBy("date", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: `No hay datos para ${comuna}` });
      return;
    }

    const doc = snapshot.docs[0];
    res.json(doc.data());
  } catch (error: any) {
    logger.error(`❌ Error al consultar comuna ${comuna}`, {
      error: error?.message || error,
    });
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
/**
 * Endpoint HTTP para consultar el historial de los últimos 7 días por comuna.
 * GET /historico?comuna=Valparaiso
 */
export const getAirQualityHistory = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
    const comuna = req.query.comuna as string;

    if (!comuna) {
      res.status(400).json({ error: "Falta el parámetro 'comuna'" });
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
        res.status(404).json({ error: `No hay historial para ${comuna}` });
        return;
      }

      const datos = snapshot.docs.map(doc => doc.data());
      res.json(datos);
    } catch (error: any) {
      logger.error(`❌ Error al consultar historial para ${comuna}`, {
        error: error?.message || error,
      });
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);
