const { createClient } = require('@supabase/supabase-js');

// تهيئة Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // إعدادات CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { playlistId } = req.query;

  if (!playlistId) {
    return res.status(400).json({ 
      success: false, 
      error: 'playlistId is required' 
    });
  }

  try {
    console.log(`🔍 جلب بيانات القائمة: ${playlistId}`);
    
    // 1. البحث في الجدول الموجود
    const { data: course, error: dbError } = await supabase
      .from('courses')
      .select('videos_cache, cache_updated_at')
      .eq('playlist_id', playlistId)
      .single();

    if (dbError) {
      console.log('❌ خطأ في جلب البيانات من قاعدة البيانات:', dbError);
    }

    // 2. التحقق من وجود بيانات مخزنة وصالحة
    if (course && course.videos_cache && isCacheValid(course.cache_updated_at)) {
      console.log(`✅ تم جلب ${course.videos_cache.length} فيديو من التخزين المؤقت`);
      return res.json({
        success: true,
        source: 'cache',
        videos: course.videos_cache,
        cached: true
      });
    }

    console.log('🔄 جلب بيانات جديدة من YouTube API');
    
    // 3. جلب البيانات من YouTube API
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API Key غير موجود');
    }

    let allVideos = [];
    let nextPageToken = null;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`📄 جلب الصفحة ${pageCount} من YouTube`);
      
      let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
      
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`خطأ في YouTube API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const pageVideos = data.items.map(item => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          youtubeId: item.snippet.resourceId.videoId,
          duration: "10:00", // يمكنك تحسين هذا لاحقاً
          thumbnail: `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`
        }));
        
        allVideos = [...allVideos, ...pageVideos];
        console.log(`✅ تم جلب ${pageVideos.length} فيديو (المجموع: ${allVideos.length})`);
      }
      
      nextPageToken = data.nextPageToken;
      
      // تأخير بسيط لتجنب حدود API
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } while (nextPageToken && pageCount < 10); // حد أقصى 10 صفحات
    
    console.log(`🎉 تم جلب ${allVideos.length} فيديو بنجاح`);

    // 4. حفظ البيانات في الجدول الموجود
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        videos_cache: allVideos,
        cache_updated_at: new Date().toISOString()
      })
      .eq('playlist_id', playlistId);

    if (updateError) {
      console.error('❌ خطأ في حفظ البيانات:', updateError);
    } else {
      console.log('💾 تم حفظ البيانات في قاعدة البيانات');
    }

    // 5. إرجاع النتيجة
    res.json({
      success: true,
      source: 'youtube',
      videos: allVideos,
      cached: false,
      total: allVideos.length
    });

  } catch (error) {
    console.error('❌ خطأ في الدالة:', error);
    
    // في حالة الخطأ، استخدم البيانات الاحتياطية
    const fallbackVideos = [
      { id: "video1", title: "مقدمة الدورة", youtubeId: "dQw4w9WgXcQ", duration: "10:00" },
      { id: "video2", title: "الدرس الأول", youtubeId: "dQw4w9WgXcQ", duration: "15:30" },
      { id: "video3", title: "الدرس الثاني", youtubeId: "dQw4w9WgXcQ", duration: "12:45" },
      { id: "video4", title: "الدرس الثالث", youtubeId: "dQw4w9WgXcQ", duration: "18:20" },
      { id: "video5", title: "المشروع النهائي", youtubeId: "dQw4w9WgXcQ", duration: "22:10" }
    ];
    
    res.json({
      success: false,
      error: error.message,
      videos: fallbackVideos,
      fallback: true
    });
  }
}

// دالة التحقق من صلاحية البيانات
function isCacheValid(updatedAt) {
  if (!updatedAt) return false;
  
  const lastUpdate = new Date(updatedAt);
  const now = new Date();
  const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
  
  // البيانات صالحة لمدة 24 ساعة
  return hoursDiff < 24;
}
