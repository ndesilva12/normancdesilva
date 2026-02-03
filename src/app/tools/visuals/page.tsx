"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Search,
  Wand2,
  BarChart3,
  Lightbulb,
  Loader2,
  ExternalLink,
  Download,
  Image as ImageIcon,
  Zap,
  Gem,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

type Action = "search" | "generate";
type GenerateMode = "data" | "imagine";
type ImageProvider = "grok" | "gemini";

interface SearchUrls {
  google: string;
  bing: string;
  unsplash: string;
  pexels: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

export default function VisualsPage() {
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState<Action>("search");
  const [generateMode, setGenerateMode] = useState<GenerateMode>("imagine");
  const [provider, setProvider] = useState<ImageProvider>("grok");
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [searchUrls, setSearchUrls] = useState<SearchUrls | null>(null);
  const [usedProvider, setUsedProvider] = useState<string | null>(null);

  // Fetch available providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/visuals");
        const data = await response.json();
        if (data.providers) {
          setAvailableProviders(data.providers);
          // Set default to first available provider
          const firstAvailable = data.providers.find((p: ProviderInfo) => p.available);
          if (firstAvailable) {
            setProvider(firstAvailable.id as ImageProvider);
          }
        }
      } catch (err) {
        console.error("Failed to fetch providers:", err);
      }
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setSearchUrls(null);
    setRevisedPrompt(null);
    setUsedProvider(null);

    try {
      const response = await fetch("/api/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          action,
          mode: generateMode,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      if (data.action === "search") {
        setSearchUrls(data.searchUrls);
      } else if (data.action === "generate") {
        setGeneratedImage(data.imageUrl);
        setRevisedPrompt(data.revisedPrompt);
        setUsedProvider(data.provider);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visual-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "80%",
            maxWidth: "1200px",
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
            style={{ marginBottom: "32px" }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Sparkles style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              Visuals
            </h1>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
              Find existing images or generate new ones with AI
            </p>
          </motion.div>

          {/* Action Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginBottom: "24px" }}
          >
            <div
              className="glass"
              style={{
                display: "flex",
                padding: "6px",
                borderRadius: "12px",
                gap: "6px",
              }}
            >
              <button
                onClick={() => setAction("search")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: action === "search" ? "var(--accent)" : "transparent",
                  color: action === "search" ? "var(--background)" : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Search style={{ width: "18px", height: "18px" }} />
                Find Existing Images
              </button>
              <button
                onClick={() => setAction("generate")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: action === "generate" ? "var(--accent)" : "transparent",
                  color: action === "generate" ? "var(--background)" : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Wand2 style={{ width: "18px", height: "18px" }} />
                Generate with AI
              </button>
            </div>
          </motion.div>

          {/* Generate Mode Selector (only shown when generating) */}
          {action === "generate" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: "24px" }}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setGenerateMode("data")}
                  className="glass"
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: generateMode === "data" ? "2px solid var(--accent)" : "2px solid transparent",
                    backgroundColor: generateMode === "data" ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <BarChart3
                      style={{
                        width: "20px",
                        height: "20px",
                        color: generateMode === "data" ? "var(--accent)" : "var(--foreground-muted)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: generateMode === "data" ? "var(--accent)" : "var(--foreground)",
                      }}
                    >
                      Data
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.4 }}>
                    Generate charts, infographics, and data visualizations
                  </p>
                </button>

                <button
                  onClick={() => setGenerateMode("imagine")}
                  className="glass"
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: generateMode === "imagine" ? "2px solid var(--accent)" : "2px solid transparent",
                    backgroundColor: generateMode === "imagine" ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <Lightbulb
                      style={{
                        width: "20px",
                        height: "20px",
                        color: generateMode === "imagine" ? "var(--accent)" : "var(--foreground-muted)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: generateMode === "imagine" ? "var(--accent)" : "var(--foreground)",
                      }}
                    >
                      Imagine
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.4 }}>
                    Create artistic, creative images from your imagination
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {/* Provider Selector (only shown when generating) */}
          {action === "generate" && availableProviders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: "24px" }}
            >
              <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "10px" }}>
                AI Model
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {availableProviders.filter(p => p.available).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id as ImageProvider)}
                    className="glass"
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: provider === p.id ? "2px solid var(--accent)" : "2px solid transparent",
                      backgroundColor: provider === p.id ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {p.id === "grok" ? (
                        <Zap
                          style={{
                            width: "18px",
                            height: "18px",
                            color: provider === p.id ? "var(--accent)" : "var(--foreground-muted)",
                          }}
                        />
                      ) : (
                        <Gem
                          style={{
                            width: "18px",
                            height: "18px",
                            color: provider === p.id ? "var(--accent)" : "var(--foreground-muted)",
                          }}
                        />
                      )}
                      <div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: provider === p.id ? "var(--accent)" : "var(--foreground)",
                          }}
                        >
                          {p.name}
                        </span>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <textarea
              placeholder={
                action === "search"
                  ? "Describe what kind of images you're looking for..."
                  : generateMode === "data"
                  ? "Describe the data or information you want to visualize..."
                  : "Describe the image you want to create..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--glass-border)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground)",
                fontSize: "15px",
                lineHeight: 1.6,
                resize: "none",
                outline: "none",
                marginBottom: "16px",
                fontFamily: "inherit",
              }}
            />

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: !prompt.trim() || isLoading ? "not-allowed" : "pointer",
                opacity: !prompt.trim() || isLoading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                  {action === "search" ? "Finding images..." : "Generating..."}
                </>
              ) : (
                <>
                  {action === "search" ? (
                    <>
                      <Search style={{ width: "18px", height: "18px" }} />
                      Find Images
                    </>
                  ) : (
                    <>
                      <Wand2 style={{ width: "18px", height: "18px" }} />
                      Generate Image
                    </>
                  )}
                </>
              )}
            </button>
          </motion.form>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "24px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <p style={{ fontSize: "14px", color: "#f87171" }}>{error}</p>
            </motion.div>
          )}

          {/* Search Results */}
          {searchUrls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
                Search for &quot;{prompt}&quot; on:
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <a
                  href={searchUrls.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  Google Images
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                </a>
                <a
                  href={searchUrls.bing}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  Bing Images
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                </a>
                <a
                  href={searchUrls.unsplash}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  Unsplash (Free)
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                </a>
                <a
                  href={searchUrls.pexels}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                >
                  Pexels (Free)
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                </a>
              </div>
            </motion.div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                    Generated Image
                  </h3>
                  {usedProvider && (
                    <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                      Created with {usedProvider === "grok" ? "Grok (Aurora)" : "Gemini (Imagen 3)"}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Download style={{ width: "14px", height: "14px" }} />
                  Download
                </button>
              </div>

              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                }}
              >
                <img
                  src={generatedImage}
                  alt="Generated visual"
                  style={{
                    width: "100%",
                    display: "block",
                  }}
                />
              </div>

              {revisedPrompt && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                    AI-enhanced prompt:
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--foreground)", fontStyle: "italic" }}>
                    &quot;{revisedPrompt}&quot;
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Tips for Better Results
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <ImageIcon style={{ width: "20px", height: "20px", color: "var(--accent)", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>Be specific</p>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    Include details like colors, style, composition, and mood
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <BarChart3 style={{ width: "20px", height: "20px", color: "var(--accent)", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>Data mode</p>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    Best for charts, graphs, infographics, and statistical visualizations
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <Lightbulb style={{ width: "20px", height: "20px", color: "var(--accent)", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>Imagine mode</p>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    Best for creative, artistic, and conceptual imagery
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
