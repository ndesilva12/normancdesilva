"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { tools, categories } from "@/lib/tools";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const aiToolsCount = tools.filter((t) => t.aiPowered).length;

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your <span className="text-gradient">Tools</span> Collection
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-foreground-muted">
            A curated suite of everyday utilities and AI-powered tools,
            designed for simplicity and efficiency.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-foreground-muted">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>{aiToolsCount} AI-powered tools available</span>
          </div>
        </motion.section>

        {/* Search and Filter */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          {/* Search Bar */}
          <div className="relative mx-auto mb-6 max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass w-full rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-foreground-muted focus:border-accent/30 focus:bg-glass-hover focus:outline-none"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
                  ${
                    selectedCategory === category.id
                      ? "bg-accent text-background"
                      : "glass glass-hover text-foreground-muted hover:text-foreground"
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Tools Grid */}
        <section>
          {filteredTools.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <p className="text-foreground-muted">
                No tools found matching your search.
              </p>
            </motion.div>
          )}
        </section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 border-t border-glass-border py-8 text-center text-sm text-foreground-muted"
        >
          <p>
            Built with care by{" "}
            <span className="font-medium text-foreground">Norman C. de Silva</span>
          </p>
        </motion.footer>
      </main>
    </>
  );
}
