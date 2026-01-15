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
        throw new Error(data.error || "Failed to analyze company");
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
    <div className="flex min-h-screen w-full flex-col">
      <Header />

      <main className="flex-1 w-full">
        <div
          className="w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8"
          style={{ margin: "0 auto" }}
        >
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Company Politics Search
            </h1>
            <p className="text-foreground-muted flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              AI-powered analysis of corporate political leanings
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
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
              className="mb-8 glass rounded-xl p-4 border-red-500/30"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center gap-3 glass rounded-xl px-6 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span className="text-foreground-muted">
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
              className="text-center py-12"
            >
              <div className="glass rounded-xl p-8 max-w-md" style={{ margin: "0 auto" }}>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  How it works
                </h3>
                <p className="text-sm text-foreground-muted mb-4">
                  Enter any company name to get a detailed analysis of their political
                  positions, donations, lobbying activities, and public statements.
                </p>
                <div className="text-xs text-foreground-muted">
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
