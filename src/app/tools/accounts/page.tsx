"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Lock,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Plane,
  Gamepad2,
  Gift,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PlaidLinkButton } from "@/components/PlaidLink";

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

interface Transaction {
  transactionId: string;
  accountId: string;
  accountName: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  pending: boolean;
  institutionName: string;
  paymentChannel: string;
  logoUrl: string | null;
}

// PIN Storage
const PIN_STORAGE_KEY = "accounts_pin";
const PIN_VERIFIED_KEY = "accounts_pin_verified";
const PIN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function getPinHash(pin: string): string {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function getAccountIcon(type: string) {
  switch (type) {
    case "depository":
      return <Building2 style={{ width: "18px", height: "18px" }} />;
    case "credit":
      return <CreditCard style={{ width: "18px", height: "18px" }} />;
    case "investment":
      return <TrendingUp style={{ width: "18px", height: "18px" }} />;
    case "loan":
      return <Wallet style={{ width: "18px", height: "18px" }} />;
    default:
      return <PiggyBank style={{ width: "18px", height: "18px" }} />;
  }
}

function getCategoryIcon(category: string[]) {
  const primary = category[0]?.toLowerCase() || "";
  if (primary.includes("food") || primary.includes("restaurant")) return <Utensils style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("shop") || primary.includes("merchandise")) return <ShoppingCart style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("travel") || primary.includes("airline")) return <Plane style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("transport") || primary.includes("car") || primary.includes("gas")) return <Car style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("home") || primary.includes("rent") || primary.includes("mortgage")) return <Home style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("health") || primary.includes("medical")) return <Heart style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("entertainment") || primary.includes("recreation")) return <Gamepad2 style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("payment") || primary.includes("transfer")) return <DollarSign style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("income") || primary.includes("payroll")) return <Briefcase style={{ width: "14px", height: "14px" }} />;
  if (primary.includes("gift")) return <Gift style={{ width: "14px", height: "14px" }} />;
  return <MoreHorizontal style={{ width: "14px", height: "14px" }} />;
}

function formatCurrency(amount: number | null, currency: string | null = "USD"): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateString === today.toISOString().split("T")[0]) return "Today";
  if (dateString === yesterday.toISOString().split("T")[0]) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// PIN Entry Component
