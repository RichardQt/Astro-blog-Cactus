import type { APIRoute } from 'astro';
import { defaultRSSConfig } from '@/utils/rss';
import type { RSSSource, RSSFeed } from '@/types';
import { XMLParser } from 'fast-xml-parser';
import { Redis } from '@upstash/redis';

// Upstash Redis 初始化
let redis: Redis | null = null;
try {
  if (import.meta.env.UPSTASH_REDIS_REST_URL && import.meta.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: import.meta.env.UPSTASH_REDIS_REST_URL,
      token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('[CRON] Upstash Redis 已初始化');
  } else {
    console.log('[CRON] Upstash Redis 配置缺失');
  }
} catch (error) {
  console.error('[CRON] Upstash Redis 初始化失败:', error);
}

// 带超时的fetch函数
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// 解析单个RSS源
async function fetchSingleSource(source: RSSSource): Promise<RSSFeed | null> {
  try {
    const response = await fetchWithTimeout(source.url, 5000); // CRON任务可以有更长的超时时间
    
    if (!response.ok) {
      console.error(`[CRON] RSS源 ${source.name} 请求失败: ${response.status}`);
      return null;
    }

    const xmlText = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });

    const result = parser.parse(xmlText);
    const rss = result.rss || result.feed;
    
    if (!rss) {
      console.error(`[CRON] RSS源 ${source.name} 格式无效`);
      return null;
    }

    const channel = rss.channel || rss;
    const itemElements = channel.item || channel.entry || [];
    const itemsArray = Array.isArray(itemElements) ? itemElements : [itemElements];
    
    // CRON任务可以获取更多条目
    const items = itemsArray.slice(0, 30).map((item: any, index: number) => {
      const title = item.title?.['#text'] || item.title || '';
      const description = item.description?.['#text'] || item.description || item.summary || '';
      const link = item.link?.['#text'] || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      
      // 清理HTML标签
      const cleanDescription = typeof description === 'string' 
        ? description.replace(/<[^>]*>/g, '').trim().slice(0, 500) 
        : '';
      
      return {
        id: `${source.id}-${index}`,
        title: typeof title === 'string' ? title.trim().slice(0, 300) : '',
        description: cleanDescription,
        content: description,
        link: typeof link === 'string' ? link.trim() : '',
        pubDate,
        sourceId: source.id,
        sourceName: source.name,
        read: false,
      };
    }).filter((item: any) => item.title && item.link);

    return {
      source,
      items,
      lastBuildDate: channel.lastBuildDate || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[CRON] 获取RSS源 ${source.name} 失败:`, error);
    return null;
  }
}

// 并行获取所有RSS源（为CRON优化）
async function fetchAllSourcesForCron(sources: RSSSource[]): Promise<{
  feeds: RSSFeed[];
  errors: string[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}> {
  const startTime = Date.now();
  
  // CRON任务可以同时处理所有源
  const promises = sources.map(source => fetchSingleSource(source));
  const results = await Promise.allSettled(promises);
  
  const feeds: RSSFeed[] = [];
  const errors: string[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      feeds.push(result.value);
    } else {
      const sourceName = sources[index]?.name || `源 ${index + 1}`;
      const errorMsg = result.status === 'rejected' 
        ? `${sourceName}: ${result.reason}`
        : `${sourceName}: 获取失败`;
      errors.push(errorMsg);
    }
  });
  
  const duration = Date.now() - startTime;

  return {
    feeds,
    errors,
    stats: {
      total: sources.length,
      successful: feeds.length,
      failed: errors.length,
      duration,
    },
  };
}

// 保存到Redis缓存
async function saveToCache(key: string, data: any, ttlSeconds: number = 600): Promise<boolean> {
  try {
    if (redis) {
      // Upstash 自动处理JSON序列化
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      return true;
    }
    
    // 如果没有Redis，记录日志
    console.log('[CRON] 没有可用的Redis存储，数据未保存');
    return false;
  } catch (error) {
    console.error('[CRON] 保存到Redis失败:', error);
    return false;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // 验证CRON密钥（用于安全）
    const cronSecret = url.searchParams.get('secret');
    const expectedSecret = import.meta.env.CRON_SECRET || 'default-secret';
    
    // 在生产环境中应该验证密钥
    if (import.meta.env.PROD && cronSecret !== expectedSecret) {
      return new Response(JSON.stringify({
        error: '未授权的请求',
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[CRON] 开始更新RSS feeds...');
    const startTime = Date.now();

    // 获取所有RSS源
    const sources = defaultRSSConfig.sources;
    
    // 并行获取所有源
    const result = await fetchAllSourcesForCron(sources);
    
    // 构建要缓存的数据
    const cacheData = {
      feeds: result.feeds,
      errors: result.errors,
      stats: {
        ...result.stats,
        fromCache: false,
        lastUpdate: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    // 保存到缓存（10分钟过期）
    const saved = await saveToCache('rss-all-feeds', cacheData, 600);
    
    // 为每个成功的源也单独缓存
    if (saved) {
      for (const feed of result.feeds) {
        await saveToCache(`rss-source-${feed.source.id}`, feed, 600);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    const response = {
      success: true,
      message: `CRON任务完成，更新了 ${result.stats.successful}/${result.stats.total} 个RSS源`,
      stats: {
        ...result.stats,
        totalDuration,
        saved,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[CRON] 任务完成，耗时: ${totalDuration}ms，成功: ${result.stats.successful}/${result.stats.total}`);
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[CRON] 任务执行失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'CRON任务执行失败',
      message: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST方法用于手动触发
export const POST: APIRoute = GET;
