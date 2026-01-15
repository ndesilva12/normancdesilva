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
      <div className="relative flex items-center">
        {isLoading ? (
          <Loader2 className="absolute left-5 h-6 w-6 animate-spin text-accent" />
        ) : (
          <Search className="absolute left-5 h-6 w-6 text-foreground-muted" />
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="glass w-full rounded-2xl py-4 pl-14 pr-28 text-lg text-foreground placeholder:text-foreground-muted focus:border-accent/30 focus:bg-glass-hover focus:outline-none disabled:opacity-50"
        />
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 p-2 text-foreground-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute right-3 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
