"use client";

import { useState, useEffect } from "react";
import { GripVertical, Eye, EyeOff, Pencil, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ToolConfig {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  color: string;
  category: string;
}

// All tools organized by category - matching the homepage
const ALL_TOOLS: { [key: string]: ToolConfig[] } = {
  Intelligence: [
    { id: "curate", name: "Curate", visible: true, order: 0, color: "#8b5cf6", category: "Intelligence" },
    { id: "l3d", name: "L3D", visible: true, order: 1, color: "#10b981", category: "Intelligence" },
    { id: "deep", name: "Deep Search", visible: true, order: 2, color: "#6366f1", category: "Intelligence" },
    { id: "dark", name: "Dark Search", visible: true, order: 3, color: "#dc2626", category: "Intelligence" },
  ],
  Communication: [
    { id: "emails", name: "Emails", visible: true, order: 0, color: "#3b82f6", category: "Communication" },
    { id: "calendar", name: "Calendar", visible: true, order: 1, color: "#10b981", category: "Communication" },
    { id: "contacts", name: "Contacts", visible: true, order: 2, color: "#8b5cf6", category: "Communication" },
  ],
  Content: [
    { id: "files", name: "Files", visible: true, order: 0, color: "#6366f1", category: "Content" },
    { id: "notes", name: "Notes", visible: true, order: 1, color: "#a78bfa", category: "Content" },
    { id: "raindrop", name: "Bookmarks", visible: true, order: 2, color: "#06b6d4", category: "Content" },
    { id: "news", name: "News", visible: true, order: 3, color: "#64748b", category: "Content" },
    { id: "inoreader", name: "RSS", visible: true, order: 4, color: "#10b981", category: "Content" },
    { id: "spotify", name: "Spotify", visible: true, order: 5, color: "#1DB954", category: "Content" },
  ],
  "Business Intelligence": [
    { id: "accounts", name: "Accounts", visible: true, order: 0, color: "#64748b", category: "Business Intelligence" },
    { id: "market", name: "Market", visible: true, order: 1, color: "#3b82f6", category: "Business Intelligence" },
    { id: "trending", name: "Trending", visible: true, order: 2, color: "#14b8a6", category: "Business Intelligence" },
    { id: "business-info", name: "Business Info", visible: true, order: 3, color: "#8b5cf6", category: "Business Intelligence" },
    { id: "corporate-info", name: "Corporate", visible: true, order: 4, color: "#10b981", category: "Business Intelligence" },
    { id: "contact-finder", name: "Contact Finder", visible: true, order: 5, color: "#6366f1", category: "Business Intelligence" },
    { id: "visual-rosters", name: "Rosters", visible: true, order: 6, color: "#3b82f6", category: "Business Intelligence" },
    { id: "image-lookup", name: "Image Lookup", visible: true, order: 7, color: "#a78bfa", category: "Business Intelligence" },
  ],
};

export function ToolSettings() {
  const { user } = useAuth();
  const [tools, setTools] = useState<{ [key: string]: ToolConfig[] }>(ALL_TOOLS);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saved, setSaved] = useState(false);

  // Load from Firebase/localStorage
  useEffect(() => {
    if (!user) return;
    const key = `tools-config-${user.uid}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setTools(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load tool config", e);
      }
    }
  }, [user]);

  // Save to localStorage whenever tools change
  useEffect(() => {
    if (!user) return;
    const key = `tools-config-${user.uid}`;
    localStorage.setItem(key, JSON.stringify(tools));
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [tools, user]);

  const updateTool = (category: string, toolId: string, updates: Partial<ToolConfig>) => {
    setTools(prev => ({
      ...prev,
      [category]: prev[category].map(t =>
        t.id === toolId ? { ...t, ...updates } : t
      )
    }));
  };

  const toggleVisibility = (category: string, toolId: string) => {
    updateTool(category, toolId, { visible: !tools[category].find(t => t.id === toolId)?.visible });
  };

  const startEdit = (category: string, toolId: string) => {
    const tool = tools[category].find(t => t.id === toolId);
    if (tool) {
      setEditingTool(toolId);
      setEditName(tool.name);
      setEditColor(tool.color);
    }
  };

  const saveEdit = (category: string) => {
    if (editingTool && editName.trim()) {
      updateTool(category, editingTool, { name: editName, color: editColor });
      setEditingTool(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "var(--foreground)",
          marginBottom: "8px",
        }}>
          Tools Management
        </h3>
        <p style={{
          fontSize: "13px",
          color: "var(--foreground-muted)",
          marginBottom: "16px",
        }}>
          Customize tool visibility, order, names, and colors. Changes are saved automatically.
        </p>
        {saved && (
          <div style={{
            padding: "8px 12px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "6px",
            color: "#86efac",
            fontSize: "12px",
          }}>
            ✓ Saved
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {Object.entries(tools).map(([category, categoryTools]) => (
          <div
            key={category}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h4 style={{
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--foreground-muted)",
              marginBottom: "12px",
              opacity: 0.8,
            }}>
              {category}
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {categoryTools.map((tool) => (
                <div
                  key={tool.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    opacity: tool.visible ? 1 : 0.5,
                  }}
                >
                  {/* Drag handle */}
                  <GripVertical size={16} style={{ color: "var(--foreground-muted)", cursor: "grab" }} />

                  {/* Color indicator */}
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: tool.color,
                      cursor: "pointer",
                      position: "relative",
                    }}
                    title="Click to change color"
                  />

                  {/* Tool info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingTool === tool.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveEdit(category)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit(category)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "4px",
                          color: "var(--foreground)",
                          fontSize: "14px",
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: "14px",
                        color: "var(--foreground)",
                        fontWeight: "500",
                      }}>
                        {tool.name}
                      </span>
                    )}
                  </div>

                  {/* Edit button */}
                  {editingTool !== tool.id && (
                    <button
                      onClick={() => startEdit(category, tool.id)}
                      style={{
                        padding: "6px 8px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "4px",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Edit name and color"
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleVisibility(category, tool.id)}
                    style={{
                      padding: "6px 8px",
                      background: tool.visible ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      border: tool.visible ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      color: tool.visible ? "#86efac" : "var(--foreground-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title={tool.visible ? "Hide tool" : "Show tool"}
                  >
                    {tool.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
