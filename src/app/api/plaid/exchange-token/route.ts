import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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

// Simple encryption for access tokens (in production, use proper encryption)
function encryptToken(token: string): string {
  const key = process.env.PLAID_ENCRYPTION_KEY || "default-key-change-me";
  let encrypted = "";
  for (let i = 0; i < token.length; i++) {
    encrypted += String.fromCharCode(
      token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return Buffer.from(encrypted).toString("base64");
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
    const { publicToken, userId, institutionId, institutionName } = body;

    if (!publicToken || !userId) {
      return NextResponse.json(
        { error: "Public token and user ID are required" },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Store encrypted access token in Firestore
    const db = getFirestore();
    const userPlaidRef = db.collection("users").doc(userId).collection("plaid_items").doc(itemId);

    await userPlaidRef.set({
      accessToken: encryptToken(accessToken),
      itemId,
      institutionId: institutionId || null,
      institutionName: institutionName || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      itemId,
      institutionName,
    });
  } catch (error) {
    console.error("Error exchanging Plaid token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
