// استيراد Supabase
const { createClient } = require('@supabase/supabase-js');

// تهيئة Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // تمكين CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // معالجة طلبات OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { playlistId, courseId } = req.query;

  try {
    // إذا لم يكن هناك playlistId، حاول الحصول من Supabase باستخدام courseId
    let actualPlaylistId = playlistId;
    
    if (!actualPlaylistId && courseId) {
      console.log(`🔍 Fetching playlist for course: ${courseId}`);
      const { data: course, error } = await supabase
        .from('courses')
        .select('playlist_id')
        .eq('id', courseId)
        .single();

      if (error || !course) {
        return res.status(404).json({ 
          error: 'Course not found',
          details: error?.message 
        });
      }

      actualPlaylistId = course.playlist_id;
    }

    if (!actualPlaylistId) {
      return res.status(400).json({ 
        error: 'Missing playlistId or courseId' 
      });
    }

    console.log(`🎯 Fetching videos for playlist: ${actualPlaylistId}`);

    // إذا لم يكن هناك YouTube API key، أرجع بيانات افتراضية
    if (!youtubeApiKey || youtubeApiKey.includes('YOUR_API_KEY')) {
      console.log('📝 Using fallback data (no YouTube API key)');
      const fallbackVideos = [
        { id: "video1", title: "مقدمة الدورة", youtubeId: "X_P8xsiSB90", duration: "10:00" },
        { id: "video2", title: "الدرس الأول", youtubeId: "8BlRT7Ktw1c", duration: "15:30" },
        { id: "video3", title: "الدرس الثاني", youtubeId: "0Kr1eh1wwb8", duration: "12:45" },
        { id: "video4", title: "الدرس الثالث", youtubeId: "Rd6F5wHIysM", duration: "18:20" },
        { id: "video5", title: "المشروع النهائي", youtubeId: "DV0Ln7HRyJQ", duration: "22:10" }
      ];
      
      return res.status(200).json({ 
        videos: fallbackVideos,
        total: fallbackVideos.length,
        source: 'fallback'
      });
    }

    // جلب الفيديوهات من YouTube API
    let allVideos = [];
    let nextPageToken = null;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`📄 Fetching page ${pageCount} for playlist ${actualPlaylistId}`);
      
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${actualPlaylistId}&key=${youtubeApiKey}`;
      
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        // إذا فشل الطلب، استخدم البيانات الافتراضية
        if (response.status === 403 || response.status === 400) {
          console.log('⚠️ YouTube API quota exceeded, using fallback data');
          const fallbackVideos = [
            { id: "video1", title: "مقدمة الدورة", youtubeId: "X_P8xsiSB90", duration: "10:00" },
            { id: "video2", title: "الدرس الأول", youtubeId: "8BlRT7Ktw1c", duration: "15:30" },
            { id: "video3", title: "الدرس الثاني", youtubeId: "0Kr1eh1wwb8", duration: "12:45" },
            { id: "video4", title: "الدرس الثالث", youtubeId: "Rd6F5wHIysM", duration: "18:20" },
            { id: "video5", title: "المشروع النهائي", youtubeId: "DV0Ln7HRyJQ", duration: "22:10" }
          ];
          
          return res.status(200).json({ 
            videos: fallbackVideos,
            total: fallbackVideos.length,
            source: 'fallback_quota'
          });
        }
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const pageVideos = data.items.map(item => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          youtubeId: item.snippet.resourceId.videoId,
          duration: "10:00" // يمكن إضافة API آخر للحصول على المدة
        }));

        allVideos = [...allVideos, ...pageVideos];
      }

      nextPageToken = data.nextPageToken;

      // إضافة تأخير لتجنب rate limiting
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } while (nextPageToken && pageCount < 5); // حد أقصى 5 صفحات للحماية

    console.log(`✅ Successfully loaded ${allVideos.length} videos`);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json({ 
      videos: allVideos,
      total: allVideos.length,
      source: 'youtube_api'
    });

  } catch (error) {
    console.error('❌ Error in serverless function:', error);
    
    // بيانات احتياطية في حالة الفشل
    const fallbackVideos = [
      { id: "video1", title: "مقدمة الدورة", youtubeId: "X_P8xsiSB90", duration: "10:00" },
      { id: "video2", title: "الدرس الأول", youtubeId: "8BlRT7Ktw1c", duration: "15:30" },
      { id: "video3", title: "الدرس الثاني", youtubeId: "0Kr1eh1wwb8", duration: "12:45" },
      { id: "video4", title: "الدرس الثالث", youtubeId: "Rd6F5wHIysM", duration: "18:20" },
      { id: "video5", title: "المشروع النهائي", youtubeId: "DV0Ln7HRyJQ", duration: "22:10" }
    ];
    
    return res.status(200).json({ 
      videos: fallbackVideos,
      total: fallbackVideos.length,
      source: 'fallback_error',
      error: error.message
    });
  }
}
