import type { RSSSource, RSSItem, RSSFeed, RSSConfig, RSSState } from "@/types";
import { XMLParser } from "fast-xml-parser";
import DOMPurify from 'dompurify';

/**
 * 默认RSS配置
 */
export const defaultRSSConfig: RSSConfig = {
    sources: [
        {
            id: "sanhua",
            name: "三花AI资讯",
            url: "https://sanhua.himrr.com/daily-news/feed",
            description: "AI行业热点与产品前沿快讯",
            category: "AI资讯",
        },
        {
            id: "qbitai",
            name: "量子位",
            url: "https://www.qbitai.com/feed",
            description: "追踪人工智能与前沿科技新动态",
            category: "AI资讯",
        },
        {
            id: "aibase",
            name: "AI Base 资讯",
            url: "https://rsshub.bestblogs.dev/aibase/news",
            description: "全球人工智能创新产品与大模型资讯",
            category: "AI资讯",
        },
        {
            id: "zhihu",
            name: "知乎热榜",
            url: "https://rsshub.bestblogs.dev/zhihu/hot",
            description: "知乎全站实时热搜与高赞讨论",
            category: "热榜",
        },
        {
            id: "readhub",
            name: "Readhub 科技",
            url: "https://rsshub.bestblogs.dev/readhub/daily",
            description: "科技圈热门事件聚合与每日早报",
            category: "热榜",
        },
        {
            id: "kr36",
            name: "36氪热榜",
            url: "https://rsshub.bestblogs.dev/36kr/hot-list",
            description: "聚焦前沿科技、创投与创新商业热门榜单",
            category: "热榜",
        },
        {
            id: "juejinweekly",
            name: "掘金本周最热",
            url: "https://rsshub.bestblogs.dev/juejin/trending/all/weekly",
            description: "掘金开发者社区每周最受欢迎技术文章",
            category: "开发",
        },
        {
            id: "hellogithub",
            name: "HelloGitHub",
            url: "https://hellogithub.com/rss",
            description: "分享 GitHub 上有趣、有用的开源项目",
            category: "开发",
        },
        {
            id: "freecodecamp",
            name: "freeCodeCamp",
            url: "https://www.freecodecamp.org/news/rss/",
            description: "全球开源开发者学习社区精选教程",
            category: "开发",
        },
        {
            id: "bytebytego",
            name: "ByteByteGo",
            url: "https://blog.bytebytego.com/feed",
            description: "深入解析高并发分布式系统与架构设计",
            category: "开发",
        },
        {
            id: "v2ex",
            name: "V2EX 社区",
            url: "https://www.v2ex.com/index.xml",
            description: "创意工作者、极客与开发者热门讨论",
            category: "开发",
        },
        {
            id: "meowweekly",
            name: "猫鱼周刊",
            url: "https://ameow.xyz/feed/categories/weekly.xml",
            description: "见闻、思考与生活方式精选周刊",
            category: "分享与动态",
        },
        {
            id: "ruanyifeng",
            name: "阮一峰的网络日志",
            url: "http://feeds.feedburner.com/ruanyifeng",
            description: "每周科技爱好者周刊与技术深度随笔",
            category: "分享与动态",
        },
        {
            id: "baoyublog",
            name: "宝玉的blog",
            url: "https://s.baoyu.io/feed.xml",
            description: "软件工程实践、AI重塑开发流程思考",
            category: "blog",
        },
        {
            id: "sspai",
            name: "少数派",
            url: "https://sspai.com/feed",
            description: "高效数字生活、优质软硬件测评与生产力工具",
            category: "分享与动态",
        },
    ],
    defaultFetchInterval: 60,
    maxItemsPerSource: 20,
    cacheEnabled: true,
    cacheDuration: 30, // 30分钟
};

/**
 * RSS状态管理
 */
class RSSManager {
    private config: RSSConfig;
    private state: RSSState;
    private cache: Map<string, { data: any; timestamp: number }>;

    constructor(config: RSSConfig = defaultRSSConfig) {
        this.config = config;
        this.state = {
            feeds: [],
            loading: false,
            error: null,
            lastUpdated: null,
        };
        this.cache = new Map();
    }

