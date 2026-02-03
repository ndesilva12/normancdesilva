#!/usr/bin/env python3
"""
Curate v3 - Content Curation Engine
Searches X, Reddit, and Web for fascinating content tailored to Norman's worldview.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

# Add script directory to path for local imports
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

# Load environment variables from .env if available (or use process.env)
from dotenv import load_dotenv
env_path = SCRIPT_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Import libraries from curatelib package
from curatelib import xai_x, openai_reddit, reddit_enrich, http


class ContentItem:
    """Normalized content item from any source."""
    
    def __init__(
        self,
        title: str,
        url: str,
        source_type: str,  # "x", "reddit", "youtube", "article", "podcast", etc.
        source_name: str,  # domain, username, channel, subreddit
        summary: str,
        estimated_minutes: int,
        date: Optional[str] = None,
        engagement: Optional[Dict] = None,
        relevance: float = 0.0
    ):
        self.title = title
        self.url = url
        self.source_type = source_type
        self.source_name = source_name
        self.summary = summary
        self.estimated_minutes = estimated_minutes
        self.date = date
        self.engagement = engagement or {}
        self.relevance = relevance
        
    @property
    def is_short(self) -> bool:
        """Is this short-form content (<20 min)?"""
        return self.estimated_minutes < 20
    
    @property
    def is_trending(self) -> bool:
        """
        Does this have high engagement indicating trending/viral status?
        
        Trending = news, current events, viral content with mainstream attention.
        Unique = niche perspectives that mainstream ignores.
        """
        # Check recency - trending should be recent (last 7 days preferred)
        is_recent = True
        if self.date:
            try:
                from datetime import datetime, timedelta
                item_date = datetime.strptime(self.date, "%Y-%m-%d")
                cutoff = datetime.now() - timedelta(days=7)
                is_recent = item_date >= cutoff
            except:
                pass
        
        # Trending needs both recency AND high engagement
        if self.source_type == "x":
            likes = self.engagement.get("likes", 0) or 0
            reposts = self.engagement.get("reposts", 0) or 0
            replies = self.engagement.get("replies", 0) or 0
            # High bar: needs significant viral spread
            weighted_engagement = likes + (reposts * 5) + (replies * 2)
            return is_recent and weighted_engagement > 2000
        
        elif self.source_type == "reddit":
            upvotes = self.engagement.get("upvotes", 0) or 0
            comments = self.engagement.get("comments", 0) or 0
            # Hot threads get lots of discussion
            return is_recent and (upvotes > 1000 or comments > 100)
        
        elif self.source_type == "youtube":
            views = self.engagement.get("views", 0) or 0
            # Videos need significant views to be "trending"
            return views > 100000
        
        elif self.source_type == "article":
            # Articles from mainstream news sources = trending
            # Niche sources = unique
            mainstream_domains = [
                "cnn.com", "foxnews.com", "nytimes.com", "wsj.com",
                "cnbc.com", "bloomberg.com", "reuters.com", "apnews.com"
            ]
            return any(domain in self.source_name for domain in mainstream_domains)
        
        return False
    
    @property
    def category(self) -> str:
        """Determine category: short-unique, short-trending, long-unique, long-trending."""
        if self.is_short:
            return "short-trending" if self.is_trending else "short-unique"
        else:
            return "long-trending" if self.is_trending else "long-unique"
    
    @property
    def source_key(self) -> str:
        """Unique source identifier for deduplication."""
        return f"{self.source_type}:{self.source_name}"
    
    def to_dict(self) -> Dict:
        """Export to dictionary."""
        return {
            "title": self.title,
            "url": self.url,
            "source_type": self.source_type,
            "source_name": self.source_name,
            "summary": self.summary,
            "estimated_minutes": self.estimated_minutes,
            "date": self.date,
            "engagement": self.engagement,
            "relevance": self.relevance,
            "category": self.category
        }


class CurateEngine:
    """Main curation engine."""
    
    def __init__(self):
        self.xai_key = os.getenv("XAI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.brave_key = os.getenv("BRAVE_API_KEY")
        
        # Load Notion API key
        notion_key_path = Path.home() / ".config/notion/api_key"
        if notion_key_path.exists():
            self.notion_key = notion_key_path.read_text().strip()
        else:
            self.notion_key = None
        
        # Check available APIs
        self.has_x = bool(self.xai_key)
        self.has_reddit = bool(self.openai_key)
        self.has_web = bool(self.brave_key)
        self.has_notion = bool(self.notion_key)
        
        if not any([self.has_x, self.has_reddit, self.has_web]):
            print("⚠️  Warning: No API keys configured. Limited functionality.", file=sys.stderr)
    
    def search_x_posts(self, query: str, max_results: int = 30) -> List[ContentItem]:
        """Search X for posts about query."""
        if not self.has_x:
            return []
        
        try:
            # Calculate date range (last 30 days, prefer last 7)
            to_date = datetime.now()
            from_date = to_date - timedelta(days=30)
            
            raw_response = xai_x.search_x(
                api_key=self.xai_key,
                model="grok-4-1-fast",  # Required for x_search tool
                topic=query,
                from_date=from_date.strftime("%Y-%m-%d"),
                to_date=to_date.strftime("%Y-%m-%d"),
                depth="default"  # 20-30 posts
            )
            
            # Parse the response to extract items
            posts = xai_x.parse_x_response(raw_response)
            
            items = []
            for post in posts:
                items.append(ContentItem(
                    title=post.get("text", "")[:200],  # Truncate for title
                    url=post.get("url", ""),
                    source_type="x",
                    source_name=post.get("author_handle", "unknown"),
                    summary=post.get("why_relevant", ""),
                    estimated_minutes=2,  # X posts are quick reads
                    date=post.get("date"),
                    engagement=post.get("engagement", {}),
                    relevance=post.get("relevance", 0.0)
                ))
            
            return items
        
        except Exception as e:
            print(f"❌ X search error: {e}", file=sys.stderr)
            return []
    
    def search_reddit_posts(self, query: str, max_results: int = 30) -> List[ContentItem]:
        """Search Reddit for threads about query."""
        if not self.has_reddit:
            return []
        
        try:
            # Calculate date range
            to_date = datetime.now()
            from_date = to_date - timedelta(days=30)
            
            raw_response = openai_reddit.search_reddit(
                api_key=self.openai_key,
                model="gpt-4o",
                topic=query,
                from_date=from_date.strftime("%Y-%m-%d"),
                to_date=to_date.strftime("%Y-%m-%d"),
                depth="default"
            )
            
            # Parse the response to extract items
            threads = openai_reddit.parse_reddit_response(raw_response)
            
            items = []
            for thread in threads:
                # Enrich with Reddit API data
                enriched = reddit_enrich.enrich_reddit_item(thread)
                
                # Estimate read time based on comments
                num_comments = enriched.get("engagement", {}).get("comments", 0)
                estimated_min = min(15, max(3, num_comments // 10))  # 3-15 min
                
                items.append(ContentItem(
                    title=enriched.get("title", ""),
                    url=enriched.get("url", ""),
                    source_type="reddit",
                    source_name=enriched.get("subreddit", "unknown"),
                    summary=enriched.get("why_relevant", ""),
                    estimated_minutes=estimated_min,
                    date=enriched.get("date"),
                    engagement=enriched.get("engagement", {}),
                    relevance=enriched.get("relevance", 0.0)
                ))
            
            return items
        
        except Exception as e:
            print(f"❌ Reddit search error: {e}", file=sys.stderr)
            return []
    
    def search_web(self, query: str, site: Optional[str] = None, max_results: int = 20) -> List[ContentItem]:
        """Search web using Brave API."""
        if not self.has_web:
            return []
        
        try:
            from urllib.parse import urlencode
            
            # Build query with site restriction if specified
            search_query = f"site:{site} {query}" if site else query
            
            # Use Brave Search API
            params = {
                "q": search_query,
                "count": max_results,
                "freshness": "pm"  # Past month
            }
            url = f"https://api.search.brave.com/res/v1/web/search?{urlencode(params)}"
            
            headers = {
                "Accept": "application/json",
                "X-Subscription-Token": self.brave_key
            }
            
            data = http.get(url, headers=headers)
            
            items = []
            for result in data.get("web", {}).get("results", []):
                url_parsed = urlparse(result.get("url", ""))
                domain = url_parsed.netloc
                
                # Determine source type from domain
                source_type = self._classify_source_type(domain)
                
                # Estimate reading time from description length
                description = result.get("description", "")
                estimated_min = max(3, len(description.split()) // 200)  # ~200 wpm
                
                items.append(ContentItem(
                    title=result.get("title", ""),
                    url=result.get("url", ""),
                    source_type=source_type,
                    source_name=domain,
                    summary=description[:150],  # Truncate
                    estimated_minutes=estimated_min,
                    date=None,  # Brave doesn't always provide dates
                    engagement={},
                    relevance=0.7  # Default relevance for web results
                ))
            
            return items
        
        except Exception as e:
            print(f"❌ Web search error: {e}", file=sys.stderr)
            return []
    
    def _classify_source_type(self, domain: str) -> str:
        """Classify source type from domain."""
        if "youtube.com" in domain or "youtu.be" in domain:
            return "youtube"
        elif "rumble.com" in domain:
            return "rumble"
        elif "spotify.com" in domain:
            return "podcast"
        elif "substack.com" in domain:
            return "substack"
        else:
            return "article"
    
    def verify_link(self, url: str) -> bool:
        """Verify that a link is real and goes to specific content."""
        try:
            # Basic checks
            if not url or url == "":
                return False
            
            # Check for search pages, homepages, etc.
            bad_patterns = [
                "/results?",
                "/search?",
                "youtube.com/@",  # Channel page
                "youtube.com/c/",  # Channel page
                "youtube.com/user/",  # Channel page
                "spotify.com/show/",  # Podcast homepage (not episode)
                "twitter.com/user$",  # Profile page (not specific post)
            ]
            
            for pattern in bad_patterns:
                if pattern in url:
                    return False
            
            # YouTube videos must have watch?v= or /shorts/
            if "youtube.com" in url:
                if not ("watch?v=" in url or "/shorts/" in url):
                    return False
            
            # Spotify must have /episode/ for podcast episodes
            if "spotify.com" in url:
                if "/episode/" not in url:
                    return False
            
            # X posts must have /status/
            if "twitter.com" in url or "x.com" in url:
                if "/status/" not in url:
                    return False
            
            # Reddit must have /comments/
            if "reddit.com" in url:
                if "/comments/" not in url:
                    return False
            
            return True
        
        except Exception:
            return False
    
    def deduplicate_sources(self, items: List[ContentItem]) -> List[ContentItem]:
        """
        Remove duplicate sources within a single output batch.
        
        Rules:
        - No two articles from same domain (e.g., two Zero Hedge articles)
        - No two X posts from same user
        - No two YouTube videos from same channel
        - No two Reddit posts from same subreddit
        
        Keeps highest relevance item when duplicates found.
        """
        seen_sources = {}
        
        for item in items:
            key = item.source_key  # e.g., "x:username", "article:zerohedge.com", "youtube:channel"
            if key not in seen_sources or item.relevance > seen_sources[key].relevance:
                seen_sources[key] = item
        
        return list(seen_sources.values())
    
    def curate(
        self,
        topic: Optional[str] = None,
        source: Optional[str] = None,
        count: int = 12
    ) -> Dict[str, List[ContentItem]]:
        """
        Main curation function.
        
        Args:
            topic: Specific topic to curate, or None for general
            source: Specific source type (e.g., "x", "reddit", "youtube"), or None for mixed
            count: Total number of items to curate (default 12)
        
        Returns:
            Dictionary with categories as keys, lists of ContentItems as values
        """
        all_items = []
        
        # Determine search strategy based on mode
        is_general = (topic is None)
        is_source_restricted = (source is not None)
        
        if is_general and not is_source_restricted:
            # Mode 4: General + Mixed Sources (Maximum Chaos)
            # TODO: Implement topic discovery from feeds/trends
            print("🎲 Mode 4: General curation with mixed sources (chaotic)", file=sys.stderr)
            # For now, use a diverse set of topics
            topics = [
                "Austrian economics",
                "Federal Reserve policy",
                "Jeffrey Epstein",
                "NBA analytics",
                "intelligence agencies",
                "Woodrow Wilson"
            ]
            for t in topics[:count//2]:  # Search half the topics
                all_items.extend(self.search_x_posts(t, max_results=2))
                all_items.extend(self.search_reddit_posts(t, max_results=2))
                all_items.extend(self.search_web(t, max_results=2))
        
        elif is_general and is_source_restricted:
            # Mode 3: General + Specific Source
            print(f"🎯 Mode 3: General curation from {source}", file=sys.stderr)
            # TODO: Implement topic discovery
            topics = ["Austrian economics", "NBA history", "Federal Reserve", "Epstein"]
            if source.lower() in ["x", "twitter", "x posts"]:
                for t in topics:
                    all_items.extend(self.search_x_posts(t, max_results=3))
            elif source.lower() == "reddit":
                for t in topics:
                    all_items.extend(self.search_reddit_posts(t, max_results=3))
            elif source.lower() == "youtube":
                for t in topics:
                    all_items.extend(self.search_web(t, site="youtube.com", max_results=3))
        
        elif not is_general and is_source_restricted:
            # Mode 1: Topic + Specific Source
            print(f"📌 Mode 1: {topic} from {source}", file=sys.stderr)
            if source.lower() in ["x", "twitter", "x posts"]:
                all_items.extend(self.search_x_posts(topic, max_results=count * 2))
            elif source.lower() == "reddit":
                all_items.extend(self.search_reddit_posts(topic, max_results=count * 2))
            elif source.lower() == "youtube":
                all_items.extend(self.search_web(topic, site="youtube.com", max_results=count * 2))
            elif source.lower() == "rumble":
                all_items.extend(self.search_web(topic, site="rumble.com", max_results=count * 2))
            elif source.lower() == "spotify":
                all_items.extend(self.search_web(topic, site="spotify.com", max_results=count * 2))
        
        else:
            # Mode 2: Topic + Mixed Sources
            print(f"🔍 Mode 2: {topic} with mixed sources", file=sys.stderr)
            all_items.extend(self.search_x_posts(topic, max_results=10))
            all_items.extend(self.search_reddit_posts(topic, max_results=10))
            all_items.extend(self.search_web(topic, max_results=10))
        
        # Filter out bad links
        all_items = [item for item in all_items if self.verify_link(item.url)]
        
        # Deduplicate sources
        all_items = self.deduplicate_sources(all_items)
        
        # Sort by relevance
        all_items.sort(key=lambda x: x.relevance, reverse=True)
        
        # Categorize into 4 buckets
        categorized = {
            "short-unique": [],
            "short-trending": [],
            "long-unique": [],
            "long-trending": []
        }
        
        for item in all_items:
            category = item.category
            if len(categorized[category]) < count // 4:  # 3 items per category for 12 total
                categorized[category].append(item)
        
        # If we don't have enough in each category, fill from others
        total_needed = count
        total_current = sum(len(items) for items in categorized.values())
        
        if total_current < total_needed:
            # Add remaining items to any category that has space
            remaining = [item for item in all_items 
                        if not any(item in cat for cat in categorized.values())]
            for item in remaining:
                if total_current >= total_needed:
                    break
                for category in categorized:
                    if len(categorized[category]) < count // 4 + 1:
                        categorized[category].append(item)
                        total_current += 1
                        break
        
        return categorized
    
    def publish_to_notion(self, categorized: Dict[str, List[ContentItem]], topic: str = "General") -> Optional[str]:
        """Publish curation results to Notion database."""
        if not self.has_notion:
            print("⚠️  Warning: Notion API key not configured. Skipping Notion publishing.", file=sys.stderr)
            return None
        
        try:
            import requests
            
            DATABASE_ID = "bdd010a5df3e4d208588e8d22c65ba9a"
            
            headers = {
                "Authorization": f"Bearer {self.notion_key}",
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            }
            
            timestamp = datetime.now().strftime("%Y-%m-%d %I:%M %p EST")
            page_title = f"Curation: {topic} - {timestamp}"
            
            # Build page content blocks
            content_blocks = []
            
            # Header
            content_blocks.append({
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"type": "text", "text": {"content": f"Curation Run: {topic}"}}]
                }
            })
            
            content_blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": f"Date: {timestamp}"}}]
                }
            })
            
            # Add categories
            category_display = {
                "short-unique": "Short-Unique",
                "short-trending": "Short-Trending",
                "long-unique": "Long-Unique",
                "long-trending": "Long-Trending"
            }
            
            for category_key in ["short-unique", "short-trending", "long-unique", "long-trending"]:
                items = categorized.get(category_key, [])
                
                if not items:
                    continue
                
                content_blocks.append({
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": category_display[category_key]}}]
                    }
                })
                
                for idx, item in enumerate(items, 1):
                    title = item.title[:100]  # Truncate long titles
                    url = item.url
                    summary = item.summary[:150]
                    source = item.source_type
                    time_min = item.estimated_minutes
                    
                    content_blocks.append({
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [
                                {"type": "text", "text": {"content": f"{idx}. "}},
                                {"type": "text", "text": {"content": title, "link": {"url": url}}, "annotations": {"bold": True}},
                                {"type": "text", "text": {"content": f" - {summary} | "}},
                                {"type": "text", "text": {"content": source}, "annotations": {"italic": True}},
                                {"type": "text", "text": {"content": f" | ~{time_min} min"}}
                            ]
                        }
                    })
            
            # Create page
            resp = requests.post(
                "https://api.notion.com/v1/pages",
                headers=headers,
                json={
                    "parent": {"database_id": DATABASE_ID},
                    "properties": {
                        "Name": {
                            "title": [{"text": {"content": page_title}}]
                        }
                    },
                    "children": content_blocks
                },
                timeout=30
            )
            
            if resp.status_code == 200:
                page_url = resp.json()["url"]
                print(f"✅ Published to Notion: {page_url}", file=sys.stderr)
                return page_url
            else:
                print(f"❌ Notion API error: {resp.status_code} - {resp.text}", file=sys.stderr)
                return None
        
        except Exception as e:
            print(f"❌ Notion publish error: {e}", file=sys.stderr)
            return None


def main():
    parser = argparse.ArgumentParser(description="Curate v3 - Content Curation Engine")
    parser.add_argument("--topic", type=str, help="Specific topic to curate")
    parser.add_argument("--source", type=str, help="Specific source (x, reddit, youtube, etc.)")
    parser.add_argument("--count", type=int, default=12, help="Total number of items to curate")
    parser.add_argument("--output", type=str, default="json", choices=["json", "markdown"], 
                       help="Output format")
    parser.add_argument("--skip-notion", action="store_true", help="Skip Notion publishing")
    
    args = parser.parse_args()
    
    # Initialize engine
    engine = CurateEngine()
    
    # Run curation
    print(f"🔍 Curating: {args.topic or 'General'} (target: {args.count} items)", file=sys.stderr)
    results = engine.curate(
        topic=args.topic,
        source=args.source,
        count=args.count
    )
    
    # Publish to Notion (unless skipped)
    if not args.skip_notion:
        notion_url = engine.publish_to_notion(results, topic=args.topic or "General")
    
    # Output results
    if args.output == "json":
        output = {}
        for category, items in results.items():
            output[category] = [item.to_dict() for item in items]
        print(json.dumps(output, indent=2))
    
    else:  # markdown
        print(f"# Curation: {args.topic or 'General'}")
        print(f"**Date:** {datetime.now().strftime('%Y-%m-%d %I:%M %p EST')}")
        print()
        
        for category, items in results.items():
            print(f"## {category.replace('-', ' ').title()}")
            for i, item in enumerate(items, 1):
                print(f"{i}. **[{item.title}]({item.url})** - {item.summary} | *{item.source_type}* | ~{item.estimated_minutes} min")
            print()


if __name__ == "__main__":
    main()
