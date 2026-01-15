"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CompanySearchBar } from "@/components/company/CompanySearchBar";
import { CompanyReport } from "@/components/company/CompanyReport";
import { CompanyAnalysis } from "@/types/company";

export default function CompanyPoliticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompanyAnalysis | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch(
        `/api/company/analyze?company=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Failed to analyze company";
        throw new Error(errorMsg);
      }

      setReport(data.data);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            padding: "60px 24px 80px 24px",
          }}
        >
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "60px" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "8px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "16px",
                transition: "all 0.2s",
              }}
            >
              <ArrowLeft style={{ width: "20px", height: "20px" }} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "60px", textAlign: "center" }}
          >
            <h1
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "16px",
              }}
            >
              Company Politics Search
            </h1>
            <p
              style={{
                fontSize: "18px",
                color: "var(--foreground-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <Sparkles style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
              AI-powered analysis of corporate political leanings
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginBottom: "60px" }}
          >
            <CompanySearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="Enter a company name (e.g., Apple, Tesla, Amazon)..."
            />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                marginBottom: "48px",
                borderRadius: "16px",
                padding: "24px",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  color: "#f87171",
                }}
              >
                <AlertCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                <span style={{ fontSize: "16px" }}>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "64px 0" }}
            >
              <div
                className="glass"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "16px",
                  borderRadius: "16px",
                  padding: "24px 32px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "2px solid var(--accent)",
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span style={{ fontSize: "16px", color: "var(--foreground-muted)" }}>
                  Analyzing company politics... This may take a moment.
                </span>
              </div>
            </motion.div>
          )}

          {/* Report */}
          {report && !isLoading && (
            <CompanyReport report={report} cached={cached} />
          )}

          {/* Initial State */}
          {!report && !isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ textAlign: "center", padding: "64px 0" }}
            >
              <div
                className="glass"
                style={{
                  borderRadius: "16px",
                  padding: "40px",
                  maxWidth: "500px",
                  margin: "0 auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    marginBottom: "16px",
                  }}
                >
                  How it works
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    color: "var(--foreground-muted)",
                    marginBottom: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  Enter any company name to get a detailed analysis of their political
                  positions, donations, lobbying activities, and public statements.
                </p>
                <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Results are cached for 7 days to minimize API costs.
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
