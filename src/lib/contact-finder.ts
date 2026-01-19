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
  personalizationHooks?: string[];
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

WHAT MUST BE VERIFIED (from actual search results):
- LINKS: All URLs (LinkedIn, Twitter, Instagram, websites) must be REAL links found in search results
- DO NOT construct or guess social media URLs like "linkedin.com/in/firstname-lastname"
- If you find a real LinkedIn profile in search results, include that exact URL
- If you cannot find their social profiles, do NOT include fake/guessed URLs

WHAT YOU CAN SPECULATE (with clear reasoning):
- EMAIL ADDRESSES: If you verify the person exists and find their company domain, you CAN speculate their email
- Use evidence when available (e.g., "Found colleague john.doe@company.com, so likely uses firstname.lastname format")
- Mark speculated emails with appropriate confidence level
- This is acceptable because we're applying a logical format to a VERIFIED person

SEARCH METHODOLOGY - Be thorough and creative:

1. **VERIFY COMPANY/ORGANIZATION WEBSITE (REQUIRED)**:
   - First, search to find and VERIFY the person's organization website
   - This establishes the correct domain for email discovery
   - Include a verified website link in your results

2. **EMAIL FORMAT DISCOVERY (EVIDENCE-BASED)**:
   - Search: "email @[domain]" (e.g., "email @omahaproductions.com")
   - Search: "[company name] email format" or "[person name] email"
   - Check Hunter.io, ContactOut, RocketReach, Snov.io results in search snippets
   - Look for ANY real email from this domain to reverse-engineer the pattern
   - Check press releases, news articles, conference materials for published emails
   - CRITICAL: DO NOT just guess "firstname.lastname@domain.com" without evidence
   - If you find a real email (e.g., john.smith@company.com), cite it as evidence for the format
   - If no evidence found, mark your email guess as "speculative" with "low" confidence
   - Common formats to look for:
     * firstname.lastname@domain.com
     * firstname@domain.com
     * f.lastname@domain.com
     * first.last@domain.com

3. **Direct Public Profiles**:
   - Search for X (Twitter) accounts matching the name
   - Look for LinkedIn profiles (public information only)
   - Search Instagram, Facebook, and other social media
   - Check personal websites or blogs

4. **Professional Context**:
   - Identify current and past employers/organizations
   - Find company websites and "About" or "Team" pages
   - Look for press releases, news articles, or interviews mentioning them
   - Search conference speaker pages, podcast appearances

5. **Phone Discovery**:
   - Check business directories
   - Look for contact pages on affiliated organizations
   - Search public records (if applicable)

6. **Alternative Contact Methods**:
   - Find contact forms on personal/company websites
   - Identify their agent, publicist, or representative if public figure
   - Look for "Contact" or "Booking" information

7. **PERSONALIZATION RESEARCH (REQUIRED)**:
   - Find 2-3 interesting facts or recent work for each contact person
   - Look for: recent interviews, podcast appearances, published articles, awards, speaking engagements
   - Check their social media for recent posts about projects or achievements
   - Find quotes or opinions they've shared publicly
   - These should be useful for personalizing an introductory email opener
   - Keep them short, factual, and interesting - not formatted as email text

OUTPUT FORMAT (JSON):
{
  "results": [
    {
      "name": "Full Name",
      "title": "Current Title/Role",
      "organization": "Current Organization",
      "contacts": [
        {
          "type": "website",
          "value": "https://verified-company-domain.com",
          "confidence": "high",
          "source": "Verified via Google Search",
          "notes": "Official company website - verified domain for email format"
        },
        {
          "type": "email",
          "value": "firstname.lastname@domain.com",
          "confidence": "high|medium|low|speculative",
          "source": "Format derived from [specific evidence] OR Speculative - no direct evidence found",
          "notes": "Evidence: Found example@domain.com in [source], using [format] pattern"
        }
      ],
      "personalizationHooks": [
        "Recently appeared on [Podcast Name] discussing [topic]",
        "Published article in [Publication] about [topic] in [month/year]",
        "Known for [specific achievement or viewpoint]"
      ],
      "reasoning": "Research methodology - cite evidence for email format if found",
      "additionalNotes": "1) Verified domain: [domain], 2) Email format evidence: [what you found or 'none - speculative']"
    }
  ],
  "summary": "1) Verified domain: [domain], 2) Email format: [pattern] with [confidence] based on [evidence], 3) Best contact approach"
}

