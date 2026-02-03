"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet, ExternalLink, Plus, RefreshCw, Loader2, Building2, CreditCard, PiggyBank, TrendingUp } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuth } from "@/contexts/AuthContext";
import { PlaidLinkButton } from "./PlaidLink";

interface Account {
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    isoCurrencyCode: string | null;
  };
  institutionName: string;
  itemId: string;
}

interface Institution {
  itemId: string;
  name: string;
  institutionId: string | null;
}

function getAccountIcon(type: string) {
  switch (type) {
    case "depository":
      return <Building2 style={{ width: "14px", height: "14px" }} />;
    case "credit":
      return <CreditCard style={{ width: "14px", height: "14px" }} />;
    case "investment":
      return <TrendingUp style={{ width: "14px", height: "14px" }} />;
    case "loan":
      return <Wallet style={{ width: "14px", height: "14px" }} />;
    default:
      return <PiggyBank style={{ width: "14px", height: "14px" }} />;
  }
}

function formatCurrency(amount: number | null, currency: string | null = "USD"): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function AccountsPreview() {
  const { isEditMode } = useLayout();
  const { user } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLinkButton, setShowLinkButton] = useState(false);

  const fetchAccounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/plaid/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        setInstitutions(data.institutions || []);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const handleLinkSuccess = () => {
    setShowLinkButton(false);
    fetchAccounts();
  };

  // Calculate totals by type
  const totals = accounts.reduce(
    (acc, account) => {
      const balance = account.balances.current || 0;
      if (account.type === "depository") {
        acc.cash += balance;
      } else if (account.type === "credit") {
        acc.credit += balance;
      } else if (account.type === "investment") {
        acc.investments += balance;
      }
      return acc;
    },
    { cash: 0, credit: 0, investments: 0 }
  );

  const netWorth = totals.cash + totals.investments - totals.credit;

  if (!user) {
    return (
      <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "18px 16px", borderBottom: "1px solid var(--glass-border)", flexShrink: 0 }}>
          <Wallet style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>Accounts</span>
        </div>
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
          Sign in to view your accounts
        </div>
      </div>
    );
  }

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => {
          router.push("/tools/accounts");
        }}
      >
        <Link
          href="/tools/accounts"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
          }}
        >
          <Wallet style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>Accounts</span>
        </Link>

        {!isEditMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--foreground-muted)",
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
            title="Refresh"
          >
            <RefreshCw
              style={{
                width: "14px",
                height: "14px",
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        )}
        <Link
          href="/tools/accounts"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}
        >
          <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
              <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                No accounts linked yet
              </div>
              {showLinkButton ? (
                <PlaidLinkButton userId={user.uid} onSuccess={handleLinkSuccess} />
              ) : (
                <button
                  onClick={() => setShowLinkButton(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: "16px", height: "16px" }} />
                  Link Account
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Net Worth Summary */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                  border: "1px solid rgba(var(--accent-rgb), 0.2)",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                  Net Worth
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
                  {formatCurrency(netWorth)}
                </div>
              </div>

              {/* Summary by Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                  <div style={{ fontSize: "11px", color: "#22c55e", marginBottom: "2px" }}>Cash</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{formatCurrency(totals.cash)}</div>
                </div>
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                  <div style={{ fontSize: "11px", color: "#3b82f6", marginBottom: "2px" }}>Investments</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{formatCurrency(totals.investments)}</div>
                </div>
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <div style={{ fontSize: "11px", color: "#ef4444", marginBottom: "2px" }}>Credit</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{formatCurrency(totals.credit)}</div>
                </div>
              </div>

              {/* Account List (first 5) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {accounts.slice(0, 5).map((account) => (
                  <div
                    key={account.accountId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div style={{ color: "var(--foreground-muted)" }}>
                      {getAccountIcon(account.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {account.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                        {account.institutionName} {account.mask && `••${account.mask}`}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: account.type === "credit" ? "#ef4444" : "var(--foreground)", textAlign: "right" }}>
                      {formatCurrency(account.balances.current, account.balances.isoCurrencyCode)}
                    </div>
                  </div>
                ))}
                {accounts.length > 5 && (
                  <Link
                    href="/tools/accounts"
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      color: "var(--accent)",
                      textDecoration: "none",
                      padding: "8px",
                    }}
                  >
                    View all {accounts.length} accounts
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
