export interface AirQualityMeasurement {
  date: string;
  comunaRef: FirebaseFirestore.DocumentReference;
  regionRef: FirebaseFirestore.DocumentReference;
  aqi_us: number;
  main_pollutant_us: string;
  aqi_cn: number;
  main_pollutant_cn: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitud, latitud]
  };
  pollution_timestamp: string;
  weather: {
    timestamp: string;
    temperature: number;
    pressure: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    icon: string;
  };
  source: 'IQAir';
}
