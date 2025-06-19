import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  if (usingEmulator) {
    console.log("🔥 Inicializando Firebase Admin en modo EMULADOR");
    admin.initializeApp({
      projectId: process.env.PROJECT_ID || "anp-firebase", // ✅ usa una variable NO reservada
    });
  } else {
    console.log("☁️ Inicializando Firebase Admin en modo PRODUCCIÓN");
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "serviceAccountKey.json";
    if (!fs.existsSync(keyPath)) {
      throw new Error(`❌ Archivo de credenciales no encontrado: ${keyPath}`);
    }
    const serviceAccount = require(`../../${keyPath}`);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

// ✅ Ahora sí es seguro inicializar Firestore
const db = admin.firestore();

if (usingEmulator) {
  db.settings({
    host: "localhost:8081",
    ssl: false,
  });
}

export { admin, db };
