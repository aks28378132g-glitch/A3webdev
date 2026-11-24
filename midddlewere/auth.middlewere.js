const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).send({ msg: "Please log in to continue." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "coding");

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).send({ msg: "Your session has expired. Please log in again." });
  }
};

module.exports = { auth };