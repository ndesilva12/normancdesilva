import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

function initializeAdmin(): { app: App; db: Firestore } | null {
  // Already initialized
  if (adminApp && adminDb) {
    return { app: adminApp, db: adminDb };
  }

  // Check for required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    console.warn("Firebase Admin: Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    return null;
  }

  try {
    // Check if already initialized
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else if (clientEmail && privateKey) {
      // Initialize with service account credentials
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          // Replace escaped newlines in private key
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      // Initialize with just project ID (works in Google Cloud environments)
      adminApp = initializeApp({
        projectId,
      });
    }

    adminDb = getFirestore(adminApp);
    return { app: adminApp, db: adminDb };
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  const result = initializeAdmin();
  return result?.db || null;
}

export { adminApp, adminDb };
