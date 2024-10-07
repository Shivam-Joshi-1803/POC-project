const axios = require("axios");

// Define the search function to handle YouTube searches
exports.search = async (req, res) => {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
    // Step 1: Fetch YouTube videos based on the search term
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchTerm,
          type: "video",
          maxResults: 10, // Limit the number of results to 10
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    // Step 2: Extract video details from the response
    let videos = response.data.items;

    // Step 3: For each video, fetch detailed statistics like views and likes
    let videoDetailsPromises = videos.map((video) => {
      return axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "statistics",
          id: video.id.videoId,
          key: process.env.YOUTUBE_API_KEY,
        },
      });
    });

    // Step 4: Wait for all statistics to be fetched
    let videoDetailsResponses = await Promise.all(videoDetailsPromises);

    // Step 5: Combine the video details with their statistics (views, likes)
    let rankedVideos = videos.map((video, index) => {
      let details = videoDetailsResponses[index].data.items[0].statistics;
      return {
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.default.url,
        views: details.viewCount,
        likes: details.likeCount,
      };
    });

    // Step 6: Sort the videos by views and likes (Optional: Adjust ranking logic)
    rankedVideos.sort((a, b) => {
      // Rank first by views, then by likes
      if (parseInt(b.views) === parseInt(a.views)) {
        return parseInt(b.likes) - parseInt(a.likes);
      }
      return parseInt(b.views) - parseInt(a.views);
    });

    // Step 7: Return the ranked videos as a response
    res.json(rankedVideos);
  } catch (error) {
    console.error("Error fetching YouTube data", error);
    res.status(500).json({ error: "Error fetching YouTube data" });
  }
};
