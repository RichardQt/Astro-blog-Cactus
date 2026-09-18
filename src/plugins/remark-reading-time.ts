import { toString as mdastToString } from "mdast-util-to-string";

/**
 * 专为中文与多语言技术博客优化的阅读时长与字数统计插件。
 * 准确统计 CJK 汉字字符数与英文单词数，并输出符合中文阅读习惯的优雅文本。
 */
export function remarkReadingTime() {
	// @ts-expect-error:next-line
	return (tree, { data }) => {
		const textOnPage = mdastToString(tree);
		if (!textOnPage) {
			data.astro.frontmatter.readingTime = "约 1 分钟";
			return;
		}

		// 统计汉字数 (CJK Unified Ideographs)
		const cjkMatches = textOnPage.match(/[\u4e00-\u9fa5\u3400-\u4dbf]/g);
		const cjkCount = cjkMatches ? cjkMatches.length : 0;

		// 排除汉字后统计英文与数字词数
		const nonCjkText = textOnPage.replace(/[\u4e00-\u9fa5\u3400-\u4dbf]/g, " ");
		const enWordMatches = nonCjkText.match(/\b[a-zA-Z0-9_\-']+\b/g);
		const enWordCount = enWordMatches ? enWordMatches.length : 0;

		const totalWords = cjkCount + enWordCount;

		// 中文按 300 字/分钟，英文按 180 词/分钟估算
		const minutes = Math.max(1, Math.ceil(cjkCount / 300 + enWordCount / 180));

		const wordLabel =
			totalWords >= 1000
				? `${(totalWords / 1000).toFixed(1)}k 字`
				: `${totalWords} 字`;

		data.astro.frontmatter.readingTime = `共 ${wordLabel} · 约 ${minutes} 分钟`;
	};
}
