"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
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
    return <div style={{ height: "80px" }} />;
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
    <div style={{ textAlign: "center" }}>
      <h1
        style={{
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 700,
          color: "var(--foreground)",
          marginBottom: "12px",
          letterSpacing: "-0.02em",
        }}
      >
        {formattedDate}
      </h1>
      <p
        style={{
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 300,
          color: "var(--accent)",
        }}
      >
        {formattedTime}
      </p>
    </div>
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px 100px 24px",
          }}
        >
          {/* Date/Time Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              marginBottom: "28px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <LiveDateTime />
          </motion.section>

          {/* Multi-Source Search */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ marginBottom: "40px" }}
          >
            <MultiSourceSearch />
          </motion.section>

          {/* Tools Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ width: "100%" }}
          >
            {/* Category Pills */}
            <div
              style={{
                marginBottom: "28px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory !== category.id ? "glass" : ""}
                  style={{
                    whiteSpace: "nowrap",
                    borderRadius: "9999px",
                    padding: "8px 18px",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor:
                      selectedCategory === category.id
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      selectedCategory === category.id
                        ? "var(--background)"
                        : "var(--foreground-muted)",
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >
                {filteredTools.map((tool, index) => (
                  <ToolCard key={tool.id} tool={tool} index={index} />
                ))}
              </div>
            ) : (
              <div style={{ padding: "64px 0", textAlign: "center" }}>
                <p style={{ color: "var(--foreground-muted)" }}>
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
            style={{
              marginTop: "48px",
              borderTop: "1px solid var(--glass-border)",
              padding: "24px 0",
              textAlign: "center",
              fontSize: "14px",
              color: "var(--foreground-muted)",
            }}
          >
            <p>
              Built by{" "}
              <span style={{ fontWeight: 500, color: "var(--foreground)" }}>
                Norman C. de Silva
              </span>
            </p>
          </motion.footer>
        </div>
      </main>
    </div>
  );
}
