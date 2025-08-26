import type { APIRoute } from 'astro';
import { defaultRSSConfig } from '@/utils/rss';
import type { RSSSource, RSSFeed } from '@/types';
import { XMLParser } from 'fast-xml-parser';

// 缓存存储（在实际部署中，这会被Vercel KV替代）
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取缓存数据
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  const cacheAge = now - cached.timestamp;

  if (cacheAge > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

// 设置缓存数据
function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// 带超时的fetch函数
async function fetchWithTimeout(url: string, timeoutMs: number = 3000): Promise<Response> {
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

// 解析单个RSS源（简化版）
async function fetchSingleSource(source: RSSSource): Promise<RSSFeed | null> {
  try {
    const response = await fetchWithTimeout(source.url, 3000); // 3秒超时
    
    if (!response.ok) {
      console.error(`RSS源 ${source.name} 请求失败: ${response.status}`);
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
    
    // 只取前20个条目
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

// 并行获取所有RSS源
async function fetchAllSourcesParallel(sources: RSSSource[]): Promise<{
  feeds: RSSFeed[];
  errors: string[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    fromCache: boolean;
  };
}> {
  // 使用Promise.allSettled并行请求所有源
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

  return {
    feeds,
    errors,
    stats: {
      total: sources.length,
      successful: feeds.length,
      failed: errors.length,
      fromCache: false,
    },
  };
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const sourceId = url.searchParams.get('source');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // 构建缓存键
    const cacheKey = sourceId ? `rss-source-${sourceId}` : 'rss-all-feeds';
    
    // 检查缓存（除非强制刷新）
    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`从缓存返回数据: ${cacheKey}`);
        return new Response(JSON.stringify({
          ...cachedData,
          stats: { ...cachedData.stats, fromCache: true }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60', // CDN缓存1分钟
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
    const startTime = Date.now();
    
    const result = await fetchAllSourcesParallel(sources);
    
    const endTime = Date.now();
    console.log(`获取完成，耗时: ${endTime - startTime}ms，成功: ${result.stats.successful}/${result.stats.total}`);
    
    // 构建响应数据
    const responseData = {
      feeds: result.feeds,
      errors: result.errors,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    };

    // 缓存结果
    setCachedData(cacheKey, responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
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

// 支持POST请求（可用于清除缓存等操作）
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (body.action === 'clear-cache') {
      cache.clear();
      return new Response(JSON.stringify({
        success: true,
        message: '缓存已清除',
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
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
