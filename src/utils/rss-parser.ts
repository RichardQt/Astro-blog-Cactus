// @ts-nocheck - 临时禁用类型检查以解决依赖问题
import { XMLParser } from 'fast-xml-parser';

// 添加日志记录函数
function logError(message: string, error?: any) {
  console.error(`[RSS Parser] ${message}`, error);
}

function logWarning(message: string) {
  console.warn(`[RSS Parser] ${message}`);
}

function logInfo(message: string) {
  console.info(`[RSS Parser] ${message}`);
}

// 简化的HTML清理函数，避免依赖isomorphic-dompurify
function cleanContent(content: string | undefined, maxLength: number = 500): string {
  if (!content) return '';
  
  // 移除HTML标签但保留文本内容
  let clean = content.replace(/<[^>]*>/g, ' ');
  
  // 解码HTML实体
  clean = clean
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'");
  
  // 清理多余空格
  clean = clean.trim().replace(/\s+/g, ' ');
  
  // 限制长度
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength) + '...';
  }
  
  return clean;
}

interface ParseOptions {
  fallbackValues?: Record<string, string>;
  maxContentLength?: number;
}

// 定义默认值配置接口
interface FallbackValues {
  title: string;
  description: string;
  content: string;
  author: string;
  category: string;
  link: string;
  image: string;
  [key: string]: string;
}

interface ParsedRSS {
  feed: any;
  items: any[];
  format: 'rss2' | 'atom1' | 'rss1' | 'unknown';
}

export class RSSParser {
  private parser: XMLParser;
  private options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.options = {
      fallbackValues: {
        title: '无标题',
        description: '无描述',
        content: '无内容',
        author: '未知作者',
        category: '未分类',
        link: '#',
        image: '',
        ...options.fallbackValues,
      },
      maxContentLength: 500,
      ...options,
    };

