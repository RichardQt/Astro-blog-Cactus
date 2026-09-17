import { XMLParser } from "fast-xml-parser";

const sources = [
  { id: "sanhua", name: "三花AI资讯", url: "https://sanhua.himrr.com/daily-news/feed" },
  { id: "qbitai", name: "量子位", url: "https://www.qbitai.com/feed" },
  { id: "aibase", name: "AI Base 资讯", url: "https://rsshub.bestblogs.dev/aibase/news" },
  { id: "zhihu", name: "知乎热榜", url: "https://rsshub.bestblogs.dev/zhihu/hot" },
  { id: "readhub", name: "Readhub 科技", url: "https://rsshub.bestblogs.dev/readhub/daily" },
  { id: "kr36", name: "36氪热榜", url: "https://rsshub.bestblogs.dev/36kr/hot-list" },
  { id: "juejinweekly", name: "掘金本周最热", url: "https://rsshub.bestblogs.dev/juejin/trending/all/weekly" },
  { id: "hellogithub", name: "HelloGitHub", url: "https://hellogithub.com/rss" },
  { id: "freecodecamp", name: "freeCodeCamp", url: "https://www.freecodecamp.org/news/rss/" },
  { id: "bytebytego", name: "ByteByteGo", url: "https://blog.bytebytego.com/feed" },
  { id: "v2ex", name: "V2EX 社区", url: "https://www.v2ex.com/index.xml" },
  { id: "meowweekly", name: "猫鱼周刊", url: "https://ameow.xyz/feed/categories/weekly.xml" },
  { id: "ruanyifeng", name: "阮一峰的网络日志", url: "http://feeds.feedburner.com/ruanyifeng" },
  { id: "baoyublog", name: "宝玉的blog", url: "https://s.baoyu.io/feed.xml" },
  { id: "sspai", name: "少数派", url: "https://sspai.com/feed" },
];

async function testAll() {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  console.log(`Starting RSS health check for ${sources.length} sources...\n`);
  let success = 0;

  for (const s of sources) {
    try {
      const res = await fetch(s.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const root = parsed.rss || parsed.feed;
      if (!root) throw new Error("Missing rss/feed root element");
      const channel = root.channel || root;
      const items = channel.item || channel.entry || [];
      const count = Array.isArray(items) ? items.length : (items ? 1 : 0);
      console.log(`[PASS] ${s.name.padEnd(12)} (${s.id}) -> ${count} items`);
      success++;
    } catch (err) {
      console.error(`[FAIL] ${s.name.padEnd(12)} (${s.id}) -> ${err.message}`);
    }
  }

  console.log(`\nSummary: ${success}/${sources.length} sources available.`);
  if (success < sources.length) {
    process.exitCode = 1;
  }
}

testAll();
