// api/getVideos.js

export default async function handler(req, res) {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not found on server.' });
    }

    // الكلمة اللي تبحث عنها (من الرابط)
    const q = req.query.q || 'javascript';
    const maxResults = req.query.max || 6;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(q)}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    // تبسيط البيانات قبل الإرسال
    const videos = (data.items || []).map(v => ({
      id: v.id.videoId,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail: v.snippet.thumbnails.medium.url,
      channel: v.snippet.channelTitle,
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ items: videos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
