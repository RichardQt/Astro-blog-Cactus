/**
 * 单向同步：Obsidian 发布区 → Astro content
 *
 * 博客/  → src/content/post
 * 随记/  → src/content/note
 *
 * 规则：
 * - 只拷贝顶层 .md，不碰 dest 里的 demo/ 等子目录
 * - 缺 title / description / publishDate 的文件跳过
 * - 笔记日期必须是 YYYY-MM-DD HH:mm 或 YYYY-MM-DDTHH:mm
 * - 默认不删除站点多出来的文件；加 --prune 才会删 dest 顶层多余 .md
 *
 * 用法：
 *   node scripts/sync-obsidian.mjs --dry-run
 *   node scripts/sync-obsidian.mjs
 *   node scripts/sync-obsidian.mjs --prune
 *
 * 库路径：环境变量 OBSIDIAN_VAULT，或默认 D:\Obsidan_project\richardli-brain
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const prune = args.has("--prune");

const vaultRoot =
	process.env.OBSIDIAN_VAULT || "D:\\Obsidan_project\\richardli-brain";

const mappings = [
	{
		kind: "post",
		src: path.join(vaultRoot, "博客"),
		dest: path.join(repoRoot, "src", "content", "post"),
	},
	{
		kind: "note",
		src: path.join(vaultRoot, "随记"),
		dest: path.join(repoRoot, "src", "content", "note"),
	},
];

const NOTE_DATE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}$/;
const WIKI = /(!\[\[[^\]]+\]\]|(?<![:\\])\[\[[^\]]+\]\]|>\s*\[![A-Za-z]+|```dataview)/;

function decodeBuffer(buf) {
	if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
		return buf.toString("utf16le", 2);
	}
	if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
		const swapped = Buffer.alloc(buf.length - 2);
		for (let i = 2; i + 1 < buf.length; i += 2) {
			swapped[i - 2] = buf[i + 1];
			swapped[i - 1] = buf[i];
		}
		return swapped.toString("utf16le");
	}
	if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
		return buf.toString("utf8", 3);
	}
	const utf8 = buf.toString("utf8");
	if (!utf8.includes("\uFFFD")) return utf8;
	return buf.toString("utf16le");
}

function readText(file) {
	return decodeBuffer(fs.readFileSync(file));
}

function listTopMd(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
		.map((e) => e.name);
}

function parseFrontmatter(raw) {
	if (!raw.startsWith("---")) return null;
	const end = raw.search(/\r?\n---(?:\r?\n|$)/);
	if (end === -1) return null;
	const yaml = raw.slice(3, end).replace(/^\r?\n/, "");
	const fields = {};
	for (const line of yaml.split(/\r?\n/)) {
		const m = line.match(/^([A-Za-z][\w]*):\s*(.*)$/);
		if (!m) continue;
		let value = m[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		fields[m[1]] = value;
	}
	return fields;
}

function validate(kind, filename, raw) {
	const errors = [];
	const warnings = [];
	const fm = parseFrontmatter(raw);
	if (!fm) {
		errors.push("缺少 YAML frontmatter（文件必须以 --- 开头）");
		return { errors, warnings };
	}
	if (!fm.title) errors.push("title 为空或缺失");
	if (!fm.description) errors.push("description 为空或缺失");
	if (!fm.publishDate) errors.push("publishDate 为空或缺失");
	if (kind === "note" && fm.publishDate && !NOTE_DATE.test(fm.publishDate)) {
		errors.push(
			`笔记 publishDate 格式应为 YYYY-MM-DDTHH:mm，当前是 ${fm.publishDate}`,
		);
	}
	const bodyOutsideCode = raw.replace(/```[\s\S]*?```/g, "");
	if (WIKI.test(bodyOutsideCode)) {
		warnings.push("正文含 [[双链]] / ![[嵌入]] / Callout / Dataview，博客可能原样显示");
	}
	return { errors, warnings };
}

function copyFile(srcFile, destFile) {
	fs.mkdirSync(path.dirname(destFile), { recursive: true });
	fs.copyFileSync(srcFile, destFile);
}

function syncOne({ kind, src, dest }) {
	const result = { copied: 0, skipped: 0, pruned: 0, failed: [] };
	console.log(`\n[${kind}] ${src}  →  ${dest}`);

	if (!fs.existsSync(src)) {
		console.log(`  SKIP 源目录不存在`);
		return result;
	}
	fs.mkdirSync(dest, { recursive: true });

	const srcNames = listTopMd(src);
	const destNames = listTopMd(dest);

	for (const name of srcNames) {
		const srcFile = path.join(src, name);
		const destFile = path.join(dest, name);
		const raw = fs.readFileSync(srcFile, "utf8");
		const { errors, warnings } = validate(kind, name, raw);
		for (const w of warnings) console.log(`  WARN ${name}: ${w}`);
		if (errors.length) {
			result.skipped += 1;
			result.failed.push({ name, errors });
			console.log(`  SKIP ${name}`);
			for (const e of errors) console.log(`       - ${e}`);
			continue;
		}
		if (dryRun) {
			console.log(`  COPY ${name}`);
		} else {
			copyFile(srcFile, destFile);
			console.log(`  COPY ${name}`);
		}
		result.copied += 1;
	}

	if (prune) {
		const srcSet = new Set(srcNames);
		for (const name of destNames) {
			if (srcSet.has(name)) continue;
			result.pruned += 1;
			if (dryRun) {
				console.log(`  PRUNE ${name}`);
			} else {
				fs.unlinkSync(path.join(dest, name));
				console.log(`  PRUNE ${name}`);
			}
		}
	}

	return result;
}

function main() {
	console.log(`Obsidian vault: ${vaultRoot}`);
	console.log(`Mode: ${dryRun ? "dry-run" : "write"}${prune ? " + prune" : ""}`);

	if (!fs.existsSync(vaultRoot)) {
		console.error(`Vault 不存在: ${vaultRoot}`);
		console.error("请设置环境变量 OBSIDIAN_VAULT 指向 richardli-brain 根目录");
		process.exit(1);
	}

	const totals = { copied: 0, skipped: 0, pruned: 0, failed: [] };
	for (const mapping of mappings) {
		const r = syncOne(mapping);
		totals.copied += r.copied;
		totals.skipped += r.skipped;
		totals.pruned += r.pruned;
		totals.failed.push(...r.failed);
	}

	console.log("\nSummary:");
	console.log(`  copied : ${totals.copied}`);
	console.log(`  skipped: ${totals.skipped}`);
	console.log(`  pruned : ${totals.pruned}`);
	if (dryRun) console.log("  (dry-run，未写入磁盘)");

	if (totals.skipped > 0) process.exitCode = 1;
}

main();
