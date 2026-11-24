const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !normalizedEmail ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return res.status(400).send({ msg: "Enter your name, a valid email, and a password of at least 6 characters." });
  }

  try {
    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).send({ msg: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(password, 10);
    await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hash,
    });

    return res.status(201).send({ msg: "User registered successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send({ msg: "An account with this email already exists." });
    }
    console.error("Registration failed:", error);
    return res.status(500).send({ msg: "Unable to create your account right now." });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || typeof password !== "string" || !password) {
    return res.status(400).send({ msg: "Enter your email and password." });
  }

  try {
    const user = await userModel.findOne({ email: normalizedEmail });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send({ msg: "Email or password is incorrect." });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || "coding",
      { expiresIn: "7d" }
    );
    return res.send({
      msg: "User login successfully",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).send({ msg: "Unable to log in right now." });
  }
});

module.exports = { userRouter };
