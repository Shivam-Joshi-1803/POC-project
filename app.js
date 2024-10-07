const express = require("express");
const youtubeController = require("./controllers/youtubeController");
const articleController = require("./controllers/articleController");
const paperController = require("./controllers/paperController");
const rankResults = require("./utils/rankResults");
require("dotenv").config();

const app = express();
app.use(express.json());// Use the `.search()` method
app.get("/youtube", youtubeController.search);
app.get("/articles", articleController.search);
app.get("/papers", paperController.search);

app.get("/search", async (req, res) => {
  const searchTerm = req.query.q;
  try {
    const [youtubeResponse, articlesResponse, papersResponse] =
      await Promise.all([
        youtubeController.search(searchTerm),
        articleController.search(searchTerm),
        paperController.search(searchTerm),
      ]);

    const rankedResults = rankResults(
      youtubeResponse,
      articlesResponse,
      papersResponse
    );
    res.json(rankedResults);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
