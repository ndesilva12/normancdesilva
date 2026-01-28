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

export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  accountName: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  pending: boolean;
  institutionName: string;
  paymentChannel: string;
  logoUrl: string | null;
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
    const { userId, startDate, endDate, accountIds } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString().split("T")[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Get all Plaid items for this user
    const db = getFirestore();
    const plaidItemsRef = db.collection("users").doc(userId).collection("plaid_items");
    const plaidItemsSnapshot = await plaidItemsRef.get();

    if (plaidItemsSnapshot.empty) {
      return NextResponse.json({ transactions: [] });
    }

    const allTransactions: PlaidTransaction[] = [];

    // Fetch transactions from each linked institution
    for (const doc of plaidItemsSnapshot.docs) {
      const itemData = doc.data();
      const accessToken = decryptToken(itemData.accessToken);

      try {
        // First get accounts to map account IDs to names
        const accountsResponse = await plaidClient.accountsGet({
          access_token: accessToken,
        });

        const accountMap = new Map(
          accountsResponse.data.accounts.map((acc) => [acc.account_id, acc.name])
        );

        // Then get transactions
        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: start,
          end_date: end,
          options: {
            count: 100,
            offset: 0,
            account_ids: accountIds,
          },
        });

        for (const transaction of transactionsResponse.data.transactions) {
          allTransactions.push({
            transactionId: transaction.transaction_id,
            accountId: transaction.account_id,
            accountName: accountMap.get(transaction.account_id) || "Unknown Account",
            amount: transaction.amount,
            date: transaction.date,
            name: transaction.name,
            merchantName: transaction.merchant_name || null,
            category: transaction.category || [],
            pending: transaction.pending,
            institutionName: itemData.institutionName || "Unknown",
            paymentChannel: transaction.payment_channel,
            logoUrl: transaction.logo_url || null,
          });
        }
      } catch (plaidError) {
        console.error(`Error fetching transactions for item ${doc.id}:`, plaidError);
        // Continue with other items
      }
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions: allTransactions });
  } catch (error) {
    console.error("Error fetching Plaid transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
