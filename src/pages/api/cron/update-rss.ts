import type { APIRoute } from 'astro';
import { defaultRSSConfig } from '@/utils/rss';
import { XMLParser } from 'fast-xml-parser';
import type { RSSFeed, RSSSource } from '@/types';

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

// 带超时的 fetch
async function fetchWithTimeout(url: string, timeout: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 解析单个RSS源
async function fetchSingleSource(source: RSSSource): Promise<RSSFeed | null> {
  try {
    const response = await fetchWithTimeout(source.url, 5000);
    
    if (!response.ok) {
      console.error(`RSS源 ${source.name} 请求失败: ${response.status}`);
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
      console.error(`RSS源 ${source.name} 格式无效`);
      return null;
    }

    const channel = rss.channel || rss;
    const itemElements = channel.item || channel.entry || [];
    const itemsArray = Array.isArray(itemElements) ? itemElements : [itemElements];
    
    const items = itemsArray.slice(0, 20).map((item: any, index: number) => {
      const title = item.title?.['#text'] || item.title || '';
      const description = item.description?.['#text'] || item.description || item.summary || '';
      const link = item.link?.['#text'] || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      
      return {
        id: `${source.id}-${index}`,
        title: typeof title === 'string' ? title.trim() : '',
        description: typeof description === 'string' ? description.trim().slice(0, 500) : '',
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
    console.error(`获取RSS源 ${source.name} 失败:`, error);
    return null;
  }
}

export const GET: APIRoute = async ({ request }) => {
  // 验证请求来源（可选：添加安全验证）
  const authHeader = request.headers.get('Authorization');
  const cronSecret = import.meta.env.CRON_SECRET;
  
  // 如果设置了CRON_SECRET，验证请求
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const startTime = Date.now();
  const redis = await getRedis();
  
  if (!redis) {
    return new Response(JSON.stringify({ 
      error: 'Redis not configured',
      message: 'Redis is required for cron job caching'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sources = defaultRSSConfig.sources;
    console.log(`开始更新 ${sources.length} 个RSS源...`);
    
    // 并行获取所有RSS源
    const promises = sources.map(source => fetchSingleSource(source));
    const results = await Promise.allSettled(promises);
    
    const allFeeds: RSSFeed[] = [];
    const errors: string[] = [];
    const updateResults: any[] = [];
    
    // 处理结果并缓存每个源
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const source = sources[i];
      
      if (result.status === 'fulfilled' && result.value) {
        const feed = result.value;
        allFeeds.push(feed);
        
        // 缓存单个源的数据（7200秒 = 2小时）
        const cacheKey = `rss-feed-${source.id}`;
        await redis.setex(cacheKey, 7200, JSON.stringify(feed));
        
        updateResults.push({
          source: source.name,
          status: 'success',
          items: feed.items.length,
        });
        
        console.log(`✓ ${source.name}: ${feed.items.length} 项`);
      } else {
        errors.push(`${source.name}: 获取失败`);
        updateResults.push({
          source: source.name,
          status: 'failed',
          error: result.status === 'rejected' ? result.reason?.message : 'Unknown error',
        });
        
        console.error(`✗ ${source.name}: 失败`);
      }
    }
    
    // 缓存所有feeds的汇总数据
    const totalArticles = allFeeds.reduce((sum, feed) => sum + feed.items.length, 0);
    const cacheData = {
      feeds: allFeeds,
      stats: {
        total: sources.length,
        successful: allFeeds.length,
        failed: errors.length,
        totalArticles,
        lastUpdated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    await redis.setex('rss-all-feeds', 7200, JSON.stringify(cacheData));
    
    const duration = Date.now() - startTime;
    
    // 记录更新日志
    const updateLog = {
      timestamp: new Date().toISOString(),
      duration,
      results: updateResults,
      stats: cacheData.stats,
    };
    
    await redis.setex('rss-update-log', 86400, JSON.stringify(updateLog)); // 保存24小时
    
    console.log(`RSS更新完成，耗时: ${duration}ms`);
    console.log(`成功: ${allFeeds.length}/${sources.length}, 文章总数: ${totalArticles}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'RSS feeds updated successfully',
      stats: {
        duration,
        sourcesUpdated: allFeeds.length,
        totalSources: sources.length,
        totalArticles,
        errors: errors.length,
      },
      details: updateResults,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Cron job failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update RSS feeds',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// 支持POST方法（某些cron服务使用POST）
export const POST = GET;
