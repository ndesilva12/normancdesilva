// Cleanup script to mark stuck searches as failed
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'the-dashboard-50be1',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupStuckSearches() {
  console.log('Cleaning up stuck searches...');
  
  const collections = ['curate_history', 'l3d_history', 'deep_search_history', 'dark_search_history'];
  
  for (const collectionName of collections) {
    console.log(`\nChecking ${collectionName}...`);
    
    // Find all "running" searches older than 10 minutes
    const tenMinutesAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000));
    
    const snapshot = await db.collection(collectionName)
      .where('status', '==', 'running')
      .where('timestamp', '<', tenMinutesAgo)
      .get();
    
    console.log(`Found ${snapshot.size} stuck searches`);
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'failed',
        error: 'Search timed out (likely from previous deployment)',
        completed_at: admin.firestore.Timestamp.now(),
      });
    });
    
    if (snapshot.size > 0) {
      await batch.commit();
      console.log(`Marked ${snapshot.size} searches as failed`);
    }
  }
  
  console.log('\nCleanup complete!');
  process.exit(0);
}

cleanupStuckSearches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
