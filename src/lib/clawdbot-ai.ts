// AI-powered summarization and relevance filtering via Clawdbot

const CLAWDBOT_URL = "http://localhost:3032/api/sessions/send";
const CLAWDBOT_TOKEN = "01c11d12ea993efba6e4796e8e914db50bbab121913da457";

interface ClawdbotResponse {
  response?: string;
  error?: string;
}

/**
 * Generate a concise summary of an email or calendar event
 */
export async function generateSummary(
  type: "email" | "event",
  subject: string,
  content: string
): Promise<string> {
  const prompt = `Summarize this ${type} in 1-2 sentences (max 150 chars):

Subject: ${subject}
Content: ${content.substring(0, 1000)}

Focus on: key action items, decisions, or topics discussed. Be concise and specific.`;

  try {
    const response = await fetch(CLAWDBOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLAWDBOT_TOKEN}`,
      },
      body: JSON.stringify({
        label: "relationship-intel-summarizer",
        message: prompt,
        timeoutSeconds: 30,
      }),
    });

    const data: ClawdbotResponse = await response.json();

    if (data.response) {
      // Truncate to 150 chars if needed
      return data.response.substring(0, 150);
    }

    return "Summary unavailable";
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return "Summary unavailable";
  }
}

/**
 * Determine if an email or event is relevant to a project using AI
 */
export async function isRelevantToProject(
  type: "email" | "event",
  projectName: string,
  projectKeywords: string[],
  subject: string,
  content: string,
  participants: string[]
): Promise<{ relevant: boolean; confidence: number; reason: string }> {
  const prompt = `You are analyzing whether a ${type} is relevant to the project "${projectName}".

Project context:
- Name: ${projectName}
- Keywords: ${projectKeywords.join(", ")}

${type === "email" ? "Email" : "Event"} details:
- Subject: ${subject}
- Content preview: ${content.substring(0, 500)}
- Participants: ${participants.join(", ")}

Answer in this exact JSON format:
{
  "relevant": true/false,
  "confidence": 0-100,
  "reason": "brief explanation"
}

Consider:
1. Does the content discuss topics related to the project keywords?
2. Are the participants likely involved in this project?
3. Is this a substantive interaction (not just calendar holds, automated emails, etc.)?

Be selective - only mark as relevant if there's clear connection to the project.`;

  try {
    const response = await fetch(CLAWDBOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLAWDBOT_TOKEN}`,
      },
      body: JSON.stringify({
        label: "relationship-intel-filter",
        message: prompt,
        timeoutSeconds: 30,
      }),
    });

    const data: ClawdbotResponse = await response.json();

    if (data.response) {
      // Try to parse JSON response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          relevant: result.relevant || false,
          confidence: result.confidence || 0,
          reason: result.reason || "Unknown",
        };
      }
    }

    // Default to not relevant if parsing fails
    return {
      relevant: false,
      confidence: 0,
      reason: "Failed to analyze relevance",
    };
  } catch (error) {
    console.error("Failed to check relevance:", error);
    return {
      relevant: false,
      confidence: 0,
      reason: "Error during analysis",
    };
  }
}

/**
 * Batch process multiple items for relevance (more efficient)
 */
export async function batchFilterRelevance(
  projectName: string,
  projectKeywords: string[],
  items: Array<{
    id: string;
    type: "email" | "event";
    subject: string;
    content: string;
    participants: string[];
  }>
): Promise<Map<string, { relevant: boolean; confidence: number; reason: string }>> {
  const results = new Map();

  // Process in batches of 5 to avoid overwhelming Clawdbot
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(item =>
      isRelevantToProject(
        item.type,
        projectName,
        projectKeywords,
        item.subject,
        item.content,
        item.participants
      ).then(result => ({ id: item.id, result }))
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });

    // Small delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
