"use client";

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from "react-plaid-link";
import { Plus, Loader2 } from "lucide-react";

interface PlaidLinkButtonProps {
  userId: string;
  onSuccess: () => void;
  variant?: "primary" | "secondary";
}

export function PlaidLinkButton({ userId, onSuccess, variant = "primary" }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch link token on mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to create link token");
        }

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (err) {
        console.error("Error fetching link token:", err);
        setError("Failed to initialize Plaid");
      }
    };

    if (userId) {
      fetchLinkToken();
    }
  }, [userId]);

  const handleSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      setLoading(true);
      try {
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            userId,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange token");
        }

        onSuccess();
      } catch (err) {
        console.error("Error exchanging token:", err);
        setError("Failed to connect account");
      } finally {
        setLoading(false);
      }
    },
    [userId, onSuccess]
  );

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: (err) => {
      if (err) {
        console.error("Plaid Link exit error:", err);
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  if (error) {
    return (
      <div style={{ color: "#f87171", fontSize: "13px" }}>
        {error}
      </div>
    );
  }

  const isPrimary = variant === "primary";

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: isPrimary ? "12px 20px" : "8px 14px",
        borderRadius: "8px",
        border: isPrimary ? "none" : "1px solid var(--glass-border)",
        backgroundColor: isPrimary ? "var(--accent)" : "transparent",
        color: isPrimary ? "var(--background)" : "var(--foreground)",
        fontSize: isPrimary ? "14px" : "13px",
        fontWeight: 500,
        cursor: !ready || loading ? "not-allowed" : "pointer",
        opacity: !ready || loading ? 0.6 : 1,
        transition: "all 0.15s",
      }}
    >
      {loading ? (
        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
      ) : (
        <Plus style={{ width: "16px", height: "16px" }} />
      )}
      {loading ? "Connecting..." : "Link Account"}
    </button>
  );
}
