"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertCircle, Clock, TrendingUp, History, X as XIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { CompanySearchBar } from "@/components/company/CompanySearchBar";
import { CompanyReport } from "@/components/company/CompanyReport";
import { CompanyAnalysis } from "@/types/company";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const RECENT_SEARCHES_KEY = "company-politics-recent-searches";
const MAX_RECENT_SEARCHES = 10;

interface TrendingCompanies {
  google: string[];
  x: string[];
}

export default function CompanyPoliticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompanyAnalysis | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trending, setTrending] = useState<TrendingCompanies>({ google: [], x: [] });
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Get user-specific storage key
  const getStorageKey = useCallback(() => {
    return user ? `${RECENT_SEARCHES_KEY}-${user.uid}` : RECENT_SEARCHES_KEY;
  }, [user]);

  // Load recent searches from Firestore with real-time sync, fallback to localStorage
  useEffect(() => {
    const storageKey = getStorageKey();

    // If user is logged in and Firestore is available, use it with real-time sync
    if (user && db) {
      const userDocRef = doc(db, "users", user.uid);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.companySearchHistory) {
              setRecentSearches(data.companySearchHistory);
              // Also update localStorage as backup
              localStorage.setItem(storageKey, JSON.stringify(data.companySearchHistory));
            }
          } else {
            // Check localStorage for initial data to migrate
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const localHistory = JSON.parse(stored);
                setRecentSearches(localHistory);
                // Migrate to Firestore
                setDoc(userDocRef, { companySearchHistory: localHistory }, { merge: true });
              } catch {
                setRecentSearches([]);
              }
            }
          }
        },
        (error) => {
          console.error("Firestore sync error:", error);
          // Fallback to localStorage
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setRecentSearches(JSON.parse(stored));
            } catch {
              setRecentSearches([]);
            }
          }
        }
      );

      return () => unsubscribe();
    } else {
      // Fallback to localStorage only
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          setRecentSearches([]);
        }
      }
    }
  }, [user, getStorageKey]);

  // Fetch trending companies
  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch("/api/trending");
        if (response.ok) {
          const data = await response.json();
          setTrending(data);
        }
      } catch (error) {
        console.error("Failed to fetch trending companies:", error);
      } finally {
        setTrendingLoading(false);
      }
    }
    fetchTrending();
  }, []);

  // Save search history to Firestore and localStorage
  const saveSearchHistory = useCallback(async (history: string[]) => {
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(history));
    setRecentSearches(history);

    // Save to Firestore for cross-device sync
    if (user && db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { companySearchHistory: history }, { merge: true });
      } catch (error) {
        console.error("Failed to save company search history to Firestore:", error);
      }
    }
  }, [user, getStorageKey]);

  const addToRecentSearches = useCallback((query: string) => {
    const normalized = query.trim();
    const updated = [normalized, ...recentSearches.filter(s => s.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    saveSearchHistory(updated);
  }, [recentSearches, saveSearchHistory]);

  const removeFromRecentSearches = useCallback((query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    saveSearchHistory(updated);
  }, [recentSearches, saveSearchHistory]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    addToRecentSearches(query);

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

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
          }}
        >
          <RemindersBanner />
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "32px", textAlign: "center" }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "10px",
              }}
            >
              Company Politics Search
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "var(--foreground-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Sparkles style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
              AI-powered analysis of corporate political leanings
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginBottom: "24px" }}
          >
            <CompanySearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="Enter a company name (e.g., Apple, Tesla, Amazon)..."
            />
          </motion.div>

          {/* Recent Searches & Trending - shown when no report is displayed */}
          {!report && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{ marginBottom: "32px" }}
            >
              <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div
                    className="glass"
                    style={{
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <History style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>Recent Searches</h3>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {recentSearches.map((company) => (
                        <div
                          key={company}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "6px",
                            padding: "6px 10px",
                          }}
                        >
                          <button
                            onClick={() => handleSearch(company)}
                            disabled={isLoading}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              fontSize: "13px",
                              color: "var(--foreground)",
                              cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                          >
                            {company}
                          </button>
                          <button
                            onClick={() => removeFromRecentSearches(company)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: "2px",
                              cursor: "pointer",
                              color: "var(--foreground-muted)",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <XIcon style={{ width: "12px", height: "12px" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending on Google */}
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <TrendingUp style={{ width: "18px", height: "18px", color: "#4285f4" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>Trending on Google</h3>
                  </div>
                  {trendingLoading ? (
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>Loading...</div>
                  ) : trending.google.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {trending.google.map((company) => (
                        <button
                          key={company}
                          onClick={() => handleSearch(company)}
                          disabled={isLoading}
                          style={{
                            background: "rgba(66, 133, 244, 0.1)",
                            border: "1px solid rgba(66, 133, 244, 0.2)",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            color: "var(--foreground)",
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {company}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>No trending data available</div>
                  )}
                </div>

                {/* Trending on X */}
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700 }}>𝕏</span>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>Trending on X</h3>
                  </div>
                  {trendingLoading ? (
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>Loading...</div>
                  ) : trending.x.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {trending.x.map((company) => (
                        <button
                          key={company}
                          onClick={() => handleSearch(company)}
                          disabled={isLoading}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            color: "var(--foreground)",
                            cursor: isLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {company}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>No trending data available</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                marginBottom: "24px",
                borderRadius: "12px",
                padding: "16px",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: "#f87171",
                }}
              >
                <AlertCircle style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                <span style={{ fontSize: "14px" }}>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "40px 0" }}
            >
              <div
                className="glass"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "12px",
                  padding: "16px 24px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid var(--accent)",
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
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
              style={{ textAlign: "center", padding: "40px 0" }}
            >
              <div
                className="glass"
                style={{
                  borderRadius: "12px",
                  padding: "28px",
                  maxWidth: "480px",
                  margin: "0 auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    marginBottom: "12px",
                  }}
                >
                  How it works
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--foreground-muted)",
                    marginBottom: "16px",
                    lineHeight: 1.5,
                  }}
                >
                  Enter any company name to get a detailed analysis of their political
                  positions, donations, lobbying activities, and public statements.
                </p>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
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