    // 验证默认值配置（如果需要的话）
    // this.validateFallbackValues(this.options.fallbackValues);

    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });
  }

  async parseRSS(xmlContent: string, source: any): Promise<ParsedRSS> {
    try {
      // 检查输入内容
      if (!xmlContent || xmlContent.trim().length === 0) {
        logWarning(`RSS源 ${source.name} 内容为空`);
        return this.createEmptyResult(source);
      }
      
      // 预处理XML内容，移除BOM和控制字符
      const cleanXmlContent = this.preprocessXml(xmlContent);
      
      const parsed = this.parser.parse(cleanXmlContent);
      
      // 检测RSS格式类型
      const format = this.detectFormat(parsed);
      logInfo(`检测到RSS源 ${source.name} 格式: ${format}`);
      
      // 根据格式解析
      switch (format) {
        case 'atom1':
          return this.parseAtom(parsed, source);
        case 'rss1':
          return this.parseRSS1(parsed, source);
        case 'rss2':
          return this.parseRSS2(parsed, source);
        default:
          logWarning(`RSS源 ${source.name} 使用未知格式，尝试使用RSS2解析`);
          return this.parseRSS2(parsed, source);
      }
    } catch (error) {
      logError(`RSS源 ${source.name} 解析失败:`, error);
      // 降级处理：返回空结果而不是抛出异常
      return this.createFallbackResult(source, error);
    }
  }

  private detectFormat(parsed: any): 'rss2' | 'atom1' | 'rss1' | 'unknown' {
    try {
      if (parsed?.rss?.channel) return 'rss2';
      if (parsed?.feed?.entry) return 'atom1';
      if (parsed?.['rdf:RDF']?.item) return 'rss1';
      return 'unknown';
    } catch (error) {
      logError('检测RSS格式时出错:', error);
      return 'unknown';
    }
  }

  private parseRSS2(parsed: any, source: any): ParsedRSS {
    const channel = parsed.rss.channel;
    
    // 验证必要字段
    if (!channel) {
      logWarning(`RSS源 ${source.name} 缺少频道信息`);
      return this.createEmptyResult(source);
    }
    
    const feed = {
      title: this.getTextContent(channel.title) || this.options.fallbackValues!.title!,
      description: this.getTextContent(channel.description) || this.options.fallbackValues!.description!,
      link: this.getTextContent(channel.link) || source.url,
      language: this.getTextContent(channel.language),
      lastBuildDate: this.parseDate(this.getTextContent(channel.lastBuildDate)),
      generator: this.getTextContent(channel.generator),
      image: this.extractImage(channel),
      categories: this.extractCategories(channel),
      source: source.name,
    };

    // 验证items数组
    let itemsArray = channel.item || [];
    if (!Array.isArray(itemsArray)) {
      itemsArray = [itemsArray];
    }
    
    const items = this.parseItems(itemsArray, source, 'rss2');
    
    return { feed, items, format: 'rss2' };
  }

  private parseAtom(parsed: any, source: any): ParsedRSS {
    const feedData = parsed.feed;
    
    // 验证必要字段
    if (!feedData) {
      logWarning(`Atom源 ${source.name} 缺少feed数据`);
      return this.createEmptyResult(source);
    }
    
    const feed = {
      title: this.getTextContent(feedData.title) || this.options.fallbackValues!.title!,
      description: this.getTextContent(feedData.subtitle) || this.options.fallbackValues!.description!,
      link: this.extractAtomLink(feedData),
      language: this.getTextContent(feedData['@_xml:lang']),
      lastBuildDate: this.parseDate(this.getTextContent(feedData.updated)),
      generator: this.getTextContent(feedData.generator),
      image: this.extractAtomImage(feedData),
      categories: this.extractAtomCategories(feedData),
      source: source.name,
    };

    // 验证entries数组
    let entriesArray = feedData.entry || [];
    if (!Array.isArray(entriesArray)) {
      entriesArray = [entriesArray];
    }
    
    const items = this.parseAtomItems(entriesArray, source);
    
    return { feed, items, format: 'atom1' };
  }

  private parseRSS1(parsed: any, source: any): ParsedRSS {
    const rdf = parsed['rdf:RDF'];
    
    // 验证必要字段
    if (!rdf) {
      logWarning(`RSS 1.0源 ${source.name} 缺少RDF数据`);
      return this.createEmptyResult(source);
    }
    
    const channel = rdf.channel;
    
    // 验证频道信息
    if (!channel) {
      logWarning(`RSS 1.0源 ${source.name} 缺少频道信息`);
      return this.createEmptyResult(source);
    }
    
    const feed = {
      title: this.getTextContent(channel.title) || this.options.fallbackValues!.title!,
      description: this.getTextContent(channel.description) || this.options.fallbackValues!.description!,
      link: this.getTextContent(channel.link) || source.url,
      language: this.getTextContent(channel['@_xml:lang']),
      lastBuildDate: this.parseDate(this.getTextContent(channel['dc:date'])),
      generator: undefined,
      image: this.extractRSS1Image(rdf),
      categories: this.extractRSS1Categories(rdf),
      source: source.name,
    };

    // 验证items数组
    let itemsArray = rdf.item || [];
    if (!Array.isArray(itemsArray)) {
      itemsArray = [itemsArray];
    }
    
    const items = this.parseRSS1Items(itemsArray, source);
    
    return { feed, items, format: 'rss1' };
  }

  private parseItems(items: any[], source: any, format: string): any[] {
    return items.map((item, index) => ({
      id: this.generateItemId(item, source, index),
      title: cleanContent(this.getTextContent(item.title) || this.options.fallbackValues!.title!),
      description: cleanContent(this.getTextContent(item.description || item.summary)),
      content: cleanContent(this.getTextContent(item['content:encoded'] || item.content)),
      link: this.getTextContent(item.link || item.guid || item.id),
      author: this.getTextContent(item.author || item['dc:creator'] || item.creator),
      pubDate: this.parseDate(this.getTextContent(item.pubDate || item.published || item['dc:date'])),
      category: this.getFirstCategory(item.category || item.categories),
      image: this.extractItemImage(item),
      sourceId: source.id,
      sourceName: source.name,
    }));
  }

  private parseAtomItems(entries: any[], source: any): any[] {
    return entries.map((entry, index) => ({
      id: this.getTextContent(entry.id) || this.generateItemId(entry, source, index),
      title: cleanContent(this.getTextContent(entry.title) || this.options.fallbackValues!.title!),
      description: cleanContent(this.getTextContent(entry.summary)),
      content: cleanContent(this.getTextContent(entry.content)),
      link: this.extractAtomLink(entry),
      author: this.extractAtomAuthor(entry),
      pubDate: this.parseDate(this.getTextContent(entry.published || entry.updated)),
      category: this.extractAtomCategories(entry)[0],
      image: this.extractAtomItemImage(entry),
      sourceId: source.id,
      sourceName: source.name,
    }));
  }

  private parseRSS1Items(items: any[], source: any): any[] {
    return items.map((item, index) => ({
      id: this.getTextContent(item['@_rdf:about']) || this.generateItemId(item, source, index),
      title: cleanContent(this.getTextContent(item.title) || this.options.fallbackValues!.title!),
      description: cleanContent(this.getTextContent(item.description)),
      content: cleanContent(this.getTextContent(item['content:encoded'])),
      link: this.getTextContent(item.link) || this.getTextContent(item['@_rdf:about']),
      author: this.getTextContent(item['dc:creator']),
      pubDate: this.parseDate(this.getTextContent(item['dc:date'])),
      category: this.getFirstCategory(item['dc:subject']),
      image: this.extractRSS1ItemImage(item),
      sourceId: source.id,
      sourceName: source.name,
    }));
  }

  private extractImage(channel: any): string | undefined {
    if (channel.image) {
      return this.getTextContent(channel.image.url);
    }
    return undefined;
  }

  private extractAtomImage(feedData: any): string | undefined {
    const logo = this.getTextContent(feedData.logo);
    if (logo) return logo;
    
    const icon = this.getTextContent(feedData.icon);
    if (icon) return icon;
    
    return undefined;
  }

  private extractRSS1Image(rdf: any): string | undefined {
    const image = rdf.image;
    if (image && image.url) {
      return this.getTextContent(image.url);
    }
    return undefined;
  }

  private extractItemImage(item: any): string | undefined {
    const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure];
    const imageEnclosure = enclosures.find((enc: any) => 
      enc && enc['@_type'] && enc['@_type'].startsWith('image/')
    );
    
    if (imageEnclosure) {
      return imageEnclosure['@_url'];
    }

    // 从内容中提取图片
    const content = this.getTextContent(item['content:encoded'] || item.description || item.content);
    if (content) {
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return undefined;
  }

  private extractAtomItemImage(entry: any): string | undefined {
    const links = Array.isArray(entry.link) ? entry.link : [entry.link];
    const imageLink = links.find((link: any) => 
      link && link['@_rel'] === 'enclosure' && link['@_type'] && link['@_type'].startsWith('image/')
    );
    
    if (imageLink) {
      return imageLink['@_href'];
    }

    const content = this.getTextContent(entry.content || entry.summary);
    if (content) {
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return undefined;
  }

  private extractRSS1ItemImage(item: any): string | undefined {
    const content = this.getTextContent(item['content:encoded'] || item.description);
    if (content) {
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }
    return undefined;
  }

  private extractCategories(channel: any): string[] {
    const categories = channel.category || [];
    return Array.isArray(categories) 
      ? categories.map((cat: any) => this.getTextContent(cat)).filter(Boolean)
      : [this.getTextContent(categories)].filter(Boolean);
  }

  private extractAtomCategories(feedData: any): string[] {
    const categories = feedData.category || [];
    return Array.isArray(categories)
      ? categories.map((cat: any) => this.getTextContent(cat['@_term'] || cat)).filter(Boolean)
      : [this.getTextContent(categories['@_term'] || categories)].filter(Boolean);
  }

  private extractRSS1Categories(rdf: any): string[] {
    const subjects = rdf['dc:subject'] || [];
    return Array.isArray(subjects)
      ? subjects.map((sub: any) => this.getTextContent(sub)).filter(Boolean)
      : [this.getTextContent(subjects)].filter(Boolean);
  }

  private extractAtomLink(data: any): string {
    const links = Array.isArray(data.link) ? data.link : [data.link];
    const alternateLink = links.find((link: any) => !link['@_rel'] || link['@_rel'] === 'alternate');
    return alternateLink ? alternateLink['@_href'] : '';
  }

  private extractAtomAuthor(entry: any): string {
    const author = entry.author;
    if (author) {
      return this.getTextContent(author.name) || this.getTextContent(author.email) || this.options.fallbackValues!.author!;
    }
    return this.options.fallbackValues!.author!;
  }

  private getTextContent(value: any): string | undefined {
    if (typeof value === 'string') return value.trim();
    if (value && typeof value === 'object' && value['#text']) return value['#text'].trim();
    return undefined;
  }

  private getFirstCategory(categories: any): string {
    try {
      if (!categories) return this.options.fallbackValues!.category!;
      
      if (Array.isArray(categories)) {
        return this.getTextContent(categories[0]) || this.options.fallbackValues!.category!;
      }
      
      return this.getTextContent(categories) || this.options.fallbackValues!.category!;
    } catch (error) {
      logError('获取分类时出错:', error);
      return this.options.fallbackValues!.category!;
    }
  }

  private parseDate(dateStr: string | undefined): string {
    if (!dateStr) return new Date().toISOString();
    
    try {
      if (!dateStr) return new Date().toISOString();
      
      // 尝试多种日期格式
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // 处理Unix时间戳
      const timestamp = parseInt(dateStr, 10);
      if (!isNaN(timestamp)) {
        // 检查是否是秒级时间戳（长度为10）或毫秒级时间戳（长度为13）
        if (dateStr.length === 10) {
          return new Date(timestamp * 1000).toISOString();
        } else if (dateStr.length === 13) {
          return new Date(timestamp).toISOString();
        }
      }
      
      // 尝试其他常见日期格式
      const formats = [
        // RFC 2822
        () => new Date(dateStr),
        // 自定义格式
        () => {
          // YYYY-MM-DD HH:mm:ss
          const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
          if (match) {
            return new Date(`${match[1]}T${match[2]}`);
          }
          return null;
        }
      ];
      
      for (const format of formats) {
        try {
          const date = format();
          if (date && !isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (e) {
          // 忽略单个格式的错误
          continue;
        }
      }
      
      logWarning(`无法解析日期字符串: ${dateStr}`);
      return new Date().toISOString();
    } catch (error) {
      logError('解析日期时发生错误:', error);
      return new Date().toISOString();
    }
  }

  private generateItemId(item: any, source: any, index: number): string {
    const link = this.getTextContent(item.link || item.guid || item.id);
    if (link) {
      // 使用简单的哈希函数替代Buffer
      let hash = 0;
      for (let i = 0; i < link.length; i++) {
        const char = link.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      return `${source.name}_${Math.abs(hash).toString(36).substring(0, 8)}`;
    }
    
    return `${source.name}_${Date.now()}_${index}`;
  }

  // 添加预处理XML内容的方法
  private preprocessXml(xmlContent: string): string {
    try {
      // 移除BOM标记
      let cleanContent = xmlContent.replace(/^\uFEFF/, '');
      
      // 移除控制字符（除了制表符、换行符、回车符）
      cleanContent = cleanContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      return cleanContent;
    } catch (error) {
      logError('预处理XML内容时出错:', error);
      return xmlContent;
    }
  }

  // 添加创建空结果的方法
  private createEmptyResult(source: any): ParsedRSS {
    return {
      feed: {
        title: source.name,
        description: '暂无内容',
        link: source.url,
        source: source.name,
      },
      items: [],
      format: 'unknown'
    };
  }

  // 添加降级处理方法
  private createFallbackResult(source: any, error: any): ParsedRSS {
    logWarning(`RSS源 ${source.name} 解析失败，使用降级处理`);
    
    return {
      feed: {
        title: source.name,
        description: `内容解析失败: ${error.message || '未知错误'}`,
        link: source.url,
        source: source.name,
      },
      items: [],
      format: 'unknown'
    };
  }
}

// 导出单例实例
export const rssParser = new RSSParser();