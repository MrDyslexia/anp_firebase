import { db } from "../config/firebase";

/**
 * Emite un evento OnDataRead al guardar una nueva medición.
 */
export async function emitOnDataReadEvent(medicion: any) {
  await db.collection("events").add({
    type: "OnDataRead",
    data: medicion,
    timestamp: new Date().toISOString(),
  });
}
