import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * 自动为 Markdown 内联图片注入 loading="lazy" 与 decoding="async"，
 * 避免长图文首屏并发请求抢占网络带宽。
 */
export const rehypeLazyImages: Plugin<[], Root> = () => (tree) => {
	visit(tree, "element", (node: Element) => {
		if (node.tagName === "img" && node.properties) {
			if (!node.properties.loading) {
				node.properties.loading = "lazy";
			}
			if (!node.properties.decoding) {
				node.properties.decoding = "async";
			}
		}
	});
};
