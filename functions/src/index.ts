// src/index.ts
import {onRequest} from 'firebase-functions/v2/https';
import {db} from './config/firebase';
import {
  fetchAirQualityFromAPI,
  getPollutionDataForComuna
} from './controllers/AmbassadorController';
import * as logger from 'firebase-functions/logger';
import {fetchDailyMeasurements} from './AirQualityService';
import {
  getAirQualityByComuna,
  getAirQualityHistory,
  getAllComunaData
} from './controllers/PublicQueryController';
import {
  setUserPreferences,
  getUserPreferences
} from './controllers/PreferencesController';
import {
  guardarMedicion,
  getAirQualityStatus
} from './controllers/DataController';
import {validateToken} from './middleware/auth';
export {setUserPreferences, getUserPreferences};
export {fetchDailyMeasurements};
export const testAPI = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    const comuna = (req.query.comuna as string) || 'Valparaiso';
    const region = (req.query.region as string) || 'Valparaiso';

    try {
      const data = await fetchAirQualityFromAPI(comuna, region);
      res.json({status: 'ok', data});
    } catch (error: any) {
      res.status(500).json({error: error.message});
    }
  }
);
export const listarRegiones = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    try {
      const snapshot = await db.collection('regiones').get();
      console.log('Regiones obtenidas:', snapshot.docs.length);
      const regiones = snapshot.docs.map((doc) => doc.data());
      res.json(regiones);
    } catch (error) {
      res.status(500).json({error: 'Error al listar regiones'});
    }
  }
);
export const listarComunas = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    try {
      await validateToken(req);
      const snapshot = await db.collection('comunas').limit(10).get(); // muestra 10
      const comunas = snapshot.docs.map((doc) => doc.data());
      res.json(comunas);
    } catch (error) {
      res.status(500).json({error: 'Error al listar comunas'});
    }
  }
);
export const listarColecciones = onRequest(
  {region: 'southamerica-west1'},
  async (_req, res) => {
    try {
      const collections = await db.listCollections();
      const nombres = collections.map((col) => col.id);
      logger.info('📂 Colecciones encontradas:', nombres);
      res.json({colecciones: nombres});
    } catch (error: any) {
      logger.error('❌ Error al listar colecciones:', error);
      res.status(500).json({error: 'Error al listar colecciones'});
    }
  }
);
export const runDailyIngestion = onRequest(
  {region: 'southamerica-west1'},
  async (_req, res) => {
    await db.collection('ingestionJobs').add({createdAt: new Date()});
    res.status(202).send('✅ Ingestión asincrónica iniciada.');
  }
);
export const testComunaManual = onRequest(
  {region: 'southamerica-west1'},
  async (req, res) => {
    const comuna = 'Vina del Mar';
    const region = 'Valparaiso';
    const today = new Date();

    logger.log('📥 Datos request:', comuna, region);
    console.log('📥 Comenzando test para:', comuna, '-', region);

    try {
      const pollution = await getPollutionDataForComuna(comuna, region);
      if (!pollution) {
        logger.warn(`⚠️ Sin datos para ${comuna}`);
        console.warn('⚠️ No se obtuvo datos de contaminación');
        res
          .status(404)
          .json({error: 'No se pudo obtener datos de contaminación'});
        return;
      }
      console.log('📦 Respuesta completa desde API externa:');
      console.dir(pollution, {depth: null});
      const status = getAirQualityStatus(pollution.aqi);
      const regionSnap = await db
        .collection('regiones')
        .where('name', '==', region)
        .limit(1)
        .get();

      if (regionSnap.empty) {
        console.error('❌ Región no encontrada:', region);
        res.status(404).json({error: `No se encontró la región ${region}`});
        return;
      }

      const regionId = regionSnap.docs[0].data().id;
      console.log(`📍 ID de región obtenida: ${regionId}`);

      const medicion = await guardarMedicion({
        comuna,
        regionId: regionId.toString(),
        aqi: pollution.aqi,
        status,
        fecha: today
      });

      logger.info(
        `✅ Medición registrada para ${comuna}: AQI ${pollution.aqi}`
      );
      console.log('✅ Medición guardada correctamente:', medicion);

      res.json({status: 'ok', comuna, region, medicion});
    } catch (error: any) {
      logger.error('❌ Error en testComunaManual', error);
      console.error('❌ Error atrapado en catch:', error.message);
      res.status(500).json({error: error.message});
    }
  }
);
export {onNewIngestionJob} from './triggers/IngestionTrigger';
export {getAllComunaData};
export {getAirQualityByComuna};
export {getAirQualityHistory};