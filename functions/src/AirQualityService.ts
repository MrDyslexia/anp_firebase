import {onSchedule} from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import {db} from './config/firebase';
import {getPollutionDataForComuna} from './controllers/AmbassadorController';
import {
  guardarMedicion,
  getAirQualityStatus
} from './controllers/DataController';
import {emitOnDataReadEvent} from './events/OnDataRead';
import pLimit from 'p-limit';

export const fetchDailyMeasurements = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'America/Santiago',
    region: 'southamerica-west1',
    timeoutSeconds: 540
  },
  async () => {
    logger.info('🟡 Iniciando ingestión diaria de calidad del aire...');

    const regionesSnapshot = await db.collection('regiones').get();
    const today = new Date();
    const allComunas: {comuna: string; regionName: string; regionId: string}[] =
      [];

    for (const regionDoc of regionesSnapshot.docs) {
      const region = regionDoc.data();
      const regionId = regionDoc.id;

      const comunasSnapshot = await db
        .collection('comunas')
        .where('regionRef', '==', regionDoc.ref)
        .get();

      for (const comunaDoc of comunasSnapshot.docs) {
        const comuna = comunaDoc.data().name;
        allComunas.push({comuna, regionName: region.name, regionId});
      }
    }

    logger.info(`📦 Total de comunas a procesar: ${allComunas.length}`);

    const limit = pLimit(5); // máximo 5 comunas en paralelo
    const tareas = allComunas.map(({comuna, regionName, regionId}) =>
      limit(async () => {
        try {
          const pollution = await getPollutionDataForComuna(comuna, regionName);
          if (!pollution) {
            logger.warn(`⚠️ Sin datos para ${comuna} (${regionName})`);
            return;
          }

          const status = getAirQualityStatus(pollution.aqi);
          const medicion = await guardarMedicion({
            comuna,
            regionId,
            aqi: pollution.aqi,
            status,
            fecha: today
          });

          await emitOnDataReadEvent(medicion);
          logger.info(`✅ Medición registrada para ${comuna}`);
        } catch (err: unknown) {
          const error = err as Error;
          logger.error(`❌ Error al procesar ${comuna} (${regionName})`, {
            error: error.message
          });
        }
      })
    );

    await Promise.all(tareas);

    logger.info('✅ Ingestión diaria finalizada.');
  }
);
/**
 * Ejecuta la ingestión diaria de calidad del aire procesando todas las comunas.
 * Utiliza `p-limit` para limitar concurrencia (5 paralelas) y respeta estructura asincrónica.
 * Llama a `getPollutionDataForComuna`, guarda mediciones y emite eventos OnDataRead.
 */
export async function fetchDailyMeasurementsCore(): Promise<void> {
  logger.info('🟡 Iniciando ingestión diaria de calidad del aire...');
  const regionesSnapshot = await db.collection('regiones').get();
  const today = new Date();
  const allComunas: {comuna: string; regionName: string; regionId: string}[] =
    [];

  for (const regionDoc of regionesSnapshot.docs) {
    const region = regionDoc.data();
    const regionId = regionDoc.id;

    const comunasSnapshot = await db
      .collection('comunas')
      .where('regionRef', '==', regionDoc.ref)
      .get();

    for (const comunaDoc of comunasSnapshot.docs) {
      const comuna = comunaDoc.data().name;
      allComunas.push({comuna, regionName: region.name, regionId});
    }
  }

  logger.info(`📦 Total comunas: ${allComunas.length}`);
  const batchSize = 5;
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  for (let i = 0; i < allComunas.length; i += batchSize) {
    const batch = allComunas.slice(i, i + batchSize);
    logger.info(`🚚 Procesando lote ${i / batchSize + 1}`);

    await Promise.all(
      batch.map(async ({comuna, regionName, regionId}) => {
        try {
          const pollution = await getPollutionDataForComuna(comuna, regionName);
          if (!pollution) {
            logger.warn(`⚠️ Sin datos para ${comuna}`);
            return;
          }

          const status = getAirQualityStatus(pollution.aqi);
          const medicion = await guardarMedicion({
            comuna,
            regionId,
            aqi: pollution.aqi,
            status,
            fecha: today
          });

          await emitOnDataReadEvent(medicion);
          logger.info(`✅ Medición registrada para ${comuna}`);
        } catch (err: unknown) {
          const error = err as Error;
          logger.error(`❌ Error al procesar ${comuna}`, {
            error: error.message
          });
        }
      })
    );

    if (i + batchSize < allComunas.length) {
      logger.info('⏳ Esperando 60 segundos antes del próximo lote...');
      await delay(60000); // Respeta rate limit
    }
  }

  logger.info('✅ Ingestión diaria finalizada.');
}
