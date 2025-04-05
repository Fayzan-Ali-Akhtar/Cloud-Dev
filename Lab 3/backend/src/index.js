const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { PORT, DB, COGNITO } = require("./constants");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: DB.user,
  host: DB.host,
  database: DB.database,
  password: DB.password,
  port: parseInt(DB.port, 10),
});

// Set up jwks-rsa client to fetch AWS Cognito public keys
const client = jwksClient({
  jwksUri: `https://cognito-idp.${COGNITO.REGION}.amazonaws.com/${COGNITO.USER_POOL_ID}/.well-known/jwks.json`
});

// Function to retrieve signing key for token verification
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Middleware to verify JWT using Cognito JWKs
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  const token = authHeader;
  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err)
      return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// Helper: Check if user is an Admin (assumes "cognito:groups" claim)
const isAdmin = (user) => {
  return user["cognito:groups"] && user["cognito:groups"].includes("Admins");
};

// Routes
app.get("/tasks", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    let result;
    if (isAdmin(user)) {
      result = await pool.query("SELECT * FROM tasks");
    } else {
      result = await pool.query("SELECT * FROM tasks WHERE user_id = $1", [user.username]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", verifyToken, async (req, res) => {
  const { description } = req.body;
  const user = req.user;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (description, user_id) VALUES ($1, $2) RETURNING *",
      [description, user.username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/tasks/:id", verifyToken, async (req, res) => {
  const taskId = req.params.id;
  const { description } = req.body;
  const user = req.user;
  if (!isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden: Only admins can update tasks" });
  }
  try {
    const result = await pool.query(
      "UPDATE tasks SET description = $1 WHERE id = $2 RETURNING *",
      [description, taskId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", verifyToken, async (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  try {
    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = taskResult.rows[0];
    if (user.username !== task.user_id && !isAdmin(user)) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own tasks" });
    }
    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
