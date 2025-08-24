export interface SiteConfig {
	author: string;
	date: {
		locale: string | string[] | undefined;
		options: Intl.DateTimeFormatOptions;
	};
	description: string;
	lang: string;
	ogLocale: string;
	title: string;
}

export interface PaginationLink {
	srLabel?: string;
	text?: string;
	url: string;
}

export interface SiteMeta {
	articleDate?: string | undefined;
	description?: string;
	ogImage?: string | undefined;
	title: string;
}

/** Webmentions */
export interface WebmentionsFeed {
	children: WebmentionsChildren[];
	name: string;
	type: string;
}

export interface WebmentionsCache {
	children: WebmentionsChildren[];
	lastFetched: null | string;
}

export interface WebmentionsChildren {
	author: Author | null;
	content?: Content | null;
	"mention-of": string;
	name?: null | string;
	photo?: null | string[];
	published?: null | string;
	rels?: Rels | null;
	summary?: Summary | null;
	syndication?: null | string[];
	type: string;
	url: string;
	"wm-id": number;
	"wm-private": boolean;
	"wm-property": string;
	"wm-protocol": string;
	"wm-received": string;
	"wm-source": string;
	"wm-target": string;
}

export interface Author {
	name: string;
	photo: string;
	type: string;
	url: string;
}

export interface Content {
	"content-type": string;
	html: string;
	text: string;
	value: string;
}

export interface Rels {
	canonical: string;
}

export interface Summary {
	"content-type": string;
	value: string;
}

export type AdmonitionType = "tip" | "note" | "important" | "caution" | "warning";

// RSS相关类型定义
export interface RSSSource {
  id: string;
  name: string;
  url: string;
  description?: string;
  category?: string;
  language?: string;
  lastBuildDate?: string;
  ttl?: number;
  imageUrl?: string;
  itemCount?: number;
  isActive?: boolean;
  enabled?: boolean; // 添加enabled属性
  lastFetched?: string;
  fetchInterval?: number; // 分钟
}

export interface RSSItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string[];
  sourceId: string;
  sourceName: string;
  guid?: string;
  imageUrl?: string | undefined;
  read?: boolean;
}

export interface RSSFeed {
  source: RSSSource;
  items: RSSItem[];
  lastBuildDate?: string;
  ttl?: number | undefined;
}

export interface RSSConfig {
  sources: RSSSource[];
  defaultFetchInterval: number;
  maxItemsPerSource: number;
  cacheEnabled: boolean;
  cacheDuration: number; // 分钟
}

export interface RSSState {
  feeds: RSSFeed[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
