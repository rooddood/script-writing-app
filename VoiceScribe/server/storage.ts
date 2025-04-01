import { documents, type Document, type InsertDocument, type DocumentContent } from "@shared/schema";

export interface IStorage {
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private documents: Map<number, Document>;
  currentId: number;

  constructor() {
    this.documents = new Map();
    this.currentId = 1;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) {
      return undefined;
    }
    
    const updatedDocument: Document = { 
      ...existingDocument, 
      ...document,
      updatedAt: new Date()
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
}

export const storage = new MemStorage();
