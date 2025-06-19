import { db } from "../config/firebase";
import { onRequest } from "firebase-functions/v2/https";
import { fetchAirQualityFromAPI } from "./AmbassadorController";

export function getAirQualityStatus(aqi: number): string {
  if (aqi <= 50) return "Bueno";
  if (aqi <= 100) return "Moderado";
  if (aqi <= 150) return "Poco saludable para grupos sensibles";
  if (aqi <= 200) return "Poco saludable";
  if (aqi <= 300) return "Muy poco saludable";
  return "Peligroso";
}

interface GuardarMedicionParams {
  comuna: string;
  regionId: string;
  aqi: number;
  status: string;
  fecha: Date;
}

/**
 * Guarda una medición en Firestore.
 */
export async function guardarMedicion(params: GuardarMedicionParams): Promise<any> {
  const { comuna, regionId, aqi, status, fecha } = params;

  const docId = `${regionId}_${comuna.replace(/\s+/g, "_")}_${fecha.toISOString().slice(0, 10)}`;

  const medicion = {
    regionId,
    comuna,
    aqi,
    status,
    date: fecha.toISOString(),
    timestamp: new Date().toISOString(),
  };

  await db.collection("daily_measurements").doc(docId).set(medicion);

  return medicion;
}
export const testAPI = onRequest({ region: "southamerica-west1" }, async (req, res) => {
  const comuna = req.query.comuna as string || "Valparaiso";
  const region = req.query.region as string || "Valparaiso";

  try {
    const data = await fetchAirQualityFromAPI(comuna, region);
    res.json({ status: "ok", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});