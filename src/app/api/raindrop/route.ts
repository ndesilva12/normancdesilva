import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Get token from either environment variable or OAuth cookie
async function getRaindropToken(): Promise<string | null> {
  // First check for test token in environment
  const envToken = process.env.RAINDROP_TOKEN;
  if (envToken) return envToken;

  // Then check for OAuth token in cookies
  const cookieStore = await cookies();
  const oauthToken = cookieStore.get("raindrop_access_token")?.value;
  if (oauthToken) return oauthToken;

  return null;
}

interface RaindropItem {
  _id: number;
  title: string;
  excerpt: string;
  link: string;
  domain: string;
  created: string;
  lastUpdate: string;
  tags: string[];
  cover: string;
  type: string;
  collection: {
    $id: number;
  };
}

interface RaindropCollection {
  _id: number;
  title: string;
  count: number;
  color: string;
  cover: string[];
}

export interface FormattedRaindrop {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  domain: string;
  createdAt: string;
  tags: string[];
  coverImage?: string;
  type: string;
  collectionId: number;
}

export interface FormattedCollection {
  id: number;
  title: string;
  count: number;
  color: string;
}

// Fetch bookmarks from a collection (0 = Unsorted, -1 = All)
async function fetchRaindrops(token: string, collectionId: number = 0, limit: number = 25): Promise<RaindropItem[]> {
  const response = await fetch(
    `https://api.raindrop.io/rest/v1/raindrops/${collectionId}?perpage=${limit}&sort=-created`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Raindrop API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Fetch all collections
async function fetchCollections(token: string): Promise<RaindropCollection[]> {
  const response = await fetch(
    "https://api.raindrop.io/rest/v1/collections",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Raindrop API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collectionId = parseInt(searchParams.get("collection") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const listCollections = searchParams.get("collections") === "true";

  // Get token from environment or OAuth
  const token = await getRaindropToken();
  if (!token) {
    return NextResponse.json(
      {
        error: "Not connected to Raindrop.io. Please connect your account or add RAINDROP_TOKEN to environment variables.",
        needsAuth: true
      },
      { status: 401 }
    );
  }

  try {
    // Return collections list if requested
    if (listCollections) {
      const collections = await fetchCollections(token);
      const formatted: FormattedCollection[] = collections.map((c) => ({
        id: c._id,
        title: c.title,
        count: c.count,
        color: c.color,
      }));

      // Add system collections
      formatted.unshift(
        { id: 0, title: "Unsorted", count: 0, color: "#808080" },
        { id: -1, title: "All Bookmarks", count: 0, color: "#3b82f6" }
      );

      return NextResponse.json({ collections: formatted });
    }

    // Fetch bookmarks
    const raindrops = await fetchRaindrops(token, collectionId, limit);

    const formatted: FormattedRaindrop[] = raindrops.map((item) => ({
      id: item._id,
      title: item.title,
      excerpt: item.excerpt,
      url: item.link,
      domain: item.domain,
      createdAt: item.created,
      tags: item.tags,
      coverImage: item.cover || undefined,
      type: item.type,
      collectionId: item.collection?.$id || 0,
    }));

    return NextResponse.json({ bookmarks: formatted });
  } catch (error) {
    console.error("Raindrop API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch from Raindrop.io" },
      { status: 500 }
    );
  }
}
