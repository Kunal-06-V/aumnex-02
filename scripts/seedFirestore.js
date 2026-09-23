const admin = require("firebase-admin/app");
const {
  getFirestore,
} = require("firebase-admin/firestore");
const {
  getAuth,
} = require("firebase-admin/auth");

const fs = require("fs-extra");
const path = require("path");

const serviceAccount = require("../firebase-service-account.json");

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

/**
 * Recursively seed documents and subcollections.
 */
async function seedDocuments(
  collectionRef,
  documents
) {
  for (const [docId, docData] of Object.entries(
    documents
  )) {
    const {
      _subcollections,
      ...fields
    } = docData;

    await collectionRef
      .doc(docId)
      .set(fields, {
        merge: true,
      });

    console.log(
      `✔ ${collectionRef.id}/${docId}`
    );

    if (_subcollections) {
      for (const [
        subName,
        subDocs,
      ] of Object.entries(
        _subcollections
      )) {
        await seedDocuments(
          collectionRef
            .doc(docId)
            .collection(subName),
          subDocs
        );
      }
    }
  }
}

/**
 * Seed a normal Firestore collection
 * from firebase-data/{collection}.json
 */
async function seedCollection(
  collectionName
) {
  const file = path.join(
    __dirname,
    "..",
    "firebase-data",
    `${collectionName}.json`
  );

  if (!(await fs.pathExists(file))) {
    console.log(
      `⚠ ${collectionName}.json not found`
    );
    return;
  }

  const json =
    await fs.readJson(file);

  console.log(
    `\n📦 Seeding ${collectionName}...`
  );

  await seedDocuments(
    db.collection(collectionName),
    json
  );

  console.log(
    `✅ ${collectionName} completed`
  );
}

/**
 * Create or reuse the dedicated NFC reader
 * Firebase Authentication account and then
 * create/update its Firestore authorization
 * record.
 */
async function seedNfcReader() {
  const email =
    "aumnex.nfc.reader@gmail.com";

  const password =
    "AumnexNFC#2026Reader";

  const displayName =
    "AUMNex NFC Reader";

  let user;

  try {
    // ----------------------------------------------------------
    // Try to find existing Firebase Auth account
    // ----------------------------------------------------------

    user =
      await auth.getUserByEmail(
        email
      );

    console.log(
      `✔ NFC reader Auth account already exists: ${user.uid}`
    );
  } catch (error) {
    if (
      error.code !==
      "auth/user-not-found"
    ) {
      throw error;
    }

    // ----------------------------------------------------------
    // Create account if it doesn't exist
    // ----------------------------------------------------------

    user =
      await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false,
      });

    console.log(
      `✔ Created NFC reader Auth account: ${user.uid}`
    );
  }

  // ------------------------------------------------------------
  // Create / update Firestore authorization document
  // ------------------------------------------------------------

  await db
    .collection("nfcReaders")
    .doc(user.uid)
    .set(
      {
        uid: user.uid,
        name: displayName,
        email,
        role: "nfc-reader",
        status: "Active",
        device: "Moto G84",
        updatedAt:
          new Date().toISOString(),
      },
      {
        merge: true,
      }
    );

  console.log(
    `✔ nfcReaders/${user.uid}`
  );

  console.log(
    `✅ NFC reader provisioning completed`
  );

  console.log(
    `   Email: ${email}`
  );

  console.log(
    `   UID: ${user.uid}`
  );
}

/**
 * Main seed process.
 */
async function main() {
  console.log(
    "\n🚀 Starting AUMNex Firestore Seeder...\n"
  );

  console.log(
    "🔐 Provisioning NFC reader account..."
  );

  await seedNfcReader();

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

  console.log(
    "\nCollections to seed:",
    collections.join(", ")
  );

  for (const collection of collections) {
    await seedCollection(
      collection
    );
  }

  console.log(
    "\n🎉 Firestore Seed Completed!\n"
  );
}

main().catch((error) => {
  console.error(
    "\n❌ Firestore Seed Failed:\n",
    error
  );

  process.exit(1);
});