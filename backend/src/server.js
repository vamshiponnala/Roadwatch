require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const compression  = require("compression");
const rateLimit    = require("express-rate-limit");
const { createServer } = require("http");
const { Server }   = require("socket.io");
 
const app        = express();
const httpServer = createServer(app);
 
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET","POST"] }
});
 
io.on("connection", socket => {
  socket.on("join", ({ userId, role }) => {
    if (role === "AUTHORITY" || role === "ADMIN") socket.join("admins");
    socket.join(`user:${userId}`);
  });
});
 
app.set("io", io);

app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(compression());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
 
const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
const authLimiter   = rateLimit({ windowMs: 10*60*1000, max: 10 });
app.use("/api", globalLimiter);
app.use("/api/v1/auth", authLimiter);
 
app.use("/api/v1/auth",    require("./routes/auth"));
app.use("/api/v1/reports", require("./routes/reports"));
app.use("/api/v1/rewards", require("./routes/rewards"));
app.use("/api/v1/admin",   require("./routes/admin"));
app.use("/api/v1/map",     require("./routes/map"));
app.use("/api/v1/users",   require("./routes/users"));
 
app.get("/health", (req, res) => res.json({ status:"ok", timestamp: new Date().toISOString() }));
 
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});
 
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚔 RoadWatch API running on port ${PORT}`));
 
module.exports = { app };
