const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 2. Define Anime Schema & Model
const AnimeSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  status: { type: String, default: "want to watch" },
});

const Anime = mongoose.model("Anime", AnimeSchema);

// 3. Routes

// GET all anime
app.get("/animes", async (req, res) => {
  try {
    const animes = await Anime.find();
    res.json(animes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch animes" });
  }
});

// POST new anime
app.post("/animes", async (req, res) => {
  try {
    const { title } = req.body;
    const exists = await Anime.findOne({
      title: new RegExp(`^${title}$`, "i"),
    });
    if (exists) {
      return res.status(400).json({ error: "Anime already exists" });
    }

    const newAnime = new Anime({ title });
    await newAnime.save();
    res.json(newAnime);
  } catch (err) {
    res.status(500).json({ error: "Failed to add anime" });
  }
});

// PUT update anime status
app.put("/animes/:title", async (req, res) => {
  try {
    const { title } = req.params;
    const anime = await Anime.findOneAndUpdate(
      { title: new RegExp(`^${title}$`, "i") },
      { status: "watched" },
      { new: true },
    );

    if (!anime) return res.status(404).json({ error: "Anime not found" });
    res.json(anime);
  } catch (err) {
    res.status(500).json({ error: "Failed to update anime" });
  }
});

// DELETE anime
app.delete("/animes/:title", async (req, res) => {
  try {
    const { title } = req.params;
    const result = await Anime.deleteOne({
      title: new RegExp(`^${title}$`, "i"),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Anime not found" });
    }

    res.json({ message: "Anime deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete anime" });
  }
});

// 4. Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
