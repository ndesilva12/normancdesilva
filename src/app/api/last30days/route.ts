import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }
    
    // Mock data for demonstration
    // TODO: Integrate actual L3D research logic
    
    const mockResult = {
      patterns: [
        "Users report best results when providing specific context about their use case and desired output format upfront",
        "Breaking complex tasks into smaller, explicit steps yields significantly better outcomes than single monolithic prompts",
        "Including examples (few-shot prompting) dramatically improves consistency, especially for formatting and tone",
        "Iterative refinement based on initial outputs performs better than trying to perfect prompts from scratch",
      ],
      mistakes: [
        "Being too vague about requirements - AI fills in gaps unpredictably",
        "Not specifying output format or length constraints leads to inconsistent results",
        "Forgetting to test prompts multiple times before deploying (single-run optimization)",
        "Overcomplicating prompts with unnecessary instructions that confuse the model",
      ],
      techniques: [
        {
          technique: "Chain-of-thought prompting: Explicitly ask the model to show its reasoning step-by-step before giving final answer",
          source: "Reddit u/ml_researcher",
          url: "https://reddit.com/r/ChatGPT/comments/example1",
        },
        {
          technique: "Role prompting: Define a specific expert persona (e.g., 'You are a senior software architect with 15 years experience')",
          source: "X @prompt_engineer",
          url: "https://twitter.com/example/status/123",
        },
        {
          technique: "Constrained output: Use structured formats like JSON, XML, or markdown tables to enforce consistency",
          source: "Reddit r/LocalLLaMA",
          url: "https://reddit.com/r/LocalLLaMA/comments/example2",
        },
      ],
      sources: [
        {
          url: "https://reddit.com/r/ChatGPT/comments/example1",
          description: "Detailed guide on advanced prompting techniques with 500+ upvotes",
          platform: "Reddit",
        },
        {
          url: "https://twitter.com/example/status/123",
          description: "Viral thread breaking down what actually works for GPT-4 prompting",
          platform: "X",
        },
        {
          url: "https://example.com/blog/prompting-guide",
          description: "Comprehensive analysis of 100+ prompt experiments with success metrics",
          platform: "Web",
        },
        {
          url: "https://reddit.com/r/LocalLLaMA/comments/example2",
          description: "Community discussion on structured output generation techniques",
          platform: "Reddit",
        },
      ],
      prompt: `You are an expert ${query} specialist with deep practical experience.

Task: [Describe your specific task here]

Context:
- [Provide relevant background information]
- [Include any constraints or requirements]
- [Specify your target audience or use case]

Instructions:
1. First, analyze the problem and identify key considerations
2. Then, provide your solution with clear reasoning
3. Finally, summarize actionable next steps

Output format: [Specify desired format - e.g., markdown, JSON, bullet points]

Please show your step-by-step thinking before providing the final answer.`,
    };
    
    return NextResponse.json({
      success: true,
      result: mockResult,
      query,
      note: "Using mock data - L3D research integration pending",
    });
    
    /* ACTUAL IMPLEMENTATION - TODO:
    
    const research = await conductL3DResearch(query);
    
    return NextResponse.json({
      success: true,
      result: research,
      query,
    });
    */
    
  } catch (error) {
    console.error("Last30Days error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to research topic",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Last 30 Days Research API - Use POST to research a topic",
    endpoints: {
      POST: "/api/last30days",
    },
    parameters: {
      query: "Research topic (required)",
    },
  });
}
