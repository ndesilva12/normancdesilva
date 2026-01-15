"use client";

import { useState, useMemo, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { tools, categories } from "@/lib/tools";

function LiveDateTime() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) {
    return <div className="h-20" />;
  }

  const formattedDate = dateTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = dateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="text-center">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {formattedDate}
      </h1>
      <p className="text-2xl font-light text-accent sm:text-3xl">
        {formattedTime}
      </p>
    </div>
  );
}

function WebSearch() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}`;
      window.open(searchUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl" style={{ margin: "0 auto" }}>
      <div className="relative flex items-center">
        <Search className="absolute left-5 h-6 w-6 text-foreground-muted" />
        <input
          type="text"
          placeholder="Search the web..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="glass w-full rounded-2xl py-4 pl-14 pr-32 text-lg text-foreground placeholder:text-foreground-muted focus:border-accent/30 focus:bg-glass-hover focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-3 flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-light"
        >
          Search
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;
      return matchesCategory;
    });
  }, [selectedCategory]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />

      <main className="flex-1 w-full">
        <div className="w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8" style={{ margin: "0 auto" }}>
          {/* Date/Time Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex w-full justify-center"
          >
            <LiveDateTime />
          </motion.section>

          {/* Main Web Search */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16 flex w-full justify-center"
          >
            <WebSearch />
          </motion.section>

          {/* Tools Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            {/* Category Pills */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200
                    ${
                      selectedCategory === category.id
                        ? "bg-accent text-background"
                        : "glass text-foreground-muted hover:bg-glass-hover hover:text-foreground"
                    }
                  `}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool, index) => (
                  <ToolCard key={tool.id} tool={tool} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-foreground-muted">
                  No tools found in this category.
                </p>
              </div>
            )}
          </motion.section>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 border-t border-glass-border py-8 text-center text-sm text-foreground-muted"
          >
            <p>
              Built by{" "}
              <span className="font-medium text-foreground">Norman C. de Silva</span>
            </p>
          </motion.footer>
        </div>
      </main>
    </div>
  );
}
