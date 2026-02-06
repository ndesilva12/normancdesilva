"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Search,
  Loader2,
  MapPin,
  Building2,
  FileText,
  Newspaper,
  Users,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Calendar,
  Phone,
  Globe,
  Mail,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { IntelToolNav } from "@/components/IntelToolNav";
import { BusinessSearchResult, BusinessAnalysis } from "@/types/business";

// US States for dropdown
const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "Washington DC" },
];

export default function BusinessInfoPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [additionalFilters, setAdditionalFilters] = useState("");

  const [searchResults, setSearchResults] = useState<BusinessSearchResult[] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessSearchResult | null>(null);
  const [businessDetails, setBusinessDetails] = useState<BusinessAnalysis | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !city.trim() || !state) return;

    setIsSearching(true);
    setError(null);
    setSearchResults(null);
    setSelectedBusiness(null);
    setBusinessDetails(null);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        city: city.trim(),
        state,
      });
      if (additionalFilters.trim()) {
        params.set("filters", additionalFilters.trim());
      }

      const response = await fetch(`/api/business/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Search failed");
      }

      setSearchResults(data.results);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBusiness = async (business: BusinessSearchResult) => {
    setSelectedBusiness(business);
    setIsLoadingDetails(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        name: business.name,
        address: business.address,
        city: business.city,
        state: business.state,
      });

      const response = await fetch(`/api/business/details?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to get details");
      }

      setBusinessDetails(data.data);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleReset = () => {
    setSearchResults(null);
    setSelectedBusiness(null);
    setBusinessDetails(null);
    setError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(135deg, #1a0f0a 0%, #2a1e1a 50%, #1e1a26 100%)", width: "100%" }}>
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

          <IntelToolNav current="business-info" />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "24px", textAlign: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Store style={{ width: "24px", height: "24px", color: "var(--background)" }} />
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>
                Business Info
              </h1>
            </div>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
              Deep dive into local businesses with public records, filings, and news
            </p>
          </motion.div>

          {/* Search Form */}
          {!businessDetails && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleSearch}
              className="glass rounded-2xl"
              style={{ padding: "24px", marginBottom: "24px" }}
            >
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Business Name */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "8px" }}>
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter business name..."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "14px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "10px",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {/* City and State */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "8px" }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city..."
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "14px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "10px",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)", marginBottom: "8px" }}>
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "14px",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "10px",
                        color: "var(--foreground)",
                        appearance: "none",
                      }}
                    >
                      <option value="" style={{ backgroundColor: "#1a1a2e" }}>Select state...</option>
                      {US_STATES.map((s) => (
                        <option key={s.code} value={s.code} style={{ backgroundColor: "#1a1a2e" }}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Filters */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground-muted)" }}>
                      Additional Filters (optional)
                    </label>
                    {query.trim() && city.trim() && state && (
                      <button
                        type="submit"
                        disabled={isSearching}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          backgroundColor: isSearching ? "rgba(var(--accent-rgb), 0.3)" : "var(--accent)",
                          color: isSearching ? "rgba(var(--foreground), 0.5)" : "var(--background)",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: isSearching ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {isSearching ? (
                          <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Search style={{ width: "12px", height: "12px" }} />
                        )}
                        <span>Search</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={additionalFilters}
                    onChange={(e) => setAdditionalFilters(e.target.value)}
                    placeholder="e.g., restaurant, on Main Street, opened in 2020..."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "14px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "10px",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={!query.trim() || !city.trim() || !state || isSearching}
                  style={{
                    padding: "14px 24px",
                    fontSize: "14px",
                    fontWeight: 600,
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    borderRadius: "10px",
                    cursor: !query.trim() || !city.trim() || !state || isSearching ? "not-allowed" : "pointer",
                    opacity: !query.trim() || !city.trim() || !state || isSearching ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isSearching ? (
                    <>
                      <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search style={{ width: "18px", height: "18px" }} />
                      Search Businesses
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl"
              style={{
                padding: "16px",
                marginBottom: "24px",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#f87171" }}>
                <AlertCircle style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                <span style={{ fontSize: "14px" }}>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Search Results - Select Business */}
          {searchResults && !businessDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass rounded-2xl" style={{ overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--glass-border)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                    Select the Correct Business
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                    Found {searchResults.length} potential matches. Click one to view full details.
                  </p>
                </div>

                {searchResults.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--foreground-muted)" }}>
                    No businesses found matching your search. Try adjusting your search terms.
                  </div>
                ) : (
                  <div>
                    {searchResults.map((business, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectBusiness(business)}
                        disabled={isLoadingDetails}
                        style={{
                          width: "100%",
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderBottom: index < searchResults.length - 1 ? "1px solid var(--glass-border)" : "none",
                          cursor: isLoadingDetails ? "wait" : "pointer",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            backgroundColor: `rgba(var(--accent-rgb), ${business.confidence / 100 * 0.3})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Building2 style={{ width: "22px", height: "22px", color: "var(--accent)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                            {business.name}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--foreground-muted)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <MapPin style={{ width: "12px", height: "12px" }} />
                            {business.address}, {business.city}, {business.state}
                          </div>
                          {business.type && (
                            <div style={{ fontSize: "12px", color: "var(--accent)", marginTop: "4px" }}>
                              {business.type}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Match</div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: business.confidence >= 80 ? "#22c55e" : business.confidence >= 50 ? "#eab308" : "var(--foreground-muted)" }}>
                            {business.confidence}%
                          </div>
                        </div>
                        <ChevronRight style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* New Search Button */}
              <button
                onClick={handleReset}
                style={{
                  marginTop: "16px",
                  padding: "12px 20px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                ← New Search
              </button>
            </motion.div>
          )}

          {/* Loading Details */}
          {isLoadingDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl"
              style={{ padding: "48px 24px", textAlign: "center" }}
            >
              <Loader2
                style={{
                  width: "48px",
                  height: "48px",
                  color: "var(--accent)",
                  margin: "0 auto 16px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ color: "var(--foreground)", fontSize: "16px", fontWeight: 500 }}>
                Searching Public Records...
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginTop: "8px" }}>
                Checking Secretary of State, local filings, licenses, and news
              </p>
            </motion.div>
          )}

          {/* Business Details */}
          {businessDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Back to Results */}
              <button
                onClick={handleReset}
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ← New Search
              </button>

              {/* Business Header */}
              <div className="glass rounded-2xl" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "16px",
                      backgroundColor: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Store style={{ width: "32px", height: "32px", color: "var(--background)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" }}>
                      {businessDetails.businessName}
                    </h2>
                    {businessDetails.tradeName && businessDetails.tradeName !== businessDetails.businessName && (
                      <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                        DBA: {businessDetails.tradeName}
                      </p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <MapPin style={{ width: "14px", height: "14px" }} />
                        {businessDetails.address}, {businessDetails.city}, {businessDetails.state} {businessDetails.zipCode}
                      </div>
                      {businessDetails.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                          <Phone style={{ width: "14px", height: "14px" }} />
                          {businessDetails.phone}
                        </div>
                      )}
                      {businessDetails.website && (
                        <a
                          href={businessDetails.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--accent)", textDecoration: "none" }}
                        >
                          <Globe style={{ width: "14px", height: "14px" }} />
                          Website
                          <ExternalLink style={{ width: "12px", height: "12px" }} />
                        </a>
                      )}
                      {businessDetails.email && (
                        <a
                          href={`mailto:${businessDetails.email}`}
                          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--foreground-muted)", textDecoration: "none" }}
                        >
                          <Mail style={{ width: "14px", height: "14px" }} />
                          {businessDetails.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginTop: "20px" }}>
                  {businessDetails.businessType && (
                    <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Type</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{businessDetails.businessType}</div>
                    </div>
                  )}
                  {businessDetails.industry && (
                    <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Industry</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{businessDetails.industry}</div>
                    </div>
                  )}
                  {businessDetails.yearEstablished && (
                    <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Established</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{businessDetails.yearEstablished}</div>
                    </div>
                  )}
                  {businessDetails.employeeCount && (
                    <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Employees</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{businessDetails.employeeCount}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {businessDetails.summary && (
                <div className="glass rounded-2xl" style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                    Summary
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>
                    {businessDetails.summary}
                  </p>
                </div>
              )}

              {/* Owners */}
              {businessDetails.owners && businessDetails.owners.length > 0 && (
                <div className="glass rounded-2xl" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <Users style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                      Ownership & Leadership
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {businessDetails.owners.map((owner, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>
                            {owner.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                            {owner.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            {owner.title}
                            {owner.ownership && ` • ${owner.ownership}`}
                          </div>
                        </div>
                      </div>
                    ))}
                    {businessDetails.registeredAgent && (
                      <div style={{ marginTop: "8px", padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Registered Agent</div>
                        <div style={{ fontSize: "13px", color: "var(--foreground)" }}>{businessDetails.registeredAgent}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filings */}
              {businessDetails.filings && businessDetails.filings.length > 0 && (
                <div className="glass rounded-2xl" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <FileText style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                      Public Filings & Records
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {businessDetails.filings.map((filing, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                            {filing.type}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                            {filing.agency}
                            {filing.documentNumber && ` • ${filing.documentNumber}`}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            <Calendar style={{ width: "12px", height: "12px", display: "inline", marginRight: "4px" }} />
                            {filing.date}
                          </div>
                          {filing.status && (
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: filing.status.toLowerCase() === "active" ? "#22c55e" : "#ef4444",
                                marginTop: "4px",
                              }}
                            >
                              {filing.status}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Licenses */}
              {businessDetails.licenses && businessDetails.licenses.length > 0 && (
                <div className="glass rounded-2xl" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <FileText style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                      Licenses & Permits
                    </h3>
                  </div>
                  <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                    {businessDetails.licenses.map((license, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                          {license.type}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                          {license.issuedBy}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                          {license.issueDate && `Issued: ${license.issueDate}`}
                          {license.expirationDate && ` • Expires: ${license.expirationDate}`}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: license.status.toLowerCase() === "active" ? "#22c55e" : "#ef4444",
                            marginTop: "6px",
                          }}
                        >
                          {license.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* News */}
              {businessDetails.newsArticles && businessDetails.newsArticles.length > 0 && (
                <div className="glass rounded-2xl" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <Newspaper style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                      News & Media
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {businessDetails.newsArticles.map((article, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          backgroundColor: "rgba(255,255,255,0.03)",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                          {article.source} • {article.date}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                          {article.summary}
                        </div>
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              color: "var(--accent)",
                              textDecoration: "none",
                              marginTop: "8px",
                            }}
                          >
                            Read more <ExternalLink style={{ width: "12px", height: "12px" }} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Source */}
              <div style={{ textAlign: "center", fontSize: "12px", color: "var(--foreground-muted)" }}>
                {cached && "Retrieved from cache • "}
                Data sources: {businessDetails.dataSource}
              </div>
            </motion.div>
          )}

          {/* Initial State */}
          {!searchResults && !isSearching && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl"
              style={{ padding: "32px", textAlign: "center" }}
            >
              <h3 style={{ fontSize: "17px", fontWeight: 500, color: "var(--foreground)", marginBottom: "12px" }}>
                How it works
              </h3>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
                Search for any local business to find public records, filings, ownership details, licenses, and news coverage.
                Enter the business name along with its city and state for best results.
              </p>
              <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                Results are cached to minimize API costs and speed up future searches.
              </div>
            </motion.div>
          )}
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
