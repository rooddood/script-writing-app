import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Document, DocumentContent, DocumentFormat, ScriptElement } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Command history interface
export interface CommandHistoryItem {
  type: string;
  content: string;
  timestamp: Date;
}

interface DocumentContextProps {
  activeDocument: Document | null;
  documentContent: DocumentContent;
  isRecording: boolean;
  documentFormat: DocumentFormat;
  commandHistory: CommandHistoryItem[];
  interimText: string | null;
  setActiveDocument: (document: Document | null) => void;
  setDocumentContent: (content: DocumentContent) => void;
  setIsRecording: (isRecording: boolean) => void;
  setDocumentFormat: (format: DocumentFormat) => void;
  setInterimText: (text: string | null) => void;
  saveDocument: () => Promise<void>;
  addElement: (element: ScriptElement) => void;
  addToCommandHistory: (commandType: string, content: string) => void;
  clearCommandHistory: () => void;
  updateElement: (index: number, element: ScriptElement) => void;
  removeElement: (index: number) => void;
}

const defaultContent: DocumentContent = { elements: [] };

const DocumentContext = createContext<DocumentContextProps | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  // Initialize document content from localStorage if available
  const [documentContent, setDocumentContent] = useState<DocumentContent>(() => {
    const savedContent = localStorage.getItem('documentContent');
    return savedContent ? JSON.parse(savedContent) : defaultContent;
  });
  const [isRecording, setIsRecording] = useState(false);
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>('script');
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [interimText, setInterimText] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize with empty document if none exists
  useEffect(() => {
    if (!activeDocument) {
      const content: DocumentContent = { elements: [] };
      const newDoc: Partial<Document> = {
        title: 'Untitled Document',
        content: content as any,
        format: 'script',
      };
      // Only set document content if localStorage doesn't have any content
      if (documentContent.elements.length === 0) {
        setDocumentContent(content);
      }
      // We don't create a document on server until user explicitly saves
    }
  }, [activeDocument, documentContent.elements.length]);
  
  // Save document content to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('documentContent', JSON.stringify(documentContent));
  }, [documentContent]);

  // Add a new element to the document content
  const addElement = (element: ScriptElement) => {
    setDocumentContent(prev => ({
      elements: [...prev.elements, element]
    }));
  };

  // Update an existing element
  const updateElement = (index: number, element: ScriptElement) => {
    setDocumentContent(prev => {
      const newElements = [...prev.elements];
      if (index >= 0 && index < newElements.length) {
        newElements[index] = element;
      }
      return { elements: newElements };
    });
  };

  // Remove an element
  const removeElement = (index: number) => {
    setDocumentContent(prev => {
      const newElements = [...prev.elements];
      if (index >= 0 && index < newElements.length) {
        newElements.splice(index, 1);
      }
      return { elements: newElements };
    });
  };
  
  // Add to command history
  const addToCommandHistory = (commandType: string, content: string) => {
    setCommandHistory(prev => [
      ...prev, 
      { 
        type: commandType, 
        content: content,
        timestamp: new Date() 
      }
    ]);
  };
  
  // Clear command history
  const clearCommandHistory = () => {
    setCommandHistory([]);
  };

  // Save the document to the server
  const saveDocument = async () => {
    try {
      if (activeDocument?.id) {
        // Update existing document
        await apiRequest('PUT', `/api/documents/${activeDocument.id}`, {
          content: documentContent,
          format: documentFormat
        });
        toast({
          title: "Document saved",
          description: "Your document has been updated successfully."
        });
      } else {
        // Create new document
        const response = await apiRequest('POST', '/api/documents', {
          title: 'Untitled Document',
          content: documentContent,
          format: documentFormat
        });
        const newDocument = await response.json();
        setActiveDocument(newDocument);
        toast({
          title: "Document created",
          description: "Your document has been saved successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        activeDocument,
        documentContent,
        isRecording,
        documentFormat,
        commandHistory,
        interimText,
        setActiveDocument,
        setDocumentContent,
        setIsRecording,
        setDocumentFormat,
        setInterimText,
        saveDocument,
        addElement,
        addToCommandHistory,
        clearCommandHistory,
        updateElement,
        removeElement
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
