import type { APIRoute } from 'astro';
import { defaultRSSConfig } from '@/utils/rss';
import type { RSSSource, RSSFeed } from '@/types';
import { XMLParser } from 'fast-xml-parser';

// Vercel KV support (需要安装 @vercel/kv 包)
let kv: any = null;
try {
  // 尝试导入Vercel KV（仅在生产环境可用）
  const kvModule = await import('@vercel/kv');
  kv = kvModule.kv;
} catch {
  console.log('Vercel KV不可用，使用内存缓存');
}

// 内存缓存作为后备
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60; // 5分钟（秒）

// 统一的缓存接口
const cacheAdapter = {
  async get(key: string): Promise<any | null> {
    if (kv) {
      try {
        return await kv.get(key);
      } catch (error) {
        console.error('KV获取失败:', error);
      }
    }
    
    // 降级到内存缓存
    const cached = memoryCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    
    if (cacheAge > CACHE_DURATION * 1000) {
      memoryCache.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  async set(key: string, data: any, ttlSeconds: number = CACHE_DURATION): Promise<void> {
    if (kv) {
      try {
        await kv.setex(key, ttlSeconds, data);
        return;
      } catch (error) {
        console.error('KV设置失败:', error);
      }
    }
    
    // 降级到内存缓存
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  },
  
  async delete(key: string): Promise<void> {
    if (kv) {
      try {
        await kv.del(key);
      } catch (error) {
        console.error('KV删除失败:', error);
      }
    }
    memoryCache.delete(key);
  },
  
  async clear(): Promise<void> {
    // 清除所有RSS相关的缓存
    if (kv) {
      try {
        const keys = await kv.keys('rss-*');
        if (keys.length > 0) {
          await Promise.all(keys.map(key => kv.del(key)));
        }
      } catch (error) {
        console.error('KV清除失败:', error);
      }
    }
    memoryCache.clear();
  }
};

// 带超时和重试的fetch函数
async function fetchWithRetry(
  url: string, 
  timeoutMs: number = 3000,
  maxRetries: number = 2
): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      
      clearTimeout(timeout);
      
      if (response.ok) {
        return response;
      }
      
      // 如果是4xx错误，不重试
      if (response.status >= 400 && response.status < 500) {
        console.error(`RSS源请求失败 (${response.status}): ${url}`);
        return null;
      }
      
      // 5xx错误，继续重试
      if (attempt < maxRetries) {
        console.warn(`RSS源请求失败，重试 ${attempt + 1}/${maxRetries}: ${url}`);
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1))); // 递增延迟
      }
    } catch (error) {
      clearTimeout(timeout);
      
      if (attempt < maxRetries) {
        console.warn(`RSS源请求异常，重试 ${attempt + 1}/${maxRetries}: ${url}`);
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      } else {
        console.error(`RSS源请求失败: ${url}`, error);
      }
    }
  }
  
  return null;
}

// 解析单个RSS源（优化版）
async function fetchSingleSource(source: RSSSource): Promise<RSSFeed | null> {
  try {
    // 先检查单个源的缓存
    const sourceCacheKey = `rss-source-${source.id}`;
    const cachedSource = await cacheAdapter.get(sourceCacheKey);
    if (cachedSource) {
      console.log(`从缓存返回源: ${source.name}`);
      return cachedSource;
    }
    
    const response = await fetchWithRetry(source.url, 3000, 1); // 3秒超时，1次重试
    
    if (!response) {
      return null;
    }

    const xmlText = await response.text();
    
    // 使用fast-xml-parser解析
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
    
    // 优化：只取前20个条目，并简化数据结构
    const items = itemsArray.slice(0, 20).map((item: any, index: number) => {
      const title = item.title?.['#text'] || item.title || '';
      const description = item.description?.['#text'] || item.description || item.summary || '';
      const link = item.link?.['#text'] || item.link || '';
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      
      // 清理HTML标签（简单版）
      const cleanDescription = typeof description === 'string' 
        ? description.replace(/<[^>]*>/g, '').trim().slice(0, 300) 
        : '';
      
      return {
        id: `${source.id}-${index}`,
        title: typeof title === 'string' ? title.trim().slice(0, 200) : '',
        description: cleanDescription,
        link: typeof link === 'string' ? link.trim() : '',
        pubDate,
        sourceId: source.id,
        sourceName: source.name,
      };
    }).filter((item: any) => item.title && item.link);

    const feedData: RSSFeed = {
      source,
      items,
      lastBuildDate: channel.lastBuildDate || new Date().toISOString(),
    };
    
    // 缓存单个源的数据（10分钟）
    await cacheAdapter.set(sourceCacheKey, feedData, 600);
    
    return feedData;
  } catch (error) {
    console.error(`获取RSS源 ${source.name} 失败:`, error);
    return null;
  }
}

