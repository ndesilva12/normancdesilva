import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }
    
    // Use external Python API server instead of exec
    const apiUrl = process.env.PYTHON_API_URL || "https://api.normancdesilva.com";
    
    console.log(`Calling Python API: ${apiUrl}/l3d-research`);
    
    const response = await fetch(`${apiUrl}/l3d-research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
      console.error("Python API error:", errorData);
      throw new Error(errorData.detail || "Python API request failed");
    }
    
    const apiResult = await response.json();
    
    if (!apiResult.success || !apiResult.result) {
      throw new Error("Invalid response from Python API");
    }
    
    const result = apiResult.result;
    
    // Save to Firestore
    const userId = request.headers.get("x-user-id");
    if (userId) {
      try {
        const researchRef = collection(db, "l3d_research");
        await addDoc(researchRef, {
          userId,
          query,
          result,
          timestamp: Timestamp.now(),
          patternCount: result.patterns?.length || 0,
          sourceCount: result.sources?.length || 0,
        });
      } catch (firestoreError) {
        console.error("Failed to save to Firestore:", firestoreError);
        // Don't fail the request if Firestore save fails
      }
    }
    
    return NextResponse.json({
      success: true,
      result,
      query,
    });
    
  } catch (error) {
    console.error("Last30Days error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to research topic",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  
  if (!userId) {
    return NextResponse.json({ research: [] });
  }
  
  try {
    const researchRef = collection(db, "l3d_research");
    const q = query(
      researchRef,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const research = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString(),
    }));
    
    return NextResponse.json({ research });
  } catch (error) {
    console.error("Failed to fetch research:", error);
    return NextResponse.json({ research: [], error: "Failed to fetch history" });
  }
}
