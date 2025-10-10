// api/getPlaylistVideos.js
export default async function handler(req, res) {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not found on server.' });
    }

    const playlistId = req.query.playlistId;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required.' });
    }

    const maxResults = req.query.max || 10;

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // تبسيط البيانات قبل الإرسال
    const videos = (data.items || []).map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      channel: item.snippet.channelTitle,
    }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ items: videos });
  } catch (e) {
    console.error('YouTube API Error:', e);
    return res.status(500).json({ error: 'Server error fetching playlist' });
  }
}