// 并行获取所有RSS源（批量处理）
async function fetchAllSourcesParallel(
  sources: RSSSource[],
  batchSize: number = 5
): Promise<{
  feeds: RSSFeed[];
  errors: string[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    fromCache: boolean;
    duration: number;
  };
}> {
  const startTime = Date.now();
  const feeds: RSSFeed[] = [];
  const errors: string[] = [];
  
  // 分批处理，避免同时发起太多请求
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const promises = batch.map(source => fetchSingleSource(source));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const source = batch[index];
      if (result.status === 'fulfilled' && result.value) {
        feeds.push(result.value);
      } else {
        const errorMsg = result.status === 'rejected' 
          ? `${source.name}: ${result.reason}`
          : `${source.name}: 获取失败`;
        errors.push(errorMsg);
      }
    });
  }
  
  const duration = Date.now() - startTime;

  return {
    feeds,
    errors,
    stats: {
      total: sources.length,
      successful: feeds.length,
      failed: errors.length,
      fromCache: false,
      duration,
    },
  };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const sourceId = url.searchParams.get('source');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const quick = url.searchParams.get('quick') === 'true'; // 快速模式：只返回缓存
    
    // 构建缓存键
    const cacheKey = sourceId ? `rss-single-${sourceId}` : 'rss-all-feeds';
    
    // 快速模式或检查缓存
    if (quick || !forceRefresh) {
      const cachedData = await cacheAdapter.get(cacheKey);
      if (cachedData) {
        console.log(`从缓存返回数据: ${cacheKey}`);
        return new Response(JSON.stringify({
          ...cachedData,
          stats: { ...cachedData.stats, fromCache: true }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            'X-Cache': 'HIT',
          },
        });
      }
      
      // 快速模式下，如果没有缓存，返回空数据
      if (quick) {
        return new Response(JSON.stringify({
          feeds: [],
          errors: [],
          stats: {
            total: 0,
            successful: 0,
            failed: 0,
            fromCache: false,
            duration: 0,
          },
          timestamp: new Date().toISOString(),
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
          },
        });
      }
    }

    // 获取要处理的源
    let sources = defaultRSSConfig.sources;
    
    if (sourceId) {
      const source = sources.find(s => s.id === sourceId);
      if (!source) {
        return new Response(JSON.stringify({
          error: `未找到ID为 ${sourceId} 的RSS源`,
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      sources = [source];
    }

    // 并行获取所有源
    console.log(`开始并行获取 ${sources.length} 个RSS源...`);
    
    const result = await fetchAllSourcesParallel(sources, 5); // 每批5个源
    
    console.log(`获取完成，耗时: ${result.stats.duration}ms，成功: ${result.stats.successful}/${result.stats.total}`);
    
    // 构建响应数据
    const responseData = {
      feeds: result.feeds,
      errors: result.errors,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    };

    // 缓存结果（5分钟）
    await cacheAdapter.set(cacheKey, responseData, 300);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('API错误:', error);
    return new Response(JSON.stringify({
      error: '获取RSS数据失败',
      message: error instanceof Error ? error.message : '未知错误',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// 支持POST请求（管理操作）
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (body.action === 'clear-cache') {
      await cacheAdapter.clear();
      return new Response(JSON.stringify({
        success: true,
        message: '缓存已清除',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (body.action === 'warm-cache') {
      // 预热缓存
      const sources = defaultRSSConfig.sources;
      const result = await fetchAllSourcesParallel(sources, 3);
      
      const responseData = {
        feeds: result.feeds,
        errors: result.errors,
        stats: result.stats,
        timestamp: new Date().toISOString(),
      };
      
      await cacheAdapter.set('rss-all-feeds', responseData, 300);
      
      return new Response(JSON.stringify({
        success: true,
        message: `缓存预热完成，成功: ${result.stats.successful}/${result.stats.total}`,
        stats: result.stats,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: '不支持的操作',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: '请求处理失败',
      message: error instanceof Error ? error.message : '未知错误',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
