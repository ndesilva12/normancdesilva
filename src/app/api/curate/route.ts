import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { topic, source } = await request.json();
    
    // Build the curate command using script from project root
    const projectRoot = process.cwd();
    const scriptPath = `${projectRoot}/scripts/curate_v3.py`;
    
    let command = `python3 ${scriptPath}`;
    
    if (topic && topic !== "general") {
      command += ` --topic "${topic.replace(/"/g, '\\"')}"`;
    }
    
    if (source && source !== "all") {
      command += ` --source "${source}"`;
    }
    
    // Add JSON output flag and skip notion
    command += " --output json --skip-notion";
    
    console.log("Executing curate command:", command);
    
    // Execute the curate script
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        XAI_API_KEY: process.env.XAI_API_KEY || "",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
        BRAVE_API_KEY: process.env.BRAVE_API_KEY || "",
      },
    });
    
    if (stderr) {
      console.error("Curate stderr:", stderr);
    }
    
    // Parse the JSON output
    const result = JSON.parse(stdout);
    
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
