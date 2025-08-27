import type { APIRoute } from 'astro';

// 动态导入 Redis
async function getRedis() {
  try {
    if (import.meta.env.UPSTASH_REDIS_REST_URL && import.meta.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      return new Redis({
        url: import.meta.env.UPSTASH_REDIS_REST_URL,
        token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  } catch (error) {
    console.error('Redis初始化失败:', error);
  }
  return null;
}

// GET 方法：获取最后更新状态
export const GET: APIRoute = async () => {
  const redis = await getRedis();
  
  if (!redis) {
    return new Response(JSON.stringify({ 
      error: 'Redis not configured'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 获取更新日志
    const updateLog = await redis.get('rss-update-log');
    
    // 获取缓存的统计信息
    const cacheData = await redis.get('rss-all-feeds');
    let stats = null;
    
    if (cacheData) {
      const parsed = typeof cacheData === 'string' ? JSON.parse(cacheData) : cacheData;
      stats = parsed.stats;
    }
    
    return new Response(JSON.stringify({
      success: true,
      lastUpdate: updateLog || null,
      currentStats: stats,
      cacheStatus: {
        hasCache: !!cacheData,
        lastUpdated: stats?.lastUpdated || null,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get RSS status',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
