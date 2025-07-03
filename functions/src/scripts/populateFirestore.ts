// src/scripts/populateFirestore.ts
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const EMULATOR_MODE = !!process.env.FIRESTORE_EMULATOR_HOST;
const LOCAL_PROJECT_ID = process.env.PROJECT_ID || "arquitectura-en-nube";

// Inicializar Firebase Admin de forma segura según el entorno
if (!admin.apps.length) {
  if (EMULATOR_MODE) {
    console.log("🔥 Inicializando Firebase Admin en modo EMULADOR");
    admin.initializeApp({projectId: LOCAL_PROJECT_ID});
  } else {
    console.log("☁️ Inicializando Firebase Admin en modo PRODUCCIÓN");
    const serviceAccountPath = path.resolve(
      __dirname,
      "../../serviceAccountKey.json"
    );
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
  }
}

const db = admin.firestore();

const regionesJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../data/regions.json"), "utf-8")
).data;

const comunasJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../data/comunas.json"), "utf-8")
);

// Mapa de regiones a sus IDs
const regionNumbers: Record<string, number> = {
  "Arica y Parinacota": 15,
  Tarapaca: 1,
  Antofagasta: 2,
  Atacama: 3,
  Coquimbo: 4,
  Valparaiso: 5,
  "O'Higgins": 6,
  Maule: 7,
  Biobio: 8,
  Araucania: 9,
  "Los Lagos": 10,
  Aysen: 11,
  Magallanes: 12,
  "Santiago Metropolitan": 13,
  "Los Rios": 14
};

async function populateFirestore(): Promise<void> {
  const regionRefs: Record<string, FirebaseFirestore.DocumentReference> = {};

  console.log("🌍 Creando documentos de regiones...");

  for (const region of regionesJson) {
    const regionName = region.state;
    const regionId = regionNumbers[regionName];

    if (!regionId) {
      console.warn(`⚠️ Región sin ID: ${regionName}`);
      continue;
    }

    const regionRef = db.collection("regiones").doc(regionId.toString());
    await regionRef.set({id: regionId, name: regionName});
    regionRefs[regionName] = regionRef;

    console.log(`✅ Región creada: ${regionName} (ID: ${regionId})`);
  }

  console.log("🏘️ Creando documentos de comunas...");
  let comunaCounter = 1;

  for (const [regionName, comunas] of Object.entries(comunasJson)) {
    const regionRef = regionRefs[regionName];
    if (!regionRef) {
      console.warn(`⚠️ Región no encontrada para ${regionName}.`);
      continue;
    }

    for (const comuna of comunas as Array<{city: string}>) {
      const comunaId = `comuna_${comunaCounter++}`;
      const comunaRef = db.collection("comunas").doc(comunaId);

      await comunaRef.set({
        id: comunaId,
        name: comuna.city,
        regionRef
      });

      console.log(
        `🏙️ Comuna registrada: ${comuna.city} (Región: ${regionName})`
      );
    }
  }

  console.log("✅ Población de Firestore completada.");
}

if (require.main === module) {
  populateFirestore()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error al poblar Firestore:", err);
      process.exit(1);
    });
}
