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

export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    isoCurrencyCode: string | null;
  };
  institutionName: string;
  itemId: string;
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all Plaid items for this user
    const db = getFirestore();
    const plaidItemsRef = db.collection("users").doc(userId).collection("plaid_items");
    const plaidItemsSnapshot = await plaidItemsRef.get();

    if (plaidItemsSnapshot.empty) {
      return NextResponse.json({ accounts: [], institutions: [] });
    }

    const allAccounts: PlaidAccount[] = [];
    const institutions: { itemId: string; name: string; institutionId: string | null }[] = [];

    // Fetch accounts from each linked institution
    for (const doc of plaidItemsSnapshot.docs) {
      const itemData = doc.data();
      const accessToken = decryptToken(itemData.accessToken);

      try {
        const accountsResponse = await plaidClient.accountsBalanceGet({
          access_token: accessToken,
        });

        institutions.push({
          itemId: doc.id,
          name: itemData.institutionName || "Unknown Institution",
          institutionId: itemData.institutionId,
        });

        for (const account of accountsResponse.data.accounts) {
          allAccounts.push({
            accountId: account.account_id,
            name: account.name,
            officialName: account.official_name,
            type: account.type,
            subtype: account.subtype,
            mask: account.mask,
            balances: {
              available: account.balances.available,
              current: account.balances.current,
              limit: account.balances.limit,
              isoCurrencyCode: account.balances.iso_currency_code,
            },
            institutionName: itemData.institutionName || "Unknown",
            itemId: doc.id,
          });
        }
      } catch (plaidError) {
        console.error(`Error fetching accounts for item ${doc.id}:`, plaidError);
        // Continue with other items
      }
    }

    return NextResponse.json({ accounts: allAccounts, institutions });
  } catch (error) {
    console.error("Error fetching Plaid accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
