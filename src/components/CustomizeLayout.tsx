"use client";

import { useState, useEffect } from "react";
import { GripVertical, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Type definitions
interface LayoutItem {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  color?: string; // Hex color for the tool
}

interface LayoutConfig {
  searchSources: LayoutItem[];
  intelTools: LayoutItem[];
  quickAccessTools: LayoutItem[];
}

// Default configurations
const DEFAULT_SEARCH_SOURCES: LayoutItem[] = [
  { id: "google", name: "Google", visible: true, order: 0 },
  { id: "images", name: "Images", visible: true, order: 1 },
  { id: "news", name: "News", visible: true, order: 2 },
  { id: "trends", name: "Trends", visible: true, order: 3 },
  { id: "duck", name: "Duck", visible: true, order: 4 },
  { id: "wikipedia", name: "Wikipedia", visible: true, order: 5 },
  { id: "grokipedia", name: "Grokipedia", visible: true, order: 6 },
  { id: "x", name: "X", visible: true, order: 7 },
  { id: "youtube", name: "Youtube", visible: true, order: 8 },
  { id: "rumble", name: "Rumble", visible: true, order: 9 },
  { id: "amazon", name: "Amazon", visible: true, order: 10 },
  { id: "contacts", name: "Contacts", visible: true, order: 11 },
  { id: "visuals", name: "Visuals", visible: true, order: 12 },
  { id: "grok", name: "Grok", visible: true, order: 13 },
  { id: "gemini", name: "Gemini", visible: true, order: 14 },
  { id: "claude", name: "Claude", visible: true, order: 15 },
  { id: "chatgpt", name: "ChatGPT", visible: true, order: 16 },
];

const DEFAULT_INTEL_TOOLS: LayoutItem[] = [
  { id: "curate", name: "Curate", visible: true, order: 0, color: "#8b5cf6" },
  { id: "l3d", name: "Last 30 Days", visible: true, order: 1, color: "#10b981" },
  { id: "deep-search", name: "Deep Search", visible: true, order: 2, color: "#3b82f6" },
  { id: "dark-search", name: "Dark Search", visible: true, order: 3, color: "#ef4444" },
];

const DEFAULT_QUICK_ACCESS: LayoutItem[] = [
  { id: "emails", name: "Emails", visible: true, order: 0, color: "#3b82f6" },
  { id: "calendar", name: "Calendar", visible: true, order: 1, color: "#10b981" },
  { id: "contacts", name: "Contacts", visible: true, order: 2, color: "#f59e0b" },
  { id: "files", name: "Files", visible: true, order: 3, color: "#8b5cf6" },
  { id: "notes", name: "Notes", visible: true, order: 4, color: "#ec4899" },
  { id: "raindrop", name: "Bookmarks", visible: true, order: 5, color: "#06b6d4" },
  { id: "spotify", name: "Spotify", visible: true, order: 6, color: "#10b981" },
  { id: "news", name: "News", visible: true, order: 7, color: "#f59e0b" },
  { id: "market", name: "Market", visible: true, order: 8, color: "#ef4444" },
  { id: "inoreader", name: "RSS", visible: true, order: 9, color: "#10b981" },
  { id: "trending", name: "Trending", visible: true, order: 10, color: "#f59e0b" },
  { id: "business-info", name: "Business Info", visible: true, order: 11, color: "#8b5cf6" },
  { id: "visual-rosters", name: "Rosters", visible: true, order: 12, color: "#3b82f6" },
  { id: "corporate-info", name: "Corporate", visible: true, order: 13, color: "#10b981" },
  { id: "contact-finder", name: "Contact Finder", visible: true, order: 14, color: "#f59e0b" },
  { id: "image-lookup", name: "Image Lookup", visible: true, order: 15, color: "#ec4899" },
  { id: "accounts", name: "Accounts", visible: true, order: 16, color: "#64748b" },
];

export function CustomizeLayout() {
  const { user } = useAuth();
  const [config, setConfig] = useState<LayoutConfig>({
    searchSources: DEFAULT_SEARCH_SOURCES,
    intelTools: DEFAULT_INTEL_TOOLS,
    quickAccessTools: DEFAULT_QUICK_ACCESS,
  });

  // Load from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`layout-config-${user.uid}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Merge with defaults to ensure all items have colors
        const mergeWithDefaults = (items: LayoutItem[], defaults: LayoutItem[]) => {
          return defaults.map(defaultItem => {
            const savedItem = items?.find(i => i.id === defaultItem.id);
            return savedItem ? { ...defaultItem, ...savedItem } : defaultItem;
          });
        };
        
        setConfig({
          searchSources: parsed.searchSources 
            ? mergeWithDefaults(parsed.searchSources, DEFAULT_SEARCH_SOURCES)
            : DEFAULT_SEARCH_SOURCES,
          intelTools: parsed.intelTools 
            ? mergeWithDefaults(parsed.intelTools, DEFAULT_INTEL_TOOLS)
            : DEFAULT_INTEL_TOOLS,
          quickAccessTools: parsed.quickAccessTools 
            ? mergeWithDefaults(parsed.quickAccessTools, DEFAULT_QUICK_ACCESS)
            : DEFAULT_QUICK_ACCESS,
        });
      } catch (e) {
        console.error("Failed to parse layout config:", e);
      }
    }
  }, [user]);

  // Save to localStorage
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`layout-config-${user.uid}`, JSON.stringify(config));
  }, [config, user]);

  const toggleVisibility = (category: keyof LayoutConfig, id: string) => {
    setConfig(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, visible: !item.visible } : item
      ),
    }));
  };

  const updateColor = (category: keyof LayoutConfig, id: string, color: string) => {
    setConfig(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, color } : item
      ),
    }));
  };

  const moveItem = (category: keyof LayoutConfig, id: string, direction: "up" | "down") => {
    setConfig(prev => {
      const items = [...prev[category]].sort((a, b) => a.order - b.order);
      const index = items.findIndex(item => item.id === id);
      
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === items.length - 1)
      ) {
        return prev;
      }

      const newIndex = direction === "up" ? index - 1 : index + 1;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      
      // Reassign orders
      items.forEach((item, i) => {
        item.order = i;
      });

      return {
        ...prev,
        [category]: items,
      };
    });
  };

  const resetToDefaults = () => {
    if (confirm("Reset all layout customizations to defaults?")) {
      setConfig({
        searchSources: DEFAULT_SEARCH_SOURCES,
        intelTools: DEFAULT_INTEL_TOOLS,
        quickAccessTools: DEFAULT_QUICK_ACCESS,
      });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <LayoutGrid style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Customize Layout
            </h2>
          </div>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", margin: 0 }}>
            Reorder and hide dashboard elements
          </p>
        </div>
        <button
          onClick={resetToDefaults}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--glass-border)",
            borderRadius: "8px",
            color: "var(--foreground-muted)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Search Sources */}
      <CategorySection
        title="Search Sources"
        items={config.searchSources}
        onToggleVisibility={(id) => toggleVisibility("searchSources", id)}
        onMove={(id, dir) => moveItem("searchSources", id, dir)}
        onUpdateColor={(id, color) => updateColor("searchSources", id, color)}
      />

      {/* Intel Tools */}
      <CategorySection
        title="Intel Tools"
        items={config.intelTools}
        onToggleVisibility={(id) => toggleVisibility("intelTools", id)}
        onMove={(id, dir) => moveItem("intelTools", id, dir)}
        onUpdateColor={(id, color) => updateColor("intelTools", id, color)}
      />

      {/* Quick Access Tools */}
      <CategorySection
        title="Quick Access Tools"
        items={config.quickAccessTools}
        onToggleVisibility={(id) => toggleVisibility("quickAccessTools", id)}
        onMove={(id, dir) => moveItem("quickAccessTools", id, dir)}
        onUpdateColor={(id, color) => updateColor("quickAccessTools", id, color)}
      />
    </div>
  );
}

