const axios = require("axios");

exports.search = async (req, res) => {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    return res.status(400).json({ error: "Search term is required" });
  }

  try {
   
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchTerm,
          type: "video",
          maxResults: 10, 
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );
    let videos = response.data.items;
    let videoDetailsPromises = videos.map((video) => {
      return axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "statistics",
          id: video.id.videoId,
          key: process.env.YOUTUBE_API_KEY,
        },
      });
    });

    
    let videoDetailsResponses = await Promise.all(videoDetailsPromises);

    
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

    
    rankedVideos.sort((a, b) => {
      // Rank first by views, then by likes
      if (parseInt(b.views) === parseInt(a.views)) {
        return parseInt(b.likes) - parseInt(a.likes);
      }
      return parseInt(b.views) - parseInt(a.views);
    });

   
    res.json(rankedVideos);
  } catch (error) {
    console.error("Error fetching YouTube data", error);
    res.status(500).json({ error: "Error fetching YouTube data" });
  }
};
