"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, Plus, Loader2, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IntelToolNav } from "@/components/IntelToolNav";
import { RemindersBanner } from "@/components/RemindersBanner";
import { Project } from "@/types/relationship-intel";

export default function RelationshipIntelPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKeywords, setNewProjectKeywords] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/relationship-intel/projects/list");
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const keywords = newProjectKeywords.split(",").map(k => k.trim()).filter(Boolean);
      const response = await fetch("/api/relationship-intel/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          keywords,
          tags: ["investor", "alumni", "coach", "media"],
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewProjectName("");
        setNewProjectKeywords("");
        loadProjects();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", width: "100%" }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
          <RemindersBanner />
          <IntelToolNav current="relationship-intel" />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <Network style={{ width: "32px", height: "32px", color: "#14b8a6" }} />
                <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                  Relationship Intelligence
                </h1>
              </div>
              <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
                Track and analyze your professional relationships across projects
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              New Project
            </button>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "#14b8a6", animation: "spin 1s linear infinite" }} />
            </div>
          ) : projects.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
              }}
            >
              <Network style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No projects yet
              </h3>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
                Create your first project to start tracking relationships
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Create Project
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/tools/relationship-intel/${project.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "24px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                        {project.name}
                      </h3>
                      <ArrowRight style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <Users style={{ width: "16px", height: "16px", color: "#14b8a6" }} />
                      <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                        {project.contactCount} contacts
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>
              Create New Project
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Cinderella Project"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={newProjectKeywords}
                onChange={(e) => setNewProjectKeywords(e.target.value)}
                placeholder="e.g., cinderella, ncaa, college basketball"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: creating || !newProjectName.trim()
                    ? "rgba(20, 184, 166, 0.3)"
                    : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: creating || !newProjectName.trim() ? "not-allowed" : "pointer",
                }}
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
