import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    try {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
      });
    } catch {
      // Already initialized or error
    }
  }
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Simple decryption for access tokens
function decryptToken(encryptedToken: string): string {
  const key = process.env.PLAID_ENCRYPTION_KEY || "default-key-change-me";
  const decoded = Buffer.from(encryptedToken, "base64").toString();
  let decrypted = "";
  for (let i = 0; i < decoded.length; i++) {
    decrypted += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return decrypted;
}

export async function POST(request: NextRequest) {
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return NextResponse.json(
      { error: "Plaid credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { userId, itemId } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: "User ID and item ID are required" },
        { status: 400 }
      );
    }

    // Get the Plaid item from Firestore
    const db = getFirestore();
    const plaidItemRef = db.collection("users").doc(userId).collection("plaid_items").doc(itemId);
    const plaidItemDoc = await plaidItemRef.get();

    if (!plaidItemDoc.exists) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const itemData = plaidItemDoc.data();
    const accessToken = decryptToken(itemData?.accessToken || "");

    // Remove the item from Plaid
    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (plaidError) {
      console.error("Error removing item from Plaid:", plaidError);
      // Continue to delete from Firestore even if Plaid removal fails
    }

    // Delete from Firestore
    await plaidItemRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Plaid item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
