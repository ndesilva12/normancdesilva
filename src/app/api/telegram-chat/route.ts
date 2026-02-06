import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = "8273394016:AAEv-Kj_aBEqwb4Kixs6I3rg9j471fSaMsk";
const TELEGRAM_USERNAME = "normancdesilva"; // Your Telegram username
const TELEGRAM_API = "https://api.telegram.org";

// Get user ID from username
async function getUserIdFromUsername(username: string): Promise<string | null> {
  try {
    // Try to get the user ID by sending a message and checking updates
    const response = await fetch(
      `${TELEGRAM_API}/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
    );
    const data = await response.json();

    if (data.result && data.result.length > 0) {
      // Get the most recent message's chat ID
      const chatId = data.result[0]?.message?.chat?.id;
      if (chatId) {
        return String(chatId);
      }
    }
    return null;
  } catch (error) {
    console.error("[Telegram] Error getting user ID:", error);
    return null;
  }
}

// Send message via Telegram bot
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  try {
    const response = await fetch(
      `${TELEGRAM_API}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
  } catch (error) {
    console.error("[Telegram] Error sending message:", error);
    throw error;
  }
}

// Poll for new messages
async function pollForResponse(chatId: string, timeoutMs: number = 30000): Promise<string | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(
        `${TELEGRAM_API}/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
      );
      const data = await response.json();

      if (data.result && data.result.length > 0) {
        // Get the most recent message
        const latestMessage = data.result[0]?.message;
        if (latestMessage && latestMessage.chat?.id === parseInt(chatId)) {
          // Check if it's from someone else (Jimmy's response)
          if (latestMessage.from?.is_bot) {
            return latestMessage.text;
          }
        }
      }
    } catch (error) {
      console.error("[Telegram] Polling error:", error);
    }

    // Wait 1 second before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message" },
        { status: 400 }
      );
    }

    // Get chat ID (cache this in production)
    const chatId = await getUserIdFromUsername(TELEGRAM_USERNAME);
    if (!chatId) {
      return NextResponse.json(
        { error: "Could not find Telegram chat ID. Send a message to @jimmy_desilva_bot first." },
        { status: 400 }
      );
    }

    console.log("[Telegram Chat] Sending message:", { chatId, message });

    // Send the user's message to Telegram
    await sendTelegramMessage(chatId, message);

    // Poll for Jimmy's response (30 second timeout)
    const response = await pollForResponse(chatId, 30000);

    if (!response) {
      return NextResponse.json(
        { error: "No response from Jimmy" },
        { status: 408 }
      );
    }

    return NextResponse.json({
      content: response,
      success: true,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Telegram Chat] Error:", errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
