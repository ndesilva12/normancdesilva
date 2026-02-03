#!/usr/bin/env python3
"""
Last 30 Days Research Tool
Searches web, Reddit, and X for recent content on a topic and synthesizes findings
"""

import argparse
import json
import os
import sys
import subprocess
import re
from typing import List, Dict, Any
from urllib.parse import urlparse

# Brave Search API key from environment
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY", "BSAN41sbCIBbhckWBTYmYAk_44Kug7g")

def search_brave(query: str, count: int = 5, freshness: str = "pm") -> List[Dict[str, Any]]:
    """Search web using Brave Search API with freshness filter"""
    try:
        import requests
    except ImportError:
        print("requests library not found - install with: pip install requests", file=sys.stderr)
        return []
    
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": BRAVE_API_KEY,
    }
    params = {
        "q": query,
        "count": count,
        "freshness": freshness,  # pm = past month, pw = past week
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get("web", {}).get("results", [])[:count]:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "description": item.get("description", ""),
                "platform": "Web",
            })
        return results
    except requests.exceptions.HTTPError as e:
        if "429" in str(e):
            print(f"Brave API rate limit hit - results may be limited", file=sys.stderr)
        else:
            print(f"Brave search error: {e}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Brave search error: {e}", file=sys.stderr)
        return []

def search_reddit(query: str, count: int = 5) -> List[Dict[str, Any]]:
    """Search Reddit using Brave Search with site: filter"""
    reddit_query = f"site:reddit.com {query}"
    results = search_brave(reddit_query, count=count, freshness="pm")
    
    # Mark as Reddit and extract subreddit
    for result in results:
        result["platform"] = "Reddit"
        # Try to extract subreddit from URL
        match = re.search(r'reddit\.com/r/([^/]+)', result["url"])
        if match:
            result["subreddit"] = match.group(1)
    
    return results

def search_x(query: str, count: int = 10) -> List[Dict[str, Any]]:
    """Search X/Twitter using bird CLI"""
    try:
        # Run bird search command
        cmd = ["bird", "search", query, "-n", str(count), "--plain"]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        
        if result.returncode != 0:
            print(f"Bird CLI error: {result.stderr}", file=sys.stderr)
            return []
        
        # Parse bird output (plain text format)
        tweets = []
        lines = result.stdout.strip().split("\n")
        
        current_tweet = {}
        for line in lines:
            line = line.strip()
            if not line:
                if current_tweet:
                    tweets.append(current_tweet)
                    current_tweet = {}
                continue
            
            # Parse bird plain output format
            if line.startswith("@"):
                current_tweet["author"] = line.split()[0]
            elif "http" in line:
                # Extract URL
                urls = re.findall(r'https?://\S+', line)
                if urls:
                    current_tweet["url"] = urls[0]
            else:
                # Tweet text
                if "text" not in current_tweet:
                    current_tweet["text"] = line
                else:
                    current_tweet["text"] += " " + line
        
        if current_tweet:
            tweets.append(current_tweet)
        
        # Format results
        results = []
        for tweet in tweets[:count]:
            results.append({
                "title": f"{tweet.get('author', 'Unknown')}: {tweet.get('text', '')[:100]}...",
                "url": tweet.get("url", "https://twitter.com"),
                "description": tweet.get("text", ""),
                "platform": "X",
            })
        
        return results
    
    except FileNotFoundError:
        print("Bird CLI not found - skipping X search", file=sys.stderr)
        return []
    except Exception as e:
        print(f"X search error: {e}", file=sys.stderr)
        return []

