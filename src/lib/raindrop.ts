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

export interface AddBookmarkOptions {
  title: string;
  url: string;
  excerpt?: string;
  tags?: string[];
  collectionId?: number; // 0 = Unsorted, specific number for collection
  type?: "link" | "article" | "image" | "video" | "document" | "audio";
  important?: boolean;
}

export interface RaindropBookmark {
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
  important: boolean;
  collection: {
    $id: number;
  };
}

// Add a new bookmark to Raindrop.io
export async function addToRaindrop(options: AddBookmarkOptions): Promise<RaindropBookmark> {
  const token = await getRaindropToken();
  if (!token) {
    throw new Error("Not connected to Raindrop.io. Please connect your account first.");
  }

  const payload = {
    link: options.url,
    title: options.title,
    excerpt: options.excerpt || "",
    tags: options.tags || [],
    collection: {
      $id: options.collectionId || 0, // 0 = Unsorted
    },
    type: options.type || "link",
    important: options.important || false,
  };

  const response = await fetch("https://api.raindrop.io/rest/v1/raindrop", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add bookmark to Raindrop.io: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.item;
}

// Get user's collections for organization
export async function getRaindropCollections(): Promise<Array<{ id: number; title: string; count: number }>> {
  const token = await getRaindropToken();
  if (!token) {
    throw new Error("Not connected to Raindrop.io. Please connect your account first.");
  }

  const response = await fetch("https://api.raindrop.io/rest/v1/collections", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.status}`);
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    id: item._id,
    title: item.title,
    count: item.count,
  }));
}

// Search existing bookmarks to avoid duplicates
export async function searchRaindropBookmarks(query: string): Promise<RaindropBookmark[]> {
  const token = await getRaindropToken();
  if (!token) {
    throw new Error("Not connected to Raindrop.io. Please connect your account first.");
  }

  const response = await fetch(
    `https://api.raindrop.io/rest/v1/raindrops/0?search=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search bookmarks: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Check if a URL already exists in bookmarks
export async function checkIfBookmarkExists(url: string): Promise<boolean> {
  try {
    const results = await searchRaindropBookmarks(url);
    return results.some(bookmark => bookmark.link === url);
  } catch (error) {
    console.error("Error checking bookmark existence:", error);
    return false; // If we can't check, assume it doesn't exist
  }
}

// High-level function to add a bookmark with smart defaults
export async function addBookmarkSmart(
  url: string,
  title?: string,
  options: Partial<AddBookmarkOptions> = {}
): Promise<{ success: boolean; bookmark?: RaindropBookmark; message: string; duplicate?: boolean }> {
  try {
    // Check if bookmark already exists
    const exists = await checkIfBookmarkExists(url);
    if (exists) {
      return {
        success: false,
        message: "Bookmark already exists in your Raindrop.io account",
        duplicate: true,
      };
    }

    // Add the bookmark
    const bookmark = await addToRaindrop({
      url,
      title: title || url,
      tags: options.tags || ["added-by-jimmy"],
      excerpt: options.excerpt,
      collectionId: options.collectionId || 0, // Unsorted by default
      important: options.important || false,
    });

    return {
      success: true,
      bookmark,
      message: `Successfully added "${bookmark.title}" to your reading list`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add bookmark",
    };
  }
}