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
 * Seed documents recursively.
 */
async function seedDocuments(collectionRef, documents) {
  for (const [docId, docData] of Object.entries(documents)) {
    const { _subcollections, ...fields } = docData;

    await collectionRef.doc(docId).set(fields, {
      merge: true,
    });

    console.log(`✔ ${collectionRef.id}/${docId}`);

    if (_subcollections) {
      for (const [subName, subDocs] of Object.entries(
        _subcollections
      )) {
        await seedDocuments(
          collectionRef.doc(docId).collection(subName),
          subDocs
        );
      }
    }
  }
}

/**
 * Seed one collection from:
 * firebase-data/<collectionName>.json
 */
async function seedCollection(collectionName) {
  const file = path.join(
    __dirname,
    "..",
    "firebase-data",
    `${collectionName}.json`
  );

  if (!(await fs.pathExists(file))) {
    console.log(
      `⚠ ${collectionName}.json not found - skipping`
    );
    return;
  }

  const json = await fs.readJson(file);

  console.log(`\n📦 Seeding ${collectionName}...`);

  await seedDocuments(
    db.collection(collectionName),
    json
  );

  console.log(`✅ ${collectionName} completed`);
}

/**
 * Main seeder.
 *
 * Run everything:
 * node scripts/seedFirestore.js
 *
 * Run selected collections:
 * node scripts/seedFirestore.js academicSettings
 *
 * Multiple collections:
 * node scripts/seedFirestore.js academicSettings subjects
 */
async function main() {
  console.log("\n🚀 Starting AUMNex Firestore Seeder...\n");

  const defaultCollections = [
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
    "academicSettings",
  ];

  const requestedCollections = process.argv.slice(2);

  const collections =
    requestedCollections.length > 0
      ? requestedCollections
      : defaultCollections;

  console.log(
    `Collections to seed: ${collections.join(", ")}\n`
  );

  for (const collection of collections) {
    await seedCollection(collection);
  }

  console.log("\n🎉 Firestore Seed Completed!\n");
}

main().catch((error) => {
  console.error("\n❌ Seeder failed:");
  console.error(error);
  process.exit(1);
});