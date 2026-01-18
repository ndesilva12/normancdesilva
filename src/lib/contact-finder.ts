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

1. **EMAIL FORMAT DISCOVERY (HIGHEST PRIORITY)**:
   - First, identify the target's organization/company domain (e.g., omahaproductions.com)
   - Search for "email @domain.com" (e.g., "email @omahaproductions.com") to find leaked/published emails
   - Check Hunter.io, ContactOut, RocketReach, Snov.io results which often show email formats
   - Determine the most likely email format used by the organization:
     * firstname.lastname@domain.com
     * firstname@domain.com
     * f.lastname@domain.com
     * firstnamelastname@domain.com
     * first.last@domain.com
   - Look for ANY email from the same domain to reverse-engineer the format
   - Search for the person's name + "email" + company name
   - Check press releases, news articles, and conference materials for published emails
   - ALWAYS provide your best guess at their email with confidence level and reasoning

2. **Direct Public Profiles**:
   - Search for X (Twitter) accounts matching the name
   - Look for LinkedIn profiles (public information only)
   - Search Instagram, Facebook, and other social media
   - Check personal websites or blogs

3. **Professional Context**:
   - Identify current and past employers/organizations
   - Find company websites and "About" or "Team" pages
   - Look for press releases, news articles, or interviews mentioning them
   - Search conference speaker pages, podcast appearances

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
          "notes": "any relevant notes (for emails, explain the format pattern discovered)"
        }
      ],
      "reasoning": "Explain your research methodology - especially how you determined the email format",
      "additionalNotes": "Include: 1) Company domain, 2) Email format pattern discovered, 3) How you determined it"
    }
  ],
  "summary": "Brief summary including the most likely email format and how to verify it"
}

CRITICAL: Always include at least one email guess with your reasoning. Even a speculative email based on common patterns is valuable. Explain how you determined the format.`;
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

1. **EMAIL FORMAT DISCOVERY (HIGHEST PRIORITY)**:
   - Identify the target organization's domain (e.g., walmart.com, amazon.com)
   - Search for "email @domain.com" to find the company's email format
   - Check Hunter.io, ContactOut, RocketReach, Snov.io for email patterns
   - Determine the format used:
     * firstname.lastname@domain.com
     * firstname@domain.com
     * f.lastname@domain.com
     * firstnamelastname@domain.com
   - Find ANY email from the company to reverse-engineer the pattern
   - For executives: search their name + "email" + company
   - ALWAYS provide email guesses for key contacts with confidence levels

2. **Understand the Objective**:
   - What is the user trying to achieve?
   - What type of person/department would handle this?
   - What level of authority is needed?

3. **Identify Relevant Organizations**:
   - What companies/organizations are involved?
   - What departments handle this type of request?
   - Are there regulatory bodies or third parties that could help?

4. **Find Key Decision Makers**:
   - Search for executives, managers, or specialists in relevant areas
   - Look for "Customer Service", "PR", "Executive Office" contacts
   - Find ombudsmen, customer advocates, or escalation contacts
   - For each person found, attempt to derive their email using the discovered format

5. **Discover Contact Methods**:
   - Direct email addresses (apply the discovered email format)
   - Executive assistant contacts
   - Social media accounts (X, LinkedIn for professional outreach)
   - Customer service channels (phone, chat, email)
   - Corporate headquarters addresses
   - Better Business Bureau or regulatory complaint channels

6. **Alternative Approaches**:
   - Executive email carpet bomb (contacting multiple executives using the email format)
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
          "notes": "for emails: explain the format pattern (e.g., 'Company uses firstname.lastname@ format')"
        }
      ],
      "reasoning": "Why this contact is relevant AND how you determined their email format",
      "additionalNotes": "Include: 1) Company email format pattern, 2) How to verify, 3) Best approach"
    }
  ],
  "summary": "Strategic summary including: 1) The company's email format, 2) Recommended contacts in priority order, 3) Tips for achieving the objective"
}

CRITICAL: For every person identified, attempt to provide their email by applying the discovered email format. Even speculative emails are valuable - just mark confidence appropriately and explain your reasoning.`;
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
