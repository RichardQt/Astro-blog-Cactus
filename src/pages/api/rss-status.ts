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

// 转换为北京时间字符串
function toBeijingTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
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
    let formattedUpdateLog = null;
    
    if (updateLog) {
      const logData = typeof updateLog === 'string' ? JSON.parse(updateLog) : updateLog;
      formattedUpdateLog = {
        ...logData,
        timestamp: logData.timestamp,
        timestampBeijing: toBeijingTime(logData.timestamp),
      };
    }
    
    // 获取缓存的统计信息
    const cacheData = await redis.get('rss-all-feeds');
    let stats = null;
    let cacheTimestamp = null;
    
    if (cacheData) {
      const parsed = typeof cacheData === 'string' ? JSON.parse(cacheData) : cacheData;
      stats = parsed.stats;
      cacheTimestamp = parsed.timestamp;
    }
    
    return new Response(JSON.stringify({
      success: true,
      lastUpdate: formattedUpdateLog,
      currentStats: stats,
      cacheStatus: {
        hasCache: !!cacheData,
        lastUpdated: cacheTimestamp,
        lastUpdatedBeijing: cacheTimestamp ? toBeijingTime(cacheTimestamp) : null,
      },
      currentTimeBeijing: toBeijingTime(new Date().toISOString()),
    }, null, 2), {
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
