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
    
    // Use the Python research script from project root
    const projectRoot = process.cwd();
    const scriptPath = `${projectRoot}/scripts/l3d-research.py`;
    const command = `python3 ${scriptPath} --query "${query.replace(/"/g, '\\"')}" --output json`;
    
    console.log("Executing L3D research command:", command);
    
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 1 minute timeout
      maxBuffer: 5 * 1024 * 1024, // 5MB buffer
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        BRAVE_API_KEY: process.env.BRAVE_API_KEY || "BSAN41sbCIBbhckWBTYmYAk_44Kug7g",
      },
    });
    
    if (stderr) {
      console.error("L3D stderr:", stderr);
    }
    
    // Parse the JSON output
    const result = JSON.parse(stdout);
    
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
