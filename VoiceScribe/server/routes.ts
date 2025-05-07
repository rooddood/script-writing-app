import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { Router } from 'express';
import { spawn } from 'child_process';

const router = Router();

router.post('/mcp', (req, res) => {
  const { command, args } = req.body;

  const subprocess = spawn('python', ['-m', 'pip', 'install', '-r', '/Users/kylerood/Documents/GitHub/script-writing-app/requirements.txt']);

  subprocess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Failed to install requirements. Process exited with code ${code}`);
      return res.status(500).json({ error: 'Failed to install requirements' });
    }

    const mcpSubprocess = spawn('python', ['/Users/kylerood/Documents/GitHub/Office-Word-MCP-Server/word_mcp_server.py']);

    mcpSubprocess.stdin.write(
      JSON.stringify({ command, args }) + '\n'
    );
    mcpSubprocess.stdin.end();

    let responseData = '';
    let errorOccurred = false;

    mcpSubprocess.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    mcpSubprocess.stdout.on('end', () => {
      if (!errorOccurred) {
        try {
          const response = JSON.parse(responseData);
          res.json(response);
        } catch (error) {
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to parse MCP server response' });
          }
        }
      }
    });

    mcpSubprocess.stderr.on('data', (data) => {
      console.error('MCP server error:', data.toString());
      errorOccurred = true;
      if (!res.headersSent) {
        res.status(500).json({ error: data.toString() });
      }
    });

    mcpSubprocess.on('close', (code) => {
      if (code !== 0 && !errorOccurred && !res.headersSent) {
        res.status(500).json({ error: `MCP server process exited with code ${code}` });
      }
    });
  });
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Documents API routes
  app.get("/api/documents", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve documents" });
    }
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document" });
    }
  });

  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      const result = insertDocumentSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const newDocument = await storage.createDocument(result.data);
      res.status(201).json(newDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const result = insertDocumentSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const updatedDocument = await storage.updateDocument(id, result.data);
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.use('/api', router);

  const httpServer = createServer(app);
  return httpServer;
}
