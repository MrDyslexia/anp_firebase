// src/index.ts
import { db } from "./config/firebase";
import { onRequest } from "firebase-functions/v2/https";
import { fetchAirQualityFromAPI } from "./controllers/AmbassadorController";
import * as logger from "firebase-functions/logger";
import { fetchDailyMeasurements } from "./AirQualityService";
export { fetchDailyMeasurements };
import { getAirQualityByComuna } from "./controllers/PublicQueryController";
export { getAirQualityByComuna };
import { getAirQualityHistory } from "./controllers/PublicQueryController";
export { getAirQualityHistory };
import {
  setUserPreferences,
  getUserPreferences,
} from "./controllers/PreferencesController";

export { setUserPreferences, getUserPreferences };
export const testAPI = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
    const comuna = (req.query.comuna as string) || "Valparaiso";
    const region = (req.query.region as string) || "Valparaiso";

    try {
      const data = await fetchAirQualityFromAPI(comuna, region);
      res.json({ status: "ok", data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);
export const listarRegiones = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
    try {
      const snapshot = await db.collection("regiones").get();
      console.log("Regiones obtenidas:", snapshot.docs.length);
      const regiones = snapshot.docs.map((doc) => doc.data());
      res.json(regiones);
    } catch (error) {
      res.status(500).json({ error: "Error al listar regiones" });
    }
  }
);

export const listarComunas = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
    try {
      const snapshot = await db.collection("comunas").limit(10).get(); // muestra 10
      const comunas = snapshot.docs.map((doc) => doc.data());
      res.json(comunas);
    } catch (error) {
      res.status(500).json({ error: "Error al listar comunas" });
    }
  }
);

export const listarColecciones = onRequest(
  { region: "southamerica-west1" },
  async (_req, res) => {
    try {
      const collections = await db.listCollections();
      const nombres = collections.map(col => col.id);
      logger.info("📂 Colecciones encontradas:", nombres);
      res.json({ colecciones: nombres });
    } catch (error: any) {
      logger.error("❌ Error al listar colecciones:", error);
      res.status(500).json({ error: "Error al listar colecciones" });
    }
  }
);