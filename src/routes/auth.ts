import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { DataSource } from "typeorm";

const authRouter = express.Router();
const JWT_SECRET = "b2b#!@";

// Initialize a new DataSource instance
const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Ensure this matches your config
  logging: true,
  entities: [], // No entities used here
});

// Connect to the database
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established.");
  })
  .catch((error) => {
    console.error("Error during database initialization:", error);
  });

// Registration Route
authRouter.post(
  "/register",
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 5 }).withMessage("Password too short"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const connection = AppDataSource.manager;
      await connection.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword]
      );
      res.status(201).json({ message: "User registered successfully" });
    } catch (error: any) {
      console.error("Error during registration:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ message: "Email already exists" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  }
);

// Login Route
authRouter.post(
  "/login",
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const connection = AppDataSource.manager;

      // Check if the user exists
      const user = await connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (user.length === 0) {
        return res
          .status(400)
          .json({ message: "User is not registered. Please register first." });
      }

      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user[0].password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign({ id: user[0].id, email }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({ token });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export { authRouter };