CRITICAL REQUIREMENTS:

MUST BE REAL (verified from search):
1. LINKS: All URLs (LinkedIn, Twitter, website) must be REAL links found in search - DO NOT construct URLs
2. Include a verified website/organization link with the correct domain
3. Personalization hooks must be real facts from search results

OK TO SPECULATE (with reasoning):
4. EMAIL ADDRESSES: You CAN speculate the email if you verify the person and domain exist
5. Cite any evidence for email format, or explain your reasoning if speculating
6. Mark confidence: "high" if email found directly, "medium" if format evidence exists, "speculative" if guessing pattern

The goal is: REAL person + REAL domain + LOGICAL email format speculation = useful contact`;
}

export function getTargetSearchPrompt(query: string): string {
  return `You are an expert OSINT (Open Source Intelligence) researcher specializing in finding the right contacts to achieve specific goals. Your task is to identify the best people and methods to contact based on a target objective.

TARGET OBJECTIVE: ${query}

IMPORTANT ETHICAL GUIDELINES:
- Only use publicly available information
- All findings are speculative and should be clearly marked with confidence levels
- Do not access private databases or use illegal methods
- This is for legitimate contact purposes only

WHAT MUST BE VERIFIED (from actual search results):
- PEOPLE: Only include people whose names you ACTUALLY found in search results (news articles, company pages, IMDb, LinkedIn search results, etc.)
- LINKS: All URLs (LinkedIn, Twitter, websites) must be REAL links found in search results - DO NOT construct or guess URLs
- DO NOT fabricate fictional employees like "Jane Smith" or "John Doe"

WHAT YOU CAN SPECULATE (with clear reasoning):
- EMAIL ADDRESSES: Once you find a REAL person and a verified domain, you CAN speculate their email using logical format patterns
- Example: If you find "Michael Jordan works at Nike" (verified) and nike.com is the domain (verified), you can speculate michael.jordan@nike.com
- Always mark speculated emails with appropriate confidence and explain your reasoning
- This is acceptable because the PERSON is real - only the email format is speculated

IMPORTANT - ALWAYS RETURN SOMETHING USEFUL:
- ALWAYS search for and return the verified company website - this is valuable even without contacts
- ALWAYS attempt email format discovery for the domain
- If you find the website but no people, still return the website with email format notes
- Only say "No verified contacts found" for the PEOPLE section - the website and email format are still useful

SEARCH METHODOLOGY - Think strategically:

1. **VERIFY COMPANY WEBSITE FIRST (REQUIRED)**:
   - Search to find and VERIFY the company's official website URL
   - Include this as the FIRST result with type "website" and confidence "high"
   - This establishes the correct domain for email format discovery
   - Do NOT guess the domain - actually search and verify it

2. **EMAIL FORMAT DISCOVERY (EVIDENCE-BASED)**:
   - Once you have the verified domain, search for actual email evidence
   - Search: "email @[verified-domain]" (e.g., "email @walmart.com")
   - Search: "[company name] email format" or "[company name] contact email"
   - Check Hunter.io, RocketReach, ContactOut results in search snippets
   - Look for ANY real email from this domain in search results to reverse-engineer the pattern
   - DO NOT just guess "firstname.lastname@domain.com" without evidence
   - If you find evidence of format, cite it. If guessing, mark as "speculative" with low confidence
   - Common formats to look for:
     * firstname.lastname@domain.com
     * firstname@domain.com
     * f.lastname@domain.com
     * first.last@domain.com

