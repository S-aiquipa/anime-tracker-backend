const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // allows JSON requests

// Temporary in-memory list (later we’ll use a database)
let animes = [];

// Get all animes
app.get("/animes", (req, res) => {
  res.json(animes);
});

// Add new anime
app.post("/animes", (req, res) => {
  const { title } = req.body;

  // Prevent duplicates
  const exists = animes.some(
    (anime) => anime.title.toLowerCase() === title.toLowerCase(),
  );
  if (exists) {
    return res.status(400).json({ error: "Anime already exists" });
  }

  const newAnime = { title, status: "want to watch" };
  animes.push(newAnime);
  res.json(newAnime);
});

// Mark anime as watched
app.put("/animes/:title", (req, res) => {
  const { title } = req.params;
  const anime = animes.find(
    (a) => a.title.toLowerCase() === title.toLowerCase(),
  );
  if (!anime) return res.status(404).json({ error: "Anime not found" });

  anime.status = "watched";
  res.json(anime);
});

// Delete anime
app.delete("/animes/:title", (req, res) => {
  const { title } = req.params;
  animes = animes.filter((a) => a.title.toLowerCase() !== title.toLowerCase());
  res.json({ message: "Anime deleted" });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
