// Firestore helper functions for Relationship Intel

import { getAdminFirestore } from "./firebase-admin";
import { Project, Contact, Interaction, ProjectMetadata } from "@/types/relationship-intel";

const COLLECTION_ROOT = "dashboard/relationshipIntel/projects";

function getDb() {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error("Firebase Admin is not initialized. Check your environment variables.");
  }
  return db;
}

// Helper to convert Firestore Timestamp or Date to Date
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value._seconds) {
    // Firestore Timestamp object
    return new Date(value._seconds * 1000);
  }
  return new Date();
}

// Project operations
export async function listProjects(): Promise<Project[]> {
  try {
    const db = getDb();
    const projectsRef = db.collection(COLLECTION_ROOT);
    const snapshot = await projectsRef.get();

    const projects: Project[] = [];
    for (const doc of snapshot.docs) {
      const metadata = await doc.ref.collection("metadata").doc("info").get();
      const metadataData = metadata.data() as ProjectMetadata;

      // Count contacts
      const contactsSnapshot = await doc.ref.collection("contacts").get();

      projects.push({
        id: doc.id,
        name: metadataData?.name || doc.id,
        createdAt: toDate(metadataData?.createdAt),
        updatedAt: toDate(metadataData?.updatedAt),
        keywords: metadataData?.keywords || [],
        tags: metadataData?.tags || [],
        contactCount: contactsSnapshot.size,
      });
    }

    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error("Error listing projects:", error);
    return [];
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const db = getDb();
    const projectRef = db.collection(COLLECTION_ROOT).doc(projectId);

    console.log(`[getProject] Looking for project: ${projectId}`);
    const metadataDoc = await projectRef.collection("metadata").doc("info").get();

    if (!metadataDoc.exists) {
      console.log(`[getProject] Metadata not found for project: ${projectId}`);
      return null;
    }

    const metadataData = metadataDoc.data() as ProjectMetadata;
    console.log(`[getProject] Found project: ${metadataData.name}`);

    const contactsSnapshot = await projectRef.collection("contacts").get();

    return {
      id: projectId,
      name: metadataData.name,
      createdAt: toDate(metadataData.createdAt),
      updatedAt: toDate(metadataData.updatedAt),
      keywords: metadataData.keywords || [],
      tags: metadataData.tags || [],
      contactCount: contactsSnapshot.size,
    };
  } catch (error) {
    console.error(`[getProject] Error getting project ${projectId}:`, error);
    return null;
  }
}

export async function createProject(name: string, keywords: string[], tags: string[]): Promise<string> {
  try {
    const db = getDb();
    const projectId = name.toLowerCase().replace(/\s+/g, "-");
    const projectRef = db.collection(COLLECTION_ROOT).doc(projectId);

    console.log(`[createProject] Creating project: ${name} (ID: ${projectId})`);

    const metadata: ProjectMetadata = {
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      keywords,
      tags,
    };

    // Create the project document (placeholder so it shows up in queries)
    console.log(`[createProject] Writing project document...`);
    await projectRef.set({ created: new Date() });

    // Store metadata in subcollection
    console.log(`[createProject] Writing metadata...`);
    await projectRef.collection("metadata").doc("info").set(metadata);

    console.log(`[createProject] Project created successfully: ${projectId}`);
    return projectId;
  } catch (error) {
    console.error(`[createProject] Error creating project:`, error);
    throw error;
  }
}

// Contact operations
export async function listContacts(
  projectId: string,
  search?: string,
  tags?: string[],
  sortBy: "name" | "lastContact" | "interactionCount" = "lastContact"
): Promise<Contact[]> {
  try {
    const db = getDb();
    const contactsRef = db.collection(COLLECTION_ROOT).doc(projectId).collection("contacts");
    let query = contactsRef.limit(1000);

    const snapshot = await query.get();
    let contacts: Contact[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        email: doc.id,
        name: data.name || doc.id,
        company: data.company,
        tags: data.tags || [],
        lastContact: data.lastContact?.toDate() || new Date(),
        firstContact: data.firstContact?.toDate() || new Date(),
        interactionCount: data.interactionCount || 0,
      };
    });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        (c.company && c.company.toLowerCase().includes(searchLower))
      );
    }

    if (tags && tags.length > 0) {
      contacts = contacts.filter(c =>
        tags.some(tag => c.tags.includes(tag))
      );
    }

    // Sort
    contacts.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "lastContact":
          return b.lastContact.getTime() - a.lastContact.getTime();
        case "interactionCount":
          return b.interactionCount - a.interactionCount;
        default:
          return 0;
      }
    });

    return contacts;
  } catch (error) {
    console.error("Error listing contacts:", error);
    return [];
  }
}

export async function getContact(projectId: string, email: string): Promise<Contact | null> {
  try {
    const db = getDb();
    const contactRef = db.collection(COLLECTION_ROOT)
      .doc(projectId)
      .collection("contacts")
      .doc(email);

    const doc = await contactRef.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      email,
      name: data?.name || email,
      company: data?.company,
      tags: data?.tags || [],
      lastContact: data?.lastContact?.toDate() || new Date(),
      firstContact: data?.firstContact?.toDate() || new Date(),
      interactionCount: data?.interactionCount || 0,
    };
  } catch (error) {
    console.error("Error getting contact:", error);
    return null;
  }
}

export async function createOrUpdateContact(
  projectId: string,
  email: string,
  data: Partial<Contact>
): Promise<void> {
  const db = getDb();
  const contactRef = db.collection(COLLECTION_ROOT)
    .doc(projectId)
    .collection("contacts")
    .doc(email);

  const existing = await contactRef.get();

  if (existing.exists) {
    await contactRef.update({
      ...data,
      lastContact: data.lastContact || new Date(),
    });
  } else {
    await contactRef.set({
      name: data.name || email,
      email,
      company: data.company || "",
      tags: data.tags || [],
      firstContact: new Date(),
      lastContact: new Date(),
      interactionCount: 0,
    });
  }
}

// Interaction operations
export async function listInteractions(
  projectId: string,
  email: string
): Promise<Interaction[]> {
  try {
    const db = getDb();
    const interactionsRef = db.collection(COLLECTION_ROOT)
      .doc(projectId)
      .collection("contacts")
      .doc(email)
      .collection("interactions");

    const snapshot = await interactionsRef.orderBy("date", "desc").limit(500).get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        date: data.date?.toDate() || new Date(),
        subject: data.subject || "",
        summary: data.summary || "",
        content: data.content,
        emailId: data.emailId,
        eventId: data.eventId,
        threadId: data.threadId,
        from: data.from,
        to: data.to,
        cc: data.cc,
        attendees: data.attendees,
      };
    });
  } catch (error) {
    console.error("Error listing interactions:", error);
    return [];
  }
}

export async function addInteraction(
  projectId: string,
  email: string,
  interaction: Omit<Interaction, "id">
): Promise<string> {
  const db = getDb();
  const contactRef = db.collection(COLLECTION_ROOT)
    .doc(projectId)
    .collection("contacts")
    .doc(email);

  const interactionRef = await contactRef.collection("interactions").add({
    ...interaction,
    date: interaction.date,
  });

  // Update contact interaction count and last contact
  const contact = await contactRef.get();
  const currentCount = contact.data()?.interactionCount || 0;

  await contactRef.update({
    interactionCount: currentCount + 1,
    lastContact: interaction.date,
  });

  return interactionRef.id;
}
