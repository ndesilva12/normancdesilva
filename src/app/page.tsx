"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Date/Time Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex justify-center"
          >
            <LiveDateTime />
          </motion.section>

          {/* Search and Filter */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            {/* Search Bar */}
            <div className="mx-auto mb-8 max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass w-full rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-foreground-muted focus:border-accent/30 focus:bg-glass-hover focus:outline-none"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
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
          </motion.section>

          {/* Tools Grid */}
          <section>
            {filteredTools.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