function PinEntry({ onVerify, hasExistingPin }: { onVerify: (verified: boolean) => void; hasExistingPin: boolean }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(!hasExistingPin);

  const handleSubmit = () => {
    if (isSettingPin) {
      if (pin.length < 4) {
        setError("PIN must be at least 4 digits");
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match");
        return;
      }
      localStorage.setItem(PIN_STORAGE_KEY, getPinHash(pin));
      localStorage.setItem(PIN_VERIFIED_KEY, Date.now().toString());
      onVerify(true);
    } else {
      const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
      if (storedHash === getPinHash(pin)) {
        localStorage.setItem(PIN_VERIFIED_KEY, Date.now().toString());
        onVerify(true);
      } else {
        setError("Incorrect PIN");
        setPin("");
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "20px" }}>
      <div className="glass" style={{ padding: "40px", borderRadius: "16px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <Lock style={{ width: "48px", height: "48px", color: "var(--accent)", marginBottom: "20px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
          {isSettingPin ? "Set Your PIN" : "Enter PIN"}
        </h2>
        <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
          {isSettingPin
            ? "Create a PIN to protect your financial data"
            : "Enter your PIN to view accounts"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSettingPin) handleSubmit();
            }}
            placeholder={isSettingPin ? "Enter new PIN" : "Enter PIN"}
            maxLength={8}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground)",
              fontSize: "18px",
              textAlign: "center",
              letterSpacing: "8px",
              outline: "none",
            }}
          />

          {isSettingPin && (
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Confirm PIN"
              maxLength={8}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border: "1px solid var(--glass-border)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground)",
                fontSize: "18px",
                textAlign: "center",
                letterSpacing: "8px",
                outline: "none",
              }}
            />
          )}
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={pin.length < 4}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "var(--accent)",
            color: "var(--background)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: pin.length < 4 ? "not-allowed" : "pointer",
            opacity: pin.length < 4 ? 0.6 : 1,
          }}
        >
          {isSettingPin ? "Set PIN" : "Unlock"}
        </button>

        {hasExistingPin && isSettingPin && (
          <button
            onClick={() => setIsSettingPin(false)}
            style={{
              marginTop: "12px",
              background: "none",
              border: "none",
              color: "var(--foreground-muted)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            I have a PIN
          </button>
        )}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { user } = useAuth();
  const [pinVerified, setPinVerified] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLinkButton, setShowLinkButton] = useState(false);
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  // Check PIN on mount
  useEffect(() => {
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    setHasExistingPin(!!storedPin);

    const verifiedAt = localStorage.getItem(PIN_VERIFIED_KEY);
    if (verifiedAt && storedPin) {
      const elapsed = Date.now() - parseInt(verifiedAt);
      if (elapsed < PIN_EXPIRY_MS) {
        setPinVerified(true);
      }
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!user || !pinVerified) return;

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
        // Auto-expand all institutions
        setExpandedInstitutions(new Set(data.institutions?.map((i: Institution) => i.itemId) || []));
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, pinVerified]);

  const fetchTransactions = useCallback(async () => {
    if (!user || !pinVerified) return;

    setLoadingTransactions(true);
    try {
      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      const response = await fetch("/api/plaid/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          startDate,
          endDate,
          accountIds: selectedAccount ? [selectedAccount] : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [user, pinVerified, dateRange, selectedAccount]);

  useEffect(() => {
    if (pinVerified) {
      fetchAccounts();
    }
  }, [pinVerified, fetchAccounts]);

  useEffect(() => {
    if (pinVerified && accounts.length > 0) {
      fetchTransactions();
    }
  }, [pinVerified, accounts.length, fetchTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
    fetchTransactions();
  };

  const handleLinkSuccess = () => {
    setShowLinkButton(false);
    fetchAccounts();
  };

  const handleDeleteInstitution = async (itemId: string) => {
    if (!user) return;

    setDeletingItem(itemId);
    try {
      const response = await fetch("/api/plaid/delete-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, itemId }),
      });

      if (response.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error deleting institution:", error);
    } finally {
      setDeletingItem(null);
    }
  };

  const toggleInstitution = (itemId: string) => {
    setExpandedInstitutions((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Calculate totals
  const totals = accounts.reduce(
    (acc, account) => {
      const balance = account.balances.current || 0;
      if (account.type === "depository") acc.cash += balance;
      else if (account.type === "credit") acc.credit += balance;
      else if (account.type === "investment") acc.investments += balance;
      return acc;
    },
    { cash: 0, credit: 0, investments: 0 }
  );
  const netWorth = totals.cash + totals.investments - totals.credit;

  // Group transactions by date
  const transactionsByDate = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
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
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>Accounts</h1>
        <div className="glass" style={{ padding: "60px", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ color: "var(--foreground-muted)" }}>Please sign in to view your accounts</p>
        </div>
      </div>
    );
  }

  if (!pinVerified) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
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
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>Accounts</h1>
        <PinEntry onVerify={setPinVerified} hasExistingPin={hasExistingPin} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "24px" }}>
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
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Accounts</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              backgroundColor: "transparent",
              color: "var(--foreground)",
              fontSize: "13px",
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw style={{ width: "14px", height: "14px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          {showLinkButton ? (
            <PlaidLinkButton userId={user.uid} onSuccess={handleLinkSuccess} />
          ) : (
            <button
              onClick={() => setShowLinkButton(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Link Account
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
          <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass" style={{ padding: "60px", borderRadius: "12px", textAlign: "center" }}>
          <Wallet style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>No Accounts Linked</h2>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
            Connect your bank accounts to view balances and transactions
          </p>
          {showLinkButton ? (
            <PlaidLinkButton userId={user.uid} onSuccess={handleLinkSuccess} />
          ) : (
            <button
              onClick={() => setShowLinkButton(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "18px", height: "18px" }} />
              Link Your First Account
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Left Column - Accounts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Net Worth Card */}
            <div className="glass" style={{ padding: "24px", borderRadius: "12px" }}>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px" }}>Net Worth</div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", marginBottom: "20px" }}>
                {formatCurrency(netWorth)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#22c55e", marginBottom: "4px" }}>Cash</div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>{formatCurrency(totals.cash)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#3b82f6", marginBottom: "4px" }}>Investments</div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>{formatCurrency(totals.investments)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#ef4444", marginBottom: "4px" }}>Credit</div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>{formatCurrency(totals.credit)}</div>
                </div>
              </div>
            </div>

            {/* Institutions & Accounts */}
            {institutions.map((institution) => {
              const institutionAccounts = accounts.filter((a) => a.itemId === institution.itemId);
              const isExpanded = expandedInstitutions.has(institution.itemId);

              return (
                <div key={institution.itemId} className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
                  <div
                    onClick={() => toggleInstitution(institution.itemId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px 20px",
                      cursor: "pointer",
                      borderBottom: isExpanded ? "1px solid var(--glass-border)" : "none",
                    }}
                  >
                    <Building2 style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>{institution.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{institutionAccounts.length} accounts</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Unlink ${institution.name}?`)) {
                          handleDeleteInstitution(institution.itemId);
                        }
                      }}
                      disabled={deletingItem === institution.itemId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {deletingItem === institution.itemId ? (
                        <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronUp style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                    ) : (
                      <ChevronDown style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                    )}
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "12px 16px" }}>
                      {institutionAccounts.map((account) => (
                        <div
                          key={account.accountId}
                          onClick={() => setSelectedAccount(selectedAccount === account.accountId ? null : account.accountId)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            backgroundColor: selectedAccount === account.accountId ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
                            border: selectedAccount === account.accountId ? "1px solid rgba(var(--accent-rgb), 0.3)" : "1px solid transparent",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ color: "var(--foreground-muted)" }}>{getAccountIcon(account.type)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>{account.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                              {account.subtype} {account.mask && `••${account.mask}`}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: account.type === "credit" ? "#ef4444" : "var(--foreground)" }}>
                              {formatCurrency(account.balances.current, account.balances.isoCurrencyCode)}
                            </div>
                            {account.balances.available !== null && account.balances.available !== account.balances.current && (
                              <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                                {formatCurrency(account.balances.available)} available
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column - Transactions */}
          <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>Transactions</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(parseInt(e.target.value))}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "transparent",
                    color: "var(--foreground)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
              {selectedAccount && (
                <button
                  onClick={() => setSelectedAccount(null)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                    color: "var(--accent)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Clear filter
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
              {loadingTransactions ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                  <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                  No transactions found
                </div>
              ) : (
                Object.entries(transactionsByDate).map(([date, txs]) => (
                  <div key={date} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Calendar style={{ width: "12px", height: "12px", color: "var(--foreground-muted)" }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)" }}>{formatDate(date)}</span>
                    </div>
                    {txs.map((tx) => (
                      <div
                        key={tx.transactionId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--foreground-muted)",
                          }}
                        >
                          {tx.logoUrl ? (
                            <img src={tx.logoUrl} alt="" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
                          ) : (
                            getCategoryIcon(tx.category)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tx.merchantName || tx.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                            {tx.accountName} {tx.pending && "• Pending"}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: tx.amount < 0 ? "#22c55e" : "var(--foreground)",
                          }}
                        >
                          {tx.amount < 0 ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
