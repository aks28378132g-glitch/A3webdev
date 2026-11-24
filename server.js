
const express = require("express");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./midddlewere/auth.middlewere");

const app = express();

app.use(express.json());

app.use("/user", userRouter);
app.use("/notes", auth, noteRouter);

app.get("/home", (req, res) => {
  res.send({ msg: "Welcome to Lovely Notes" });
});

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  try {
    await connection;
    console.log("DB Connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }

  console.log(`Server started on http://localhost:${port}`);
});
