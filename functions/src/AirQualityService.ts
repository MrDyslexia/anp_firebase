import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { db } from "./config/firebase";
import { getPollutionDataForComuna } from "./controllers/AmbassadorController";
import { guardarMedicion, getAirQualityStatus } from "./controllers/DataController";
import { emitOnDataReadEvent } from "./events/OnDataRead";
export const fetchDailyMeasurements = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "America/Santiago",
    region: "southamerica-west1", 
  },
  async () => {
    logger.info("🟡 Iniciando ingestión diaria de calidad del aire...");

    const regionesSnapshot = await db.collection("regiones").get();
    const today = new Date();

    for (const regionDoc of regionesSnapshot.docs) {
      const region = regionDoc.data();
      const regionId = regionDoc.id;

      const comunasSnapshot = await db
        .collection("comunas")
        .where("regionRef", "==", regionDoc.ref)
        .get();

      for (const comunaDoc of comunasSnapshot.docs) {
        const comuna = comunaDoc.data().nombre;

        try {
          const pollution = await getPollutionDataForComuna(comuna, region.nombre);
          if (!pollution) {
            logger.warn(`⚠️ Sin datos para ${comuna} (${region.nombre})`);
            continue;
          }

          const status = getAirQualityStatus(pollution.aqi);

          const medicion = await guardarMedicion({
            comuna,
            regionId,
            aqi: pollution.aqi,
            status,
            fecha: today,
          });

          await emitOnDataReadEvent(medicion);
          logger.info(`✅ Medición registrada y evento emitido para ${comuna}`);
        } catch (err: any) {
          logger.error(`❌ Error al procesar ${comuna} (${region.nombre})`, {
            error: err?.message || err,
          });
        }
      }
    }

    logger.info("✅ Ingestión diaria finalizada.");
  }
);
