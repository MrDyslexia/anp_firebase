const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin con tus credenciales
const serviceAccount = require('../../serviceAccountKey.json'); // <-- reemplaza con tu archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const regionesJson = JSON.parse(
  fs.readFileSync('../../data/regions.json', 'utf-8')
).data;
const comunasJson = JSON.parse(
  fs.readFileSync('../../data/comunas.json', 'utf-8')
);

// Mapa de nombres de región a su número característico
const regionNumbers = {
  'Arica y Parinacota': 15,
  Tarapaca: 1,
  Antofagasta: 2,
  Atacama: 3,
  Coquimbo: 4,
  Valparaiso: 5,
  "O'Higgins": 6,
  Maule: 7,
  Biobio: 8,
  Araucania: 9,
  'Los Lagos': 10,
  Aysen: 11,
  Magallanes: 12,
  'Santiago Metropolitan': 13,
  'Los Rios': 14
};

async function populateFirestore() {
  const regionRefs = {};

  console.log('Creando colecciones de regiones...');

  for (const region of regionesJson) {
    const regionName = region.state;
    const regionId = regionNumbers[regionName];

    if (!regionId) {
      console.warn(
        `⚠️ No se encontró número para la región "${regionName}". Se omite.`
      );
      continue;
    }

    const regionRef = db.collection('regiones').doc(regionId.toString());

    await regionRef.set({
      id: regionId,
      nombre: regionName
    });

    regionRefs[regionName] = regionRef;
    console.log(`✅ Región creada: ${regionName} (ID: ${regionId})`);
  }

  console.log('\nCreando colecciones de comunas...');
  let comunaCounter = 1;

  for (const [regionName, comunas] of Object.entries(comunasJson)) {
    const regionRef = regionRefs[regionName];

    if (!regionRef) {
      console.warn(
        `⚠️ Región no encontrada para ${regionName}, se omiten sus comunas.`
      );
      continue;
    }

    for (const comunaObj of comunas) {
      const comunaId = `comuna_${comunaCounter++}`;
      const comunaRef = db.collection('comunas').doc(comunaId);

      await comunaRef.set({
        id: comunaId,
        nombre: comunaObj.city,
        regionRef: regionRef
      });

      console.log(
        `🏙️ Comuna creada: ${comunaObj.city} (Región: ${regionName})`
      );
    }
  }

  console.log('\n✅ Población de Firestore completada.');
}

populateFirestore().catch(console.error);
