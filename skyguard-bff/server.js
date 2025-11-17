const express = require("express");
const cors = require("cors");
const compression = require("compression");
const dotenv = require("dotenv");
const cron = require("node-cron");

// Load environment variables
dotenv.config();

// Import routes
const flightRoutes = require("./routes/flights");
const disasterRoutes = require("./routes/disasters");
const analysisRoutes = require("./routes/analysis");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression()); // Compress responses
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/flights", flightRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/analysis", analysisRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// Schedule cache refresh every 30 seconds
cron.schedule("*/30 * * * * *", () => {
  console.log("[CRON] Cache refresh triggered");
  // The actual refresh happens in individual route handlers
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 SKYGUARD BACKEND SERVER RUNNING  ║
╚════════════════════════════════════════╝
    
    Port: ${PORT}
    Environment: ${process.env.NODE_ENV}
    Time: ${new Date().toISOString()}
    
    Endpoints:
    - GET  /health
    - GET  /api/flights/all
    - GET  /api/flights/search?callsign=XXX
    - GET  /api/disasters/earthquakes
    - GET  /api/disasters/events
    - GET  /api/disasters/all
    - GET  /api/analysis/affected-airports
    - POST /api/analysis/flights-near-disaster
    
  `);
});

module.exports = app;
