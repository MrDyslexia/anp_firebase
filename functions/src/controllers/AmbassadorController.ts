import axios from 'axios';
import * as logger from 'firebase-functions/logger';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL;
const API_KEY = process.env.IQAIR_API_KEY;
const TIMEOUT = 5000; // 5 segundos
const MAX_RETRIES = 3;
export interface AirPollutionData {
  aqi: number;
  ts: string;
  mainPollutant: string;
  fuenteCiudad: string;
}

/**
 * Llama a la API externa usando el patrón Ambassador (con retry, timeout, validación).
 */
export async function getPollutionDataForComuna(
  comuna: string,
  region: string
): Promise<AirPollutionData | null> {
  const url = `${API_URL}city?city=${comuna}&state=${region}&country=chile&key=${API_KEY}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, {timeout: TIMEOUT});
      const pollution = response.data?.data?.current?.pollution;
      if (response.status !== 200 || !pollution || pollution.aqius == null) {
        throw new Error('Respuesta inválida o sin datos de contaminación');
      }
      logger.info(
        `✔️ [Ambassador] ${comuna}, intento ${attempt}: AQI=${pollution.aqius}`
      );
      return {
        aqi: pollution.aqius,
        ts: pollution.ts,
        mainPollutant: pollution.mainus,
        fuenteCiudad: response.data?.data?.city || comuna
      };
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err.message || 'Error desconocido';
      logger.warn(
        `⚠️ [Ambassador] Fallo intento ${attempt} para ${comuna}: ${message}`
      );

      if (attempt === MAX_RETRIES) {
        logger.error(
          `❌ [Ambassador] Fallo definitivo para ${comuna} tras ${MAX_RETRIES} intentos`
        );
        return null;
      }

      await delay(500 * attempt); // backoff simple
    }
  }

  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function fetchAirQualityFromAPI(comuna: string, region: string) {
  if (!API_URL || !API_KEY) {
    throw new Error('❌ API_URL o IQAIR_API_KEY no están definidos');
  }

  const url = `${API_URL}nearest_city?key=${API_KEY}&city=${encodeURIComponent(comuna)}&state=${encodeURIComponent(region)}&country=Chile`;
  logger.info(`🔍 Consultando calidad del aire desde IQAir: ${url}`);

  try {
    const response = await axios.get(url, {timeout: TIMEOUT});
    const pollution = response.data?.data?.current?.pollution;

    if (!pollution || typeof pollution.aqius !== 'number') {
      throw new Error('Datos de contaminación no válidos o incompletos');
    }

    return {
      aqi: pollution.aqius,
      main: pollution.mainus,
      timestamp: pollution.ts
    };
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'Error desconocido';

    logger.error('❌ Error al consultar API externa:', msg);
    throw new Error(`Error al consultar calidad del aire desde IQAir: ${msg}`);
  }
}
