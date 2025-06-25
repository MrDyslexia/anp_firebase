// src/alert/handlers/OnDataReadHandler.ts

import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import {evaluateRisk} from '../logic/EvaluationEngine';
import {emitOnRiskDetected} from '../events/OnRiskDetected';

/**
 * Firestore Trigger: escucha eventos OnDataRead y evalúa si hay riesgo.
 */
export const onDataReadHandler = onDocumentCreated(
  'events/{eventId}',
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      logger.error('❌ Evento sin datos.');
      return;
    }

    const data = snapshot.data();
    if (data.type !== 'OnDataRead' || !data.data) {
      logger.info('ℹ️ Evento ignorado (no es OnDataRead)');
      return;
    }

    const medicion = data.data;
    logger.info(
      `🔍 Evaluando riesgo para comuna ${medicion.comuna} con AQI ${medicion.aqi}`
    );

    const riesgo = evaluateRisk(medicion);

    if (riesgo.esCritico) {
      await emitOnRiskDetected({
        comuna: medicion.comuna,
        regionId: medicion.regionId,
        aqi: medicion.aqi,
        nivel: riesgo.nivel,
        mensaje: riesgo.mensaje,
        timestamp: new Date().toISOString()
      });

      logger.warn(`🚨 Riesgo detectado en ${medicion.comuna}: ${riesgo.nivel}`);
    } else {
      logger.info(`✅ Sin riesgo en ${medicion.comuna}`);
    }
  }
);
