require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const cardRoutes = require("./routes/cardRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "CardWise API" });
});

app.use("/auth", authRoutes);
app.use("/cards", cardRoutes);
app.use("/recommend", recommendationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal server error" });
});

if (require.main === module) {
  const connectDB = require("./config/db");
  connectDB();

  const startPort = Number(process.env.PORT) || 5000;

  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`CardWise backend running on port ${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
        startServer(nextPort);
        return;
      }

      throw error;
    });
  };

  startServer(startPort);
}

module.exports = app;
