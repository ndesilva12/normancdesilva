"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ScanSearch, Upload, Link2, ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type SearchEngine = "google" | "bing";

export default function ImageLookupPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>("google");
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setImageUrl(""); // Clear URL input when file is uploaded
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setImageUrl("");
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getGoogleLensUrl = (url: string) => {
    return `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`;
  };

  const getBingVisualSearchUrl = (url: string) => {
    return `https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIVSP&sbisrc=UrlPaste&q=imgurl:${encodeURIComponent(url)}`;
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    if (!storage) {
      throw new Error("Firebase Storage is not configured");
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `image-lookup/${timestamp}-${file.name}`;
    const storageRef = ref(storage, filename);

    // Upload the file
    setUploadStatus("Uploading image...");
    await uploadBytes(storageRef, file);

    // Get the download URL
    setUploadStatus("Getting image URL...");
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setUploadStatus(null);

    try {
      let searchUrl = "";
      let finalImageUrl = imageUrl;

      // If we have an uploaded file, upload it to Firebase Storage first
      if (uploadedFile && uploadedImage) {
        try {
          finalImageUrl = await uploadImageToStorage(uploadedFile);
          setUploadStatus("Opening search...");
        } catch (error) {
          console.error("Upload error:", error);
          // Fallback: open the search engine directly
          setUploadStatus("Upload failed, opening search page...");
          if (selectedEngine === "google") {
            window.open("https://lens.google.com/", "_blank");
          } else {
            window.open("https://www.bing.com/visualsearch", "_blank");
          }
          return;
        }
      }

      // Now we have a URL (either pasted or from upload)
      if (finalImageUrl) {
        if (selectedEngine === "google") {
          searchUrl = getGoogleLensUrl(finalImageUrl);
        } else {
          searchUrl = getBingVisualSearchUrl(finalImageUrl);
        }
        window.open(searchUrl, "_blank");
      }
    } finally {
      setIsSearching(false);
      setUploadStatus(null);
    }
  };

  const canSearch = (imageUrl.trim() !== "") || (uploadedImage !== null);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
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
              <ScanSearch style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              Image Lookup
            </h1>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
              Reverse image search to find sources, similar images, and more information
            </p>
          </motion.div>

          {/* Search Engine Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginBottom: "24px" }}
          >
            <div
              className="glass"
              style={{
                display: "inline-flex",
                padding: "6px",
                borderRadius: "10px",
                gap: "6px",
              }}
            >
              <button
                onClick={() => setSelectedEngine("google")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: selectedEngine === "google" ? "var(--accent)" : "transparent",
                  color: selectedEngine === "google" ? "var(--background)" : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Google Lens
              </button>
              <button
                onClick={() => setSelectedEngine("bing")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: selectedEngine === "bing" ? "var(--accent)" : "transparent",
                  color: selectedEngine === "bing" ? "var(--background)" : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Bing Visual Search
              </button>
            </div>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            {/* Image Preview or Drop Zone */}
            {uploadedImage ? (
              <div style={{ position: "relative", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <button
                  onClick={clearImage}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X style={{ width: "18px", height: "18px" }} />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "var(--accent)" : "var(--glass-border)"}`,
                  borderRadius: "12px",
                  padding: "48px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: isDragging ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
                  marginBottom: "20px",
                }}
              >
                <Upload
                  style={{
                    width: "48px",
                    height: "48px",
                    color: isDragging ? "var(--accent)" : "var(--foreground-muted)",
                    margin: "0 auto 16px",
                  }}
                />
                <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--foreground)", marginBottom: "8px" }}>
                  Drop an image here or click to upload
                </p>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  Supports JPG, PNG, GIF, WebP
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--glass-border)" }} />
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>or paste image URL</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--glass-border)" }} />
            </div>

            {/* URL Input */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Link2
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "18px",
                    height: "18px",
                    color: "var(--foreground-muted)",
                  }}
                />
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (e.target.value) {
                      setUploadedImage(null);
                      setUploadedFile(null);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 44px",
                    borderRadius: "10px",
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Search Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={handleSearch}
              disabled={!canSearch || isSearching}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                fontSize: "16px",
                fontWeight: 600,
                cursor: !canSearch || isSearching ? "not-allowed" : "pointer",
                opacity: !canSearch || isSearching ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "opacity 0.2s",
              }}
            >
              {isSearching ? (
                <>
                  <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
                  {uploadStatus || "Processing..."}
                </>
              ) : (
                <>
                  <ExternalLink style={{ width: "20px", height: "20px" }} />
                  Search with {selectedEngine === "google" ? "Google Lens" : "Bing Visual Search"}
                </>
              )}
            </button>

            {uploadedImage && !isSearching && (
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)", textAlign: "center", marginTop: "12px" }}>
                Your image will be temporarily uploaded to enable the reverse image search.
              </p>
            )}
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginTop: "32px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              How Reverse Image Search Works
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>Upload or paste URL</p>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    Provide an image by uploading a file or pasting an image URL
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>Choose search engine</p>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    Select Google Lens or Bing Visual Search for best results
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>Find matches</p>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    Discover original sources, similar images, related products, and more
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
