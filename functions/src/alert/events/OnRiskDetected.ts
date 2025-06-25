// src/alert/events/OnRiskDetected.ts

import {db} from '../../config/firebase';

export interface EventoRiesgo {
  comuna: string;
  regionId: string;
  aqi: number;
  nivel: string;
  mensaje: string;
  timestamp: string;
}

/**
 * Publica un evento del tipo OnRiskDetected en la colección events.
 */
export async function emitOnRiskDetected(riesgo: EventoRiesgo) {
  await db.collection('events').add({
    type: 'OnRiskDetected',
    data: riesgo,
    timestamp: new Date().toISOString()
  });
}