def extract_insights(all_results: List[Dict], query: str) -> Dict[str, Any]:
    """Extract patterns, mistakes, and techniques from search results"""
    
    patterns = []
    mistakes = []
    techniques = []
    
    # Keywords that indicate patterns/what works
    pattern_keywords = ["works", "best", "recommend", "success", "effective", "tip", "trick", "hack"]
    mistake_keywords = ["avoid", "don't", "mistake", "wrong", "fail", "problem", "issue", "error"]
    technique_keywords = ["how to", "method", "technique", "approach", "strategy", "way to"]
    
    for result in all_results:
        text = (result.get("title", "") + " " + result.get("description", "")).lower()
        
        # Extract patterns (what's working)
        for keyword in pattern_keywords:
            if keyword in text:
                # Create insight from title/description
                insight = result.get("description") or result.get("title")
                if insight and len(insight) > 20:
                    patterns.append(insight[:200])
                    break
        
        # Extract mistakes (what to avoid)
        for keyword in mistake_keywords:
            if keyword in text:
                insight = result.get("description") or result.get("title")
                if insight and len(insight) > 20:
                    mistakes.append(insight[:200])
                    break
        
        # Extract techniques (how-to)
        for keyword in technique_keywords:
            if keyword in text:
                techniques.append({
                    "technique": (result.get("description") or result.get("title"))[:200],
                    "source": result.get("platform", "Web"),
                    "url": result.get("url", "#"),
                })
                break
    
    # Remove duplicates and limit
    patterns = list(dict.fromkeys(patterns))[:5]
    mistakes = list(dict.fromkeys(mistakes))[:4]
    techniques = techniques[:5]
    
    # If we didn't find enough insights, add generic ones based on results
    if len(patterns) < 3:
        patterns.append(f"Recent discussions show active interest in {query} across multiple platforms")
        patterns.append(f"Community engagement indicates {query} is a relevant topic with ongoing developments")
    
    if len(mistakes) < 2:
        mistakes.append(f"Ensure you're following best practices specific to {query}")
        mistakes.append(f"Stay updated with latest developments in {query} as the field evolves quickly")
    
    if len(techniques) < 2:
        # Use top results as technique sources
        for result in all_results[:3]:
            if len(techniques) >= 5:
                break
            techniques.append({
                "technique": result.get("description") or result.get("title", "")[:200],
                "source": result.get("platform", "Web"),
                "url": result.get("url", "#"),
            })
    
    return {
        "patterns": patterns,
        "mistakes": mistakes,
        "techniques": techniques,
    }

def generate_prompt(query: str, insights: Dict) -> str:
    """Generate a ready-to-use prompt based on research findings"""
    
    patterns_text = "\n".join(f"- {p}" for p in insights.get("patterns", [])[:3])
    
    prompt = f"""You are an expert in {query} with deep practical knowledge.

Based on recent research and community insights, here are key considerations:

What's Working:
{patterns_text}

Task: [Describe your specific goal related to {query}]

Please provide:
1. A detailed analysis of the current landscape
2. Specific, actionable recommendations
3. Potential pitfalls to avoid
4. Next steps for implementation

Output format: Clear, structured response with examples where applicable."""
    
    return prompt

def main():
    parser = argparse.ArgumentParser(description="Last 30 Days Research Tool")
    parser.add_argument("--query", type=str, required=True, help="Research query")
    parser.add_argument("--output", type=str, default="json", choices=["json"], help="Output format")
    
    args = parser.parse_args()
    
    print(f"🔍 Researching: {args.query}", file=sys.stderr)
    
    # Gather data from all sources
    print("📰 Searching web...", file=sys.stderr)
    web_results = search_brave(args.query, count=5)
    
    print("💬 Searching Reddit...", file=sys.stderr)
    reddit_results = search_reddit(args.query, count=5)
    
    print("🐦 Searching X...", file=sys.stderr)
    x_results = search_x(args.query, count=5)
    
    # Combine all results
    all_results = web_results + reddit_results + x_results
    print(f"✅ Found {len(all_results)} total results", file=sys.stderr)
    
    # Extract insights
    insights = extract_insights(all_results, args.query)
    
    # Generate prompt
    prompt = generate_prompt(args.query, insights)
    
    # Build sources list
    sources = []
    seen_urls = set()
    for result in all_results[:10]:
        url = result.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            sources.append({
                "url": url,
                "description": result.get("title", "")[:150],
                "platform": result.get("platform", "Web"),
            })
    
    # Output final result
    output = {
        "patterns": insights["patterns"],
        "mistakes": insights["mistakes"],
        "techniques": insights["techniques"],
        "sources": sources,
        "prompt": prompt,
    }
    
    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
