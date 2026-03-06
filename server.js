const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const Joi = require("joi");

const app = express();
app.use(
  cors({
    origin: "https://anime-tracker-wheat-sigma.vercel.app/",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// 1. Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 2. Define Anime Schema & Model

const AnimeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mal_id: { type: Number, required: true },
  title: { type: String, required: true },
  year: Number,
  episodes: Number,
  duration: String,
  studio: String,
  type: String,
  image: String,
  status: {
    type: String,
    enum: ["want to watch", "watching", "completed"],
    default: "want to watch",
    set: (v) => v.toLowerCase(),
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
});

const Anime = mongoose.model("Anime", AnimeSchema);

const animeValidationSchema = Joi.object({
  mal_id: Joi.number().required(),
  title: Joi.string().required(),
  year: Joi.number().allow(null),
  episodes: Joi.number().allow(null),
  duration: Joi.string().allow(null),
  studio: Joi.string().allow("Desconocido"),
  type: Joi.string().allow("Desconocido"),
  image: Joi.string().uri().allow(""),
  status: Joi.string().valid("want to watch", "watching", "completed"),
  rating: Joi.number().min(1).max(5).allow(null),
});

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token, access denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
// 3. Routes

// GET all animes — only for logged in user
app.get("/animes", authMiddleware, async (req, res) => {
  try {
    const animes = await Anime.find({ userId: req.userId });
    res.json(animes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch anime list" });
  }
});

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${q}&limit=5`,
    );
    const data = await response.json();

    res.json(data.data || []);
  } catch (err) {
    console.error("Error en /search:", err);
    res.status(500).json({ error: "Error en busqueda" });
  }
});

// POST new anime — save with userId
app.post("/animes", authMiddleware, async (req, res) => {
  try {
    const { mal_id } = req.body;
    if (!mal_id) {
      return res.status(400).json({ error: "mal_id is required" });
    }

    const response = await fetch(
      `https://api.jikan.moe/v4/anime/${mal_id}/full`,
    );
    const data = await response.json();

    if (!data || !data.data) {
      return res.status(500).json({ error: "Invalid response from Jikan" });
    }

    const anime = data.data;

    const { error, value } = animeValidationSchema.validate({
      mal_id: anime.mal_id,
      title: anime.title,
      year: anime.aired?.prop?.from?.year || null,
      episodes: anime.episodes ?? null,
      duration: anime.duration || null,
      studio: anime.studios?.map((s) => s.name).join(", ") || "Desconocido",
      type: anime.type || "Desconocido",
      image: anime.images?.jpg?.image_url || "",
      status: "want to watch",
      rating: null,
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check duplicate for THIS user only
    const existing = await Anime.findOne({
      mal_id: anime.mal_id,
      userId: req.userId,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Anime already exists in your list" });
    }

    const newAnime = new Anime({ ...value, userId: req.userId });
    await newAnime.save();
    res.json(newAnime);
  } catch (err) {
    console.error("Error en /animes:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update anime status
app.put("/animes/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating } = req.body;
    const anime = await Anime.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status, rating },
      { new: true },
    );
    if (!anime) return res.status(404).json({ error: "Anime not found" });
    res.json(anime);
  } catch (err) {
    res.status(500).json({ error: "Failed to update anime" });
  }
});

// DELETE anime
app.delete("/animes/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Anime.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });
    if (!result) return res.status(404).json({ error: "Anime not found" });
    res.json({ message: "Anime deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete anime" });
  }
});

//REGISTER

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    //Hash the password - never save plain text passwords
    const hashedPassword = await bcrypt.hash(password, 10);

    //Save user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    //Create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("Error in /register:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("Error in /login:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
