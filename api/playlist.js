// ===== إعدادات عامة =====
const MAX_PAGES = 20;
const PAGE_DELAY_MS = 500;
const CACHE_DURATION_MS = 72 * 60 * 60 * 1000; // 50 ساعة

// ===== مخزن كاش داخل السيرفر أثناء عمله =====
const serverCache = new Map();

// ===== اختيار مفتاح API بالتسلسل =====
let keyIndex = 0;
function getNextKey() {
    const keys = process.env.YOUTUBE_API_KEYS.split(",");
    const key = keys[keyIndex];
    keyIndex = (keyIndex + 1) % keys.length;
    return key;
}

// ===== API Route =====
export default async function handler(req, res) {
    const playlistId = req.query.id;
    if (!playlistId) return res.status(400).json({ error: "Missing playlist ID" });

    const cacheKey = "playlist_" + playlistId;

    // ===== التحقق من الكاش داخل السيرفر =====
    if (serverCache.has(cacheKey)) {
        const cached = serverCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            return res.status(200).json({ videos: cached.videos, cached: true });
        }
    }

    let allVideos = [];
    let nextPageToken = null;
    let pageCount = 0;

    try {
        do {
            pageCount++;
            if (pageCount > MAX_PAGES) break;

            const apiKey = getNextKey();

            let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}&fields=items(snippet(title,resourceId/videoId)),nextPageToken`;

            if (nextPageToken) url += `&pageToken=${nextPageToken}`;

            const response = await fetch(url);

            // إذا المفتاح انتهت حصته — جرّب مفتاح ثاني
            if (response.status === 403) continue;
            if (!response.ok) throw new Error(`YouTube Error ${response.status}`);

            const data = await response.json();

            const videos = (data.items || []).map(item => ({
                id: item.snippet.resourceId.videoId,
                youtubeId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                duration: "10:00"
            }));

            allVideos.push(...videos);

            nextPageToken = data.nextPageToken;

            if (nextPageToken) await new Promise(r => setTimeout(r, PAGE_DELAY_MS));

        } while (nextPageToken);

        // حفظ الكاش في السيرفر
        serverCache.set(cacheKey, {
            videos: allVideos,
            timestamp: Date.now()
        });

        return res.status(200).json({ videos: allVideos, cached: false });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
