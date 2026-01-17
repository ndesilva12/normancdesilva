// Contact Finder - Comprehensive contact information discovery tool
// All information is speculative and derived from publicly available sources

export type SearchType = "individual" | "target";
export type AISource = "grok" | "chatgpt" | "claude" | "gemini";

export interface ContactMethod {
  type: "email" | "phone" | "x" | "instagram" | "facebook" | "linkedin" | "website" | "form" | "other";
  value: string;
  confidence: "high" | "medium" | "low" | "speculative";
  source?: string;
  notes?: string;
}

export interface ContactResult {
  name: string;
  title?: string;
  organization?: string;
  contacts: ContactMethod[];
  reasoning?: string;
  additionalNotes?: string;
}

export interface SearchResult {
  id: string;
  query: string;
  searchType: SearchType;
  aiSource: AISource;
  results: ContactResult[];
  summary: string;
  disclaimer: string;
  createdAt: string;
  userId: string;
}

// Prompts for different search types
export function getIndividualSearchPrompt(query: string): string {
  return `You are an expert OSINT (Open Source Intelligence) researcher specializing in finding publicly available contact information. Your task is to find contact methods for a specific individual.

TARGET INDIVIDUAL: ${query}

IMPORTANT ETHICAL GUIDELINES:
- Only use publicly available information
- All findings are speculative and should be clearly marked with confidence levels
- Do not access private databases or use illegal methods
- This is for legitimate contact purposes only

SEARCH METHODOLOGY - Be thorough and creative:

1. **Direct Public Profiles**:
   - Search for X (Twitter) accounts matching the name
   - Look for LinkedIn profiles (public information only)
   - Search Instagram, Facebook, and other social media
   - Check personal websites or blogs

2. **Professional Context**:
   - Identify current and past employers/organizations
   - Find company websites and "About" or "Team" pages
   - Look for press releases, news articles, or interviews mentioning them
   - Search conference speaker pages, podcast appearances

3. **Email Discovery**:
   - Identify organizations they're affiliated with
   - Research common email formats for those organizations (firstname.lastname@, f.lastname@, etc.)
   - Check if they've published email addresses in papers, articles, or public forums
   - Look for email patterns from colleagues at same organization

4. **Phone Discovery**:
   - Check business directories
   - Look for contact pages on affiliated organizations
   - Search public records (if applicable)

5. **Alternative Contact Methods**:
   - Find contact forms on personal/company websites
   - Identify their agent, publicist, or representative if public figure
   - Look for "Contact" or "Booking" information

OUTPUT FORMAT (JSON):
{
  "results": [
    {
      "name": "Full Name",
      "title": "Current Title/Role",
      "organization": "Current Organization",
      "contacts": [
        {
          "type": "email|phone|x|instagram|facebook|linkedin|website|form|other",
          "value": "actual contact value",
          "confidence": "high|medium|low|speculative",
          "source": "where this was found or how it was derived",
          "notes": "any relevant notes"
        }
      ],
      "reasoning": "Explain your research methodology and findings",
      "additionalNotes": "Any other useful context"
    }
  ],
  "summary": "Brief summary of findings and recommended approach for contact"
}

Be creative, thorough, and persistent in your search. Think like a professional researcher.`;
}

export function getTargetSearchPrompt(query: string): string {
  return `You are an expert OSINT (Open Source Intelligence) researcher specializing in finding the right contacts to achieve specific goals. Your task is to identify the best people and methods to contact based on a target objective.

TARGET OBJECTIVE: ${query}

IMPORTANT ETHICAL GUIDELINES:
- Only use publicly available information
- All findings are speculative and should be clearly marked with confidence levels
- Do not access private databases or use illegal methods
- This is for legitimate contact purposes only

SEARCH METHODOLOGY - Think strategically:

1. **Understand the Objective**:
   - What is the user trying to achieve?
   - What type of person/department would handle this?
   - What level of authority is needed?

2. **Identify Relevant Organizations**:
   - What companies/organizations are involved?
   - What departments handle this type of request?
   - Are there regulatory bodies or third parties that could help?

3. **Find Key Decision Makers**:
   - Search for executives, managers, or specialists in relevant areas
   - Look for "Customer Service", "PR", "Executive Office" contacts
   - Find ombudsmen, customer advocates, or escalation contacts

4. **Discover Contact Methods**:
   - Direct email addresses (research email formats)
   - Executive assistant contacts
   - Social media accounts (X, LinkedIn for professional outreach)
   - Customer service channels (phone, chat, email)
   - Corporate headquarters addresses
   - Better Business Bureau or regulatory complaint channels

5. **Alternative Approaches**:
   - Executive email carpet bomb (contacting multiple executives)
   - Social media public mentions (companies monitor these)
   - Regulatory complaints (FTC, state AG, industry regulators)
   - Media/journalist contacts for escalation

OUTPUT FORMAT (JSON):
{
  "results": [
    {
      "name": "Person Name or Department",
      "title": "Title/Role",
      "organization": "Organization Name",
      "contacts": [
        {
          "type": "email|phone|x|instagram|facebook|linkedin|website|form|other",
          "value": "actual contact value",
          "confidence": "high|medium|low|speculative",
          "source": "where this was found or how it was derived",
          "notes": "any relevant notes"
        }
      ],
      "reasoning": "Why this contact is relevant to the objective",
      "additionalNotes": "Best approach for this contact"
    }
  ],
  "summary": "Strategic summary: recommended approach, order of contacts, and tips for achieving the objective"
}

Think strategically about the best path to achieve the user's goal. Provide multiple options at different escalation levels.`;
}

// API configuration for each AI source
export const AI_CONFIGS: Record<AISource, { name: string; model: string; apiKeyEnv: string }> = {
  grok: {
    name: "Grok",
    model: "grok-3-mini", // Updated to stable model name
    apiKeyEnv: "XAI_API_KEY",
  },
  chatgpt: {
    name: "ChatGPT",
    model: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
  },
  claude: {
    name: "Claude",
    model: "claude-sonnet-4-20250514",
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },
  gemini: {
    name: "Gemini",
    model: "gemini-2.0-flash",
    apiKeyEnv: "GEMINI_API_KEY",
  },
};

// Standard disclaimer
export const CONTACT_FINDER_DISCLAIMER = `IMPORTANT DISCLAIMER: All contact information provided is speculative and derived from publicly available sources. Accuracy is not guaranteed. This tool pieces together information ethically from public sources for legitimate contact purposes. Always verify information before use and respect privacy laws and regulations. Do not use for harassment, spam, or illegal purposes.`;
