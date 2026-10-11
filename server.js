require("dotenv").config();

const express = require("express");
const connectDB = require("./db");

const productRoutes = require("./productRoutes");

const {
  notFound,
  errorHandler
} = require("./errorMiddleware");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "Inventory Management API is running"
  });
});

app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start:", error.message);
    process.exit(1);
  }
}

startServer();