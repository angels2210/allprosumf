import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000; // AI Studio standard port

  // Middleware for JSON
  app.use(express.json());

  // API Routes Placeholder
  // Here you can add your backend logic (models, routes, etc.)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running on 0.0.0.0" });
  });

  // Example proxy-like route if needed, but since we are in the same server, 
  // we can just add the routes here.
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Listen on all network interfaces (0.0.0.0)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Frontend and Backend are now integrated and listening on the entire network.`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
