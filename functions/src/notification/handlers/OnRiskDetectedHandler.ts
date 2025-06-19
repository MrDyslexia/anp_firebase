// src/notification/handlers/OnRiskDetectedHandler.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "../../config/firebase";
import { sendNotification } from "../logic/NotificationDispatcher";

/**
 * Trigger que reacciona al evento OnRiskDetected y notifica si hay usuarios afectados.
 */
export const onRiskDetectedHandler = onDocumentCreated("events/{eventId}", async (event) => {
  const snapshot = event.data;

  if (!snapshot) {
    logger.error("❌ Evento sin datos.");
    return;
  }

  const data = snapshot.data();
  if (data.type !== "OnRiskDetected" || !data.data) {
    logger.info("ℹ️ Evento ignorado (no es OnRiskDetected)");
    return;
  }

  const riesgo = data.data;
  logger.info(`📢 Procesando notificación por riesgo en ${riesgo.comuna}`);

  // Buscar usuarios que tengan esta comuna marcada como favorita
  const usersSnapshot = await db
    .collection("users")
    .where("favoritas", "array-contains", riesgo.comuna)
    .get();

  if (usersSnapshot.empty) {
    logger.info(`🔕 No hay usuarios con ${riesgo.comuna} como favorita.`);
    return;
  }

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const token = user.fcmToken;

    if (token) {
      await sendNotification(token, {
        title: `Alerta en ${riesgo.comuna}`,
        body: riesgo.mensaje,
      });
      logger.info(`✅ Notificación enviada a ${user.email || userDoc.id}`);
    } else {
      logger.warn(`⚠️ Usuario ${userDoc.id} no tiene token FCM.`);
    }
  }
});
