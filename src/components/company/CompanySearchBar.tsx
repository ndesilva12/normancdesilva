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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass flex items-center gap-4 rounded-2xl p-4 pl-6">
        {isLoading ? (
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-accent" />
        ) : (
          <Search className="h-6 w-6 shrink-0 text-foreground-muted" />
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="min-w-0 flex-1 bg-transparent py-3 text-lg text-foreground placeholder:text-foreground-muted focus:outline-none disabled:opacity-50"
        />
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="shrink-0 rounded-xl bg-accent px-6 py-4 text-base font-medium text-background transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
