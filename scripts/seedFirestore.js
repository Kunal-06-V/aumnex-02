const admin = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs-extra");
const path = require("path");

const serviceAccount = require("../firebase-service-account.json");

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();

/**
 * Recursively seed documents and subcollections
 */
async function seedDocuments(collectionRef, documents) {
  for (const [docId, docData] of Object.entries(documents)) {
    const { _subcollections, ...fields } = docData;

    await collectionRef.doc(docId).set(fields, { merge: true });

    console.log(`✔ ${collectionRef.id}/${docId}`);

    if (_subcollections) {
      for (const [subName, subDocs] of Object.entries(_subcollections)) {
        await seedDocuments(
          collectionRef.doc(docId).collection(subName),
          subDocs
        );
      }
    }
  }
}

async function seedCollection(collectionName) {
  const file = path.join(
    __dirname,
    "..",
    "firebase-data",
    `${collectionName}.json`
  );

  if (!(await fs.pathExists(file))) {
    console.log(`⚠ ${collectionName}.json not found`);
    return;
  }

  const json = await fs.readJson(file);

  console.log(`\n📦 Seeding ${collectionName}...`);

  await seedDocuments(db.collection(collectionName), json);

  console.log(`✅ ${collectionName} completed`);
}

async function main() {
  console.log("\n🚀 Starting Firestore Seeder...\n");

 const collections = [
  "students",
  "faculty",
  "subjects",
  "rooms",
  "departments",
  "results",
  "fees",
  "attendance",
  "timetable",
  "notifications",
  "admin",
];

  for (const collection of collections) {
    await seedCollection(collection);
  }

  console.log("\n🎉 Firestore Seed Completed!\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});