const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // Get the token from the request header
  const token = req.header("x-auth-token");

  // If no token, respond with a 401 error
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify token with JWT_SECRET from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;  // Add user data to request object
    next();  // Continue to the protected route
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}

module.exports = auth;
