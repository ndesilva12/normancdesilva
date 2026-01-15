"use client";

import { useState, FormEvent } from "react";
import { Search, Loader2, X } from "lucide-react";

interface CompanySearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function CompanySearchBar({
  onSearch,
  isLoading = false,
  placeholder = "Search for a company...",
}: CompanySearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderRadius: "12px",
          padding: "10px",
          paddingLeft: "16px",
        }}
      >
        {isLoading ? (
          <Loader2
            style={{
              width: "20px",
              height: "20px",
              flexShrink: 0,
              color: "var(--accent)",
              animation: "spin 1s linear infinite",
            }}
          />
        ) : (
          <Search
            style={{
              width: "20px",
              height: "20px",
              flexShrink: 0,
              color: "var(--foreground-muted)",
            }}
          />
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "15px",
            color: "var(--foreground)",
            padding: "8px 0",
            opacity: isLoading ? 0.5 : 1,
          }}
        />
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              flexShrink: 0,
              padding: "6px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--foreground-muted)",
            }}
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          style={{
            flexShrink: 0,
            borderRadius: "8px",
            backgroundColor: "var(--accent)",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--background)",
            border: "none",
            cursor: !query.trim() || isLoading ? "not-allowed" : "pointer",
            opacity: !query.trim() || isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
