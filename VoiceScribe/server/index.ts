import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add debug logs to trace server requests and responses
app.use((req, res, next) => {
    console.log("[DEBUG] Incoming Request:", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    const originalSend = res.send;
    res.send = function (body) {
        console.log("[DEBUG] Outgoing Response:", {
            statusCode: res.statusCode,
            body
        });
        return originalSend.call(this, body);
    };
    next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  try {
    const port = 4000; // Port to listen on
    const host = "127.0.0.1"; // Host to bind to

    server.listen(port, host, () => {
      log(`Server is successfully serving on http://${host}:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);

    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Please use a different port.`);
    } else if (error.code === "EACCES") {
      console.error(`Permission denied. You might need elevated privileges to use port ${port}.`);
    } else if (error.code === "ENOTSUP") {
      console.error("The operation is not supported on the specified socket. Check your system configuration.");
    } else {
      console.error("An unexpected error occurred:", error);
    }

    process.exit(1);
  }
})();
