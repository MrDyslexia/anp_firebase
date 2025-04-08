import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config(); // ← Carga el archivo .env

// Inicializa Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Leer variables de entorno
const API_URL = process.env.API_URL;
const API_KEY = process.env.KEY_IQAIR;

export const fetchDailyMeasurements = onSchedule(
  {
    schedule: "0 0 * * *", // Ejecuta cada día a la medianoche UTC
    timeZone: "America/Santiago",
  },
  async () => {
    if (!API_URL || !API_KEY) {
      logger.error("API_URL o KEY_IQAIR no están definidos en el archivo .env.");
      return;
    }

    try {
      const regionesSnapshot = await db.collection("regiones").get();
      const today = admin.firestore.Timestamp.fromDate(new Date());

      for (const regionDoc of regionesSnapshot.docs) {
        const regionId = regionDoc.id;
        const regionData = regionDoc.data();
        const comunas: string[] = regionData.comunas || [];

        for (const comunaNombre of comunas) {
          try {
            const apiUrlForComuna = `${API_URL}/v2/nearest_city?key=${API_KEY}&city=${encodeURIComponent(comunaNombre)}&state=${encodeURIComponent(regionData.nombre)}&country=Chile`;

            const response = await axios.get(apiUrlForComuna);
            const pollutionData = response.data?.data?.current?.pollution;

            if (pollutionData) {
              const aqi = pollutionData.aqius;
              const docId = `${regionId}_${comunaNombre.replace(/\s+/g, "_")}_${today.toDate().toISOString().slice(0, 10)}`;

              await db.collection("daily_measurements").doc(docId).set({
                regionId,
                comunaNombre,
                date: today,
                pm25: aqi,
                pm10: null, // Ajusta si existen en la API
                o3: null,
                status: getAirQualityStatus(aqi),
                timestamp: admin.firestore.Timestamp.now(),
              });

              logger.info(`✔️ Mediciones almacenadas para ${comunaNombre} (${regionId})`);
            } else {
              logger.warn(`⚠️ Sin datos para ${comunaNombre}, ${regionData.nombre}`);
            }
          } catch (error: any) {
            logger.error(`❌ Error con ${comunaNombre}, ${regionData.nombre}:`, {
              error: error?.response?.data || error.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.error("❌ Error general al procesar las regiones:", {
        error: error?.response?.data || error.message,
      });
    }
  }
);

// Función auxiliar para clasificar la calidad del aire
function getAirQualityStatus(aqi: number): string {
  if (aqi <= 50) return "Bueno";
  if (aqi <= 100) return "Moderado";
  if (aqi <= 150) return "Poco saludable para grupos sensibles";
  if (aqi <= 200) return "Poco saludable";
  if (aqi <= 300) return "Muy poco saludable";
  return "Peligroso";
}
