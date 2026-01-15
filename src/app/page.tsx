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
      <div className="glass flex items-center gap-4 rounded-2xl p-4 pl-6">
        <Search className="h-6 w-6 shrink-0 text-foreground-muted" />
        <input
          type="text"
          placeholder="Search the web..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3 text-lg text-foreground placeholder:text-foreground-muted focus:outline-none"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-medium text-background transition-colors hover:bg-accent-light"
        >
          <span>Search</span>
          <ExternalLink className="h-5 w-5" />
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
        <div className="w-full max-w-5xl px-6 pt-16 pb-12 sm:px-8 lg:px-12" style={{ margin: "0 auto" }}>
          {/* Date/Time Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex w-full justify-center"
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
            <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
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
              <div className="py-16 text-center">
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
