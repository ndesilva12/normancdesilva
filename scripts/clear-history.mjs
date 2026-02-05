import admin from 'firebase-admin';

// Initialize Firebase Admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'the-dashboard-50be1';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

async function clearHistories() {
  const collections = [
    'curate_history',
    'l3d_history',
    'deep_search_history',
    'dark_search_history'
  ];

  for (const collection of collections) {
    console.log(`Clearing ${collection}...`);
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared ${snapshot.size} documents from ${collection}`);
  }

  console.log('All histories cleared!');
  process.exit(0);
}

clearHistories().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
