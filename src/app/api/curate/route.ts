import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";

const execAsync = promisify(exec);

// Increase timeout for Curate (requires Vercel Pro)
export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const { topic, source } = await request.json();
    
    // Use external Python API server instead of exec
    const apiUrl = process.env.PYTHON_API_URL || "https://api.normancdesilva.com";
    
    console.log(`Calling Python API: ${apiUrl}/curate with topic="${topic || "general"}", source="${source || "all"}"`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    const response = await fetch(`${apiUrl}/curate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic || "general",
        source: source || "all",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
      console.error("Python API error:", errorData);
      throw new Error(errorData.detail || "Python API request failed");
    }
    
    const apiResult = await response.json();
    
    if (!apiResult.success || !apiResult.data) {
      throw new Error("Invalid response from Python API");
    }
    
    const result = apiResult.data;
    
    // Transform the result into the expected format
    const items = [];
    
    // Process each category
    const categories = [
      { key: 'short_unique', type: 'short-unique' },
      { key: 'short_trending', type: 'short-trending' },
      { key: 'long_unique', type: 'long-unique' },
      { key: 'long_trending', type: 'long-trending' },
    ];
    
    for (const { key, type } of categories) {
      if (result[key] && Array.isArray(result[key])) {
        result[key].forEach((item: any, index: number) => {
          items.push({
            id: `${type}-${index}`,
            title: item.title || "Untitled",
            url: item.url || "#",
            summary: item.summary || "No summary available",
            source: item.source_name || item.source || "Unknown",
            duration: `${item.estimated_minutes || "?"}min`,
            category: type,
          });
        });
      }
    }
    
    // Save to Firestore
    const userId = request.headers.get("x-user-id");
    if (userId) {
      try {
        const curationsRef = collection(db, "curations");
        await addDoc(curationsRef, {
          userId,
          topic: topic || "general",
          source: source || "all",
          items,
          timestamp: Timestamp.now(),
          itemCount: items.length,
        });
      } catch (firestoreError) {
        console.error("Failed to save to Firestore:", firestoreError);
        // Don't fail the request if Firestore save fails
      }
    }
    
    return NextResponse.json({
      success: true,
      items,
      topic: topic || "general",
      source: source || "all",
    });
    
  } catch (error) {
    console.error("Curate error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to curate content",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  
  if (!userId) {
    return NextResponse.json({ curations: [] });
  }
  
  try {
    const curationsRef = collection(db, "curations");
    const q = query(
      curationsRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const curations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString(),
    }));
    
    return NextResponse.json({ curations });
  } catch (error) {
    console.error("Failed to fetch curations:", error);
    return NextResponse.json({ curations: [], error: "Failed to fetch history" });
  }
}