    /**
     * 获取缓存数据
     */
    private getCachedData(key: string): any | null {
        if (!this.config.cacheEnabled) return null;

        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        const cacheAge = (now - cached.timestamp) / (1000 * 60); // 分钟

        if (cacheAge > this.config.cacheDuration) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * 设置缓存数据
     */
    private setCachedData(key: string, data: any): void {
        if (!this.config.cacheEnabled) return;

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * 解析RSS XML内容
     */
    private async parseRSSXML(xmlText: string, source: RSSSource): Promise<RSSFeed> {
        try {
            // 使用fast-xml-parser解析XML
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: "@_",
                textNodeName: "#text",
                parseAttributeValue: true,
                parseTagValue: true,
                trimValues: true,
            });

            const result = parser.parse(xmlText);

            // 检查是否为有效的RSS格式
            const rss = result.rss || result.feed;
            if (!rss) {
                throw new Error("无效的RSS格式：缺少rss或feed根元素");
            }

            const channel = rss.channel || rss;
            if (!channel) {
                throw new Error("无效的RSS格式：缺少channel元素");
            }

            const items: RSSItem[] = [];
            const itemElements = channel.item || channel.entry || [];

            // 确保itemElements是数组
            const itemsArray = Array.isArray(itemElements) ? itemElements : [itemElements];

            itemsArray.forEach((item: any, index: number) => {
                try {
                    if (!item) return;

                    const title = this.getElementValue(item, "title");
                    const link = this.getElementValue(item, "link");
                    const description = this.getElementValue(item, "description") || this.getElementValue(item, "summary");
                    const content = this.getElementValue(item, "content:encoded") || this.getElementValue(item, "content");
                    const pubDate = this.getElementValue(item, "pubDate") || this.getElementValue(item, "published") || this.getElementValue(item, "updated");
                    let author = this.getElementValue(item, "author") || this.getElementValue(item, "dc:creator");
                    if (!author && item.author?.name) {
                        author = typeof item.author.name === 'string' ? item.author.name.trim() : item.author.name['#text'] || '';
                    }
                    const guid = this.getElementValue(item, "guid") || this.getElementValue(item, "id");

                    // 解析分类
                    const categories = this.parseCategories(item);

                    // 查找图片
                    const imageUrl = this.parseImageUrl(item);

                    if (title && link) {
                        const rssItem: RSSItem = {
                            id: `${source.id}-${index}`,
                            title,
                            description,
                            content: content || description,
                            link,
                            pubDate: pubDate || new Date().toISOString(),
                            author,
                            category: categories,
                            sourceId: source.id,
                            sourceName: source.name,
                            guid,
                            imageUrl,
                            read: false,
                        };
                        items.push(rssItem);
                    }
                } catch (error) {
                    console.warn(`解析RSS项目失败:`, error);
                }
            });

            const feed: RSSFeed = {
                source,
                items: items.slice(0, this.config.maxItemsPerSource),
                lastBuildDate: this.getElementValue(channel, "lastBuildDate"),
                ttl: this.parseTTL(channel),
            };

            return feed;
        } catch (error) {
            throw new Error(`解析RSS失败 (${source.name}): ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }


    /**
     * 从fast-xml-parser对象中获取元素值
     */
    private getElementValue(obj: any, key: string): string {
        if (!obj) return "";

        // 特殊处理 link 属性为对象或数组的情况 (Atom 规范支持)
        if (key === 'link') {
            if (typeof obj.link === 'string') return obj.link.trim();
            if (obj.link?.['#text']) return obj.link['#text'].trim();
            if (obj.link?.['@_href']) return obj.link['@_href'].trim();
            if (Array.isArray(obj.link)) {
                const alt = obj.link.find((l: any) => l?.['@_rel'] === 'alternate' || l?.['@_href']);
                if (alt?.['@_href']) return alt['@_href'].trim();
                if (alt?.['#text']) return alt['#text'].trim();
            }
        }

        // 直接访问属性
        if (obj[key] !== undefined) {
            const value = obj[key];
            if (typeof value === 'string') return value.trim();
            if (value?.['#text']) return String(value['#text']).trim();
            if (typeof value === 'object' && value?.['@_href']) return String(value['@_href']).trim();
        }

        // 处理带命名空间的属性
        const namespacedKey = key.replace(':', '');
        if (obj[namespacedKey] !== undefined) {
            const value = obj[namespacedKey];
            if (typeof value === 'string') return value.trim();
            if (value?.['#text']) return String(value['#text']).trim();
            if (typeof value === 'object' && value?.['@_href']) return String(value['@_href']).trim();
        }

        return "";
    }

    /**
     * 解析分类信息
     */
    private parseCategories(item: any): string[] {
        if (!item) return [];

        const categories: string[] = [];

        // 处理category数组
        if (item.category) {
            const catArray = Array.isArray(item.category) ? item.category : [item.category];
            catArray.forEach((cat: any) => {
                if (typeof cat === 'string') {
                    categories.push(cat.trim());
                } else if (cat['#text']) {
                    categories.push(cat['#text'].trim());
                } else if (cat['@_text']) {
                    categories.push(cat['@_text'].trim());
                }
            });
        }

        return categories.filter(Boolean);
    }

    /**
     * 解析图片URL
     */
    private parseImageUrl(item: any): string | undefined {
        if (!item) return undefined;

        // 查找enclosure中的图片
        if (item.enclosure) {
            const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
            for (const enclosure of enclosures) {
                if (enclosure['@_type']?.startsWith('image/') && enclosure['@_url']) {
                    return enclosure['@_url'];
                }
            }
        }

        // 查找content:encoded中的图片
        if (item['content:encoded']) {
            const content = this.getElementValue(item, 'content:encoded');
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
            if (imgMatch) {
                return imgMatch[1];
            }
        }

        return undefined;
    }

    /**
     * 解析TTL值
     */
    private parseTTL(channel: any): number | undefined {
        if (!channel) return undefined;

        const ttlValue = this.getElementValue(channel, 'ttl');
        if (ttlValue) {
            const ttl = parseInt(ttlValue, 10);
            return isNaN(ttl) ? undefined : ttl;
        }

        return undefined;
    }

    /**
     * 获取RSS源数据
     */
    async fetchRSSSource(source: RSSSource): Promise<RSSFeed> {
        const cacheKey = `rss-${source.id}`;

        // 检查缓存
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(source.url, {
                signal: AbortSignal.timeout(6000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            const xmlText = await response.text();
            const feed = await this.parseRSSXML(xmlText, source);

            // 缓存结果
            this.setCachedData(cacheKey, feed);

            return feed;
        } catch (error) {
            throw new Error(`获取RSS源失败 (${source.name}): ${error instanceof Error ? error.message : '网络错误'}`);
        }
    }

    /**
     * 获取所有RSS源数据
     */
    async fetchAllRSSSources(): Promise<RSSFeed[]> {
        this.state.loading = true;
        this.state.error = null;

        try {
            const feedPromises = this.config.sources.map(source => this.fetchRSSSource(source));
            const feeds = await Promise.allSettled(feedPromises);

            const successfulFeeds: RSSFeed[] = [];
            const errors: string[] = [];

            feeds.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulFeeds.push(result.value);
                } else {
                    const sourceName = this.config.sources[index]?.name || `源 ${index + 1}`;
                    errors.push(`${sourceName}: ${result.reason.message}`);
                }
            });

            this.state.feeds = successfulFeeds;
            this.state.lastUpdated = new Date().toISOString();

            if (errors.length > 0) {
                this.state.error = `部分源获取失败: ${errors.join(', ')}`;
            }

            return successfulFeeds;
        } catch (error) {
            this.state.error = error instanceof Error ? error.message : '获取RSS数据失败';
            throw error;
        } finally {
            this.state.loading = false;
        }
    }

    /**
     * 根据ID获取RSS项目
     */
    getRSSItemById(id: string): RSSItem | null {
        for (const feed of this.state.feeds) {
            const item = feed.items.find(item => item.id === id);
            if (item) return item;
        }
        return null;
    }

    /**
     * 根据源ID获取RSS源
     */
    getRSSSourceById(id: string): RSSSource | null {
        return this.config.sources.find(source => source.id === id) || null;
    }

    /**
     * 标记项目为已读
     */
    markAsRead(itemId: string): void {
        for (const feed of this.state.feeds) {
            const item = feed.items.find(item => item.id === itemId);
            if (item) {
                item.read = true;
                break;
            }
        }
    }

    /**
     * 获取当前状态
     */
    getState(): RSSState {
        return { ...this.state };
    }

    /**
     * 获取配置
     */
    getConfig(): RSSConfig {
        return { ...this.config };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<RSSConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * 获取所有RSS源
     */
    getSources(): RSSSource[] {
        return this.config.sources;
    }

    /**
     * 根据ID获取RSS源
     */
    getSourceById(id: string): RSSSource | null {
        return this.config.sources.find(source => source.id === id) || null;
    }

    /**
     * 获取RSS源的Feed数据
     */
    async getFeed(sourceId: string): Promise<RSSFeed | null> {
        const source = this.getSourceById(sourceId);
        if (!source) {
            throw new Error(`未找到ID为 ${sourceId} 的RSS源`);
        }

        try {
            const feed = await this.fetchRSSSource(source);
            return feed;
        } catch (error) {
            console.error(`获取RSS源 ${source.name} 失败:`, error);
            return null;
        }
    }

    /**
     * 获取所有Feed数据
     */
    async getAllFeeds(): Promise<RSSFeed[]> {
        return await this.fetchAllRSSSources();
    }
}

// 导出单例实例
export const rssManager = new RSSManager();

/**
 * 工具函数：格式化日期为北京时间
 */
export function formatRSSDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        // 使用北京时区 (Asia/Shanghai) 进行格式化
        return date.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 使用24小时制
        });
    } catch {
        return dateString;
    }
}

/**
 * 工具函数：截断文本
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * DOMPurify默认配置
 * 允许安全的HTML标签和属性
 */
const defaultDOMPurifyConfig = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'sub', 'sup'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout'],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_JQUERY: true,
    USE_PROFILES: { html: true }
};

/**
 * 工具函数：清理HTML内容
 * 使用DOMPurify进行安全的HTML清理，保留必要的格式同时移除潜在威胁
 */
export function cleanHTML(html: string, config = defaultDOMPurifyConfig): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    try {
        // 使用DOMPurify清理HTML
        const cleanContent = DOMPurify.sanitize(html, config);

        // 清理多余的空白字符，但保留基本的段落结构
        return cleanContent.replace(/\s+/g, ' ').trim();
    } catch (error) {
        console.warn('DOMPurify HTML清理失败，回退到简单清理:', error);

        // 如果DOMPurify失败，使用简单的正则表达式作为回退
        const textContent = html.replace(/<[^>]*>/g, ' ');
        return textContent.replace(/\s+/g, ' ').trim();
    }
}

/**
 * 工具函数：获取阅读时间估算
 */
export function estimateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / wordsPerMinute));
}