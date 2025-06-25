import {db} from '../config/firebase';
import {AirQualityMeasurement} from '../interfaces/airQualityMeasurement';
/**
 * Emite un evento OnDataRead al guardar una nueva medición.
 * @param medicion Objeto de medición de calidad del aire.
 */
export async function emitOnDataReadEvent(medicion: AirQualityMeasurement) {
  await db.collection('events').add({
    type: 'OnDataRead',
    data: medicion,
    timestamp: new Date().toISOString()
  });
}