3. **Understand the Objective**:
   - What is the user trying to achieve?
   - What type of person/department would handle this?
   - What level of authority is needed?

4. **Find Key Decision Makers**:
   - Search for executives, managers, or specialists in relevant areas
   - Look for "Customer Service", "PR", "Executive Office" contacts
   - Find ombudsmen, customer advocates, or escalation contacts
   - Apply the discovered email format (with appropriate confidence based on evidence)

5. **Discover Contact Methods**:
   - Direct email addresses (using discovered format with proper confidence levels)
   - Executive assistant contacts
   - Social media accounts (X, LinkedIn for professional outreach)
   - Customer service channels (phone, chat, email)
   - Corporate headquarters addresses

6. **PERSONALIZATION RESEARCH (REQUIRED)**:
   - For each key person identified, find 2-3 interesting facts or recent work
   - Look for: recent interviews, podcast appearances, published articles, promotions
   - These should be useful for personalizing an introductory email opener

OUTPUT FORMAT (JSON):
{
  "results": [
    {
      "name": "[Company Name] - Official Website",
      "title": "Verified Company Domain",
      "organization": "[Company Name]",
      "contacts": [
        {
          "type": "website",
          "value": "https://[verified-domain.com]",
          "confidence": "high",
          "source": "Verified via Google Search",
          "notes": "Official company website - use this domain for email format"
        }
      ],
      "personalizationHooks": [],
      "reasoning": "Verified company website establishes the correct domain for email outreach",
      "additionalNotes": "Email format evidence found: [describe what you found or 'No direct evidence - formats below are speculative']"
    },
    {
      "name": "REAL Person Name (found in search)",
      "title": "Title/Role",
      "organization": "Organization Name",
      "contacts": [
        {
          "type": "email",
          "value": "derived-email@domain.com",
          "confidence": "high|medium|low|speculative",
          "source": "Format derived from [specific evidence] OR Speculative based on common patterns",
          "notes": "Evidence: Found john.smith@domain.com in [source], so using firstname.lastname format"
        }
      ],
      "personalizationHooks": [
        "REAL fact found in search results - cite source",
        "Another REAL fact from actual search result"
      ],
      "reasoning": "WHERE THIS PERSON WAS FOUND: [cite the actual search result - news article, company page, LinkedIn, IMDb, etc.] AND why they are relevant",
      "additionalNotes": "Best approach for this contact"
    }
  ],
  "summary": "1) Verified domain: [domain.com], 2) Email format: [pattern with confidence], 3) Evidence: [what you found], 4) REAL contacts found: [list names with sources] OR 'No verified contacts found in search results'"
}

CRITICAL REQUIREMENTS:

ALWAYS RETURN (even if no people found):
1. VERIFIED COMPANY WEBSITE: Always search for and return the official website - this is valuable on its own
2. EMAIL FORMAT DISCOVERY: Always attempt to find email format evidence for the domain

MUST BE REAL (verified from search):
3. PEOPLE: Only real people found in search results - cite WHERE you found them (IMDb, company page, news article, etc.)
4. LINKS: All URLs must be real - DO NOT construct LinkedIn URLs like "linkedin.com/in/firstname-lastname"
5. PERSONALIZATION HOOKS: Must be real facts from search results, not invented

OK TO SPECULATE (for real people):
6. EMAIL ADDRESSES: You CAN speculate emails for VERIFIED people using logical format patterns
7. Explain your email reasoning (e.g., "Company appears to use firstname.lastname@ based on [evidence or common patterns]")
8. Mark confidence appropriately - "speculative" if no format evidence, "medium" if pattern observed

The "reasoning" field MUST state:
- WHERE this person was found (e.g., "Found on IMDb credits for The Last Dance", "Listed on company About page")
- WHY you chose this email format (e.g., "Speculated using common firstname.lastname pattern" or "Based on colleague email found in press release")

IF NO PEOPLE FOUND: Still return the verified website and email format discovery. Say "No verified contacts found in search results" in the summary, but the website and email format info are still useful output.`;
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
