import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface TagCategory {
  id: string;
  name: string;
  color: string;
  options: string[];
}

export interface RelationshipMetadata {
  contactId: string;
  contactEmail: string;
  contactName: string;
  notes: string;
  tags: { [categoryId: string]: string }; // categoryId -> selected value
  customFields: { [key: string]: any };
  lastUpdated: any;
  createdAt: any;
}

const RELATIONSHIPS_COLLECTION = "relationships";
const TAG_CATEGORIES_COLLECTION = "tag_categories";

// Default tag categories
const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  {
    id: "interest_level",
    name: "Interest Level",
    color: "#10b981",
    options: ["Hot", "Warm", "Cold", "Prospect"],
  },
  {
    id: "industry",
    name: "Industry",
    color: "#3b82f6",
    options: ["Tech", "Finance", "Real Estate", "Sports", "Healthcare", "Other"],
  },
  {
    id: "relationship_type",
    name: "Relationship Type",
    color: "#8b5cf6",
    options: ["Business", "Investor", "Partner", "Friend", "Family", "Advisor"],
  },
  {
    id: "priority",
    name: "Priority",
    color: "#f59e0b",
    options: ["High", "Medium", "Low"],
  },
];

// Get relationship metadata for a contact
export async function getRelationshipMetadata(
  contactId: string
): Promise<RelationshipMetadata | null> {
  if (!db) {
    console.error("Firestore not initialized");
    return null;
  }

  try {
    const docRef = doc(db, RELATIONSHIPS_COLLECTION, contactId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as RelationshipMetadata;
    }
    return null;
  } catch (error) {
    console.error("Error getting relationship metadata:", error);
    return null;
  }
}

// Save or update relationship metadata
export async function saveRelationshipMetadata(
  data: Partial<RelationshipMetadata> & { contactId: string }
): Promise<boolean> {
  if (!db) {
    console.error("Firestore not initialized");
    return false;
  }

  try {
    const docRef = doc(db, RELATIONSHIPS_COLLECTION, data.contactId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update existing
      await updateDoc(docRef, {
        ...data,
        lastUpdated: serverTimestamp(),
      });
    } else {
      // Create new
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error saving relationship metadata:", error);
    return false;
  }
}

// Get all tag categories
export async function getTagCategories(): Promise<TagCategory[]> {
  if (!db) {
    console.error("Firestore not initialized");
    return DEFAULT_TAG_CATEGORIES;
  }

  try {
    const docRef = doc(db, TAG_CATEGORIES_COLLECTION, "user_categories");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().categories as TagCategory[];
    }

    // Initialize with defaults if not exists
    await setDoc(docRef, {
      categories: DEFAULT_TAG_CATEGORIES,
      lastUpdated: serverTimestamp(),
    });

    return DEFAULT_TAG_CATEGORIES;
  } catch (error) {
    console.error("Error getting tag categories:", error);
    return DEFAULT_TAG_CATEGORIES;
  }
}

// Save tag categories
export async function saveTagCategories(
  categories: TagCategory[]
): Promise<boolean> {
  if (!db) {
    console.error("Firestore not initialized");
    return false;
  }

  try {
    const docRef = doc(db, TAG_CATEGORIES_COLLECTION, "user_categories");
    await setDoc(docRef, {
      categories,
      lastUpdated: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving tag categories:", error);
    return false;
  }
}

// Add a new tag category
export async function addTagCategory(
  category: Omit<TagCategory, "id">
): Promise<string | null> {
  const categories = await getTagCategories();
  const newId = category.name.toLowerCase().replace(/\s+/g, "_");
  
  const newCategory: TagCategory = {
    ...category,
    id: newId,
  };

  categories.push(newCategory);
  const success = await saveTagCategories(categories);
  return success ? newId : null;
}

// Update tag category (add/remove options)
export async function updateTagCategory(
  categoryId: string,
  updates: Partial<TagCategory>
): Promise<boolean> {
  const categories = await getTagCategories();
  const index = categories.findIndex((c) => c.id === categoryId);

  if (index === -1) return false;

  categories[index] = { ...categories[index], ...updates };
  return await saveTagCategories(categories);
}

// Delete tag category
export async function deleteTagCategory(categoryId: string): Promise<boolean> {
  const categories = await getTagCategories();
  const filtered = categories.filter((c) => c.id !== categoryId);
  return await saveTagCategories(filtered);
}
