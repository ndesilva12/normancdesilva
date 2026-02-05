"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Mail, Calendar, Clock, ChevronDown, Search, Filter } from "lucide-react";

export default function RelationshipIntelPage() {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/relationship-intel/projects/cinderella/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Relationship Intel</h1>
              <p className="text-gray-400">Track and manage professional relationships</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm">
                {contacts.length} contacts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-white/[0.08] bg-black/20">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No contacts found</div>
        ) : (
          <div className="grid gap-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-lg cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{contact.name}</h3>
                    <p className="text-sm text-gray-400">{contact.email}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {contact.interaction_count || 0} interactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50" onClick={() => setSelectedContact(null)}>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.08] p-6">
              <h2 className="text-2xl font-semibold mb-1">{selectedContact.name}</h2>
              <p className="text-sm text-gray-400">{selectedContact.email}</p>
            </div>
            <div className="p-6">
              <p className="text-gray-400">Contact details and interaction history would appear here.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
