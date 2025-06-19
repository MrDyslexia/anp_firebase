// src/alert/logic/EvaluationEngine.ts

interface Medicion {
  comuna: string;
  regionId: string;
  aqi: number;
  status?: string;
  date?: string;
}

interface EvaluacionRiesgo {
  esCritico: boolean;
  nivel: string;
  mensaje: string;
}

/**
 * Evalúa si la medición representa un riesgo crítico para la salud.
 */
export function evaluateRisk(medicion: Medicion): EvaluacionRiesgo {
  const { aqi, comuna } = medicion;

  if (aqi > 150 && aqi <= 200) {
    return {
      esCritico: true,
      nivel: "Poco saludable",
      mensaje: `El aire en ${comuna} está poco saludable para toda la población.`,
    };
  }

  if (aqi > 200 && aqi <= 300) {
    return {
      esCritico: true,
      nivel: "Muy poco saludable",
      mensaje: `El aire en ${comuna} es muy poco saludable. Evite actividades al aire libre.`,
    };
  }

  if (aqi > 300) {
    return {
      esCritico: true,
      nivel: "Peligroso",
      mensaje: `Alerta roja en ${comuna}: la calidad del aire es peligrosa.`,
    };
  }

  return {
    esCritico: false,
    nivel: "Moderado o bueno",
    mensaje: `Condiciones aceptables en ${comuna}.`,
  };
}
