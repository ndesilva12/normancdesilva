import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

const GATEWAY_URL = "ws://100.120.206.86:18789";
const GATEWAY_PASSWORD = "HowardRoark12!";

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Use a persistent session key per user to maintain conversation history
    // All dashboard conversations use the same session key for continuity
    const sessionKey = userId ? `dashboard-${userId}` : "dashboard-norman";

    const responseText = await sendToJimmy(query, sessionKey);

    return NextResponse.json({
      success: true,
      content: responseText, // Match the expected format
      source: "jimmy",
    });
  } catch (error) {
    console.error("Jimmy API error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with Jimmy" },
      { status: 500 }
    );
  }
}

async function sendToJimmy(
  message: string,
  sessionKey: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(GATEWAY_URL);
    let response = "";
    let authenticated = false;

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Timeout waiting for response from Jimmy"));
    }, 60000); // 60 second timeout

    ws.on("open", () => {
      // Authenticate
      ws.send(
        JSON.stringify({
          type: "auth",
          password: GATEWAY_PASSWORD,
        })
      );
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "auth.success") {
          authenticated = true;
          // Send message
          ws.send(
            JSON.stringify({
              type: "chat.send",
              message: message,
              sessionKey: sessionKey,
            })
          );
        }

        if (msg.type === "chat.message" && msg.role === "assistant") {
          response += msg.content;
        }

        if (msg.type === "chat.done") {
          clearTimeout(timeout);
          ws.close();
          resolve(response || "Jimmy didn't respond. Please try again.");
        }

        if (msg.type === "error") {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(msg.message || "Unknown error"));
        }
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      if (!response && authenticated) {
        reject(new Error("Connection closed before receiving response"));
      }
    });
  });
}
