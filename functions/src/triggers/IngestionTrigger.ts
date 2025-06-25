import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {fetchDailyMeasurementsCore} from '../AirQualityService';
import * as logger from 'firebase-functions/logger';
export const onNewIngestionJob = onDocumentCreated(
  'ingestionJobs/{jobId}',
  async (event) => {
    logger.info(
      '🟡 Nuevo trabajo de ingestión detectado, iniciando proceso...',
      {
        jobId: event.params.jobId
      }
    );
    try {
      await fetchDailyMeasurementsCore();
      logger.info('✅ Ingestión asincrónica completada.');
    } catch (error) {
      logger.error('❌ Falló el proceso de ingestión asincrónica', {
        error: error instanceof Error ? error.message : error
      });
    }
  }
);