function CategorySection({
  title,
  items,
  onToggleVisibility,
  onMove,
  onUpdateColor,
}: {
  title: string;
  items: LayoutItem[];
  onToggleVisibility: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onUpdateColor: (id: string, color: string) => void;
}) {
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div
      className="glass"
      style={{
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--foreground)",
          marginBottom: "16px",
        }}
      >
        {title}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sortedItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--glass-border)",
              opacity: item.visible ? 1 : 0.5,
            }}
          >
            {/* Drag handle (visual only) */}
            <GripVertical
              style={{
                width: "16px",
                height: "16px",
                color: "var(--foreground-muted)",
                cursor: "grab",
              }}
            />

            {/* Item name */}
            <div style={{ flex: 1, fontSize: "14px", color: "var(--foreground)" }}>
              {item.name}
            </div>

            {/* Color picker */}
            <input
              type="color"
              value={item.color || "#3b82f6"}
              onChange={(e) => onUpdateColor(item.id, e.target.value)}
              title="Choose color"
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid var(--glass-border)",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: "transparent",
              }}
            />

            {/* Move buttons */}
            <button
              onClick={() => onMove(item.id, "up")}
              disabled={index === 0}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                cursor: index === 0 ? "not-allowed" : "pointer",
                opacity: index === 0 ? 0.3 : 1,
              }}
            >
              ↑
            </button>
            <button
              onClick={() => onMove(item.id, "down")}
              disabled={index === sortedItems.length - 1}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                cursor: index === sortedItems.length - 1 ? "not-allowed" : "pointer",
                opacity: index === sortedItems.length - 1 ? 0.3 : 1,
              }}
            >
              ↓
            </button>

            {/* Visibility toggle */}
            <button
              onClick={() => onToggleVisibility(item.id)}
              style={{
                padding: "6px",
                backgroundColor: item.visible
                  ? "rgba(var(--accent-rgb), 0.1)"
                  : "rgba(255, 255, 255, 0.05)",
                border: item.visible
                  ? "1px solid var(--accent)"
                  : "1px solid var(--glass-border)",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={item.visible ? "Hide" : "Show"}
            >
              {item.visible ? (
                <Eye style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
              ) : (
                <EyeOff style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
