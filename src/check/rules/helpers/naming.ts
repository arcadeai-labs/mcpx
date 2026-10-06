import type { Tool } from "../../../config/schemas.ts";

export type VerbIntent = "read" | "write" | "destructive" | "neutral";

/** Side-effect-free verbs: synonyms of get/list/search plus pure computations and predicates. */
export const READ_VERBS: ReadonlySet<string> = new Set([
	"get",
	"fetch",
	"retrieve",
	"read",
	"load",
	"list",
	"enumerate",
	"search",
	"find",
	"query",
	"lookup",
	"look",
	"describe",
	"show",
	"view",
	"display",
	"inspect",
	"browse",
	"explore",
	"discover",
	"count",
	"check",
	"verify",
	"validate",
	"preview",
	"peek",
	"poll",
	"tail",
	"scan",
	"download",
	"export",
	"summarize",
	"analyze",
	"compare",
	"diff",
	"explain",
	"extract",
	"parse",
	"calculate",
	"compute",
	"estimate",
	"evaluate",
	"convert",
	"format",
	"render",
	"translate",
	"sample",
	"whoami",
	"who",
	"ping",
	"echo",
	"is",
	"has",
	"can",
	"filter",
	"sort",
	"rank",
	"classify",
	"recommend",
	"suggest",
	"predict",
	"forecast",
	"monitor",
	"observe",
	"scrape",
	"crawl",
	"capture",
	"screenshot",
	"transcribe",
	"decode",
	"decrypt",
	"hash",
]);

/** State-changing verbs that are not, by themselves, destructive. */
export const WRITE_VERBS: ReadonlySet<string> = new Set([
	"create",
	"add",
	"insert",
	"new",
	"make",
	"update",
	"edit",
	"modify",
	"set",
	"patch",
	"put",
	"upsert",
	"save",
	"write",
	"rename",
	"move",
	"copy",
	"duplicate",
	"merge",
	"assign",
	"unassign",
	"link",
	"attach",
	"detach",
	"upload",
	"import",
	"send",
	"post",
	"publish",
	"reply",
	"comment",
	"forward",
	"share",
	"invite",
	"schedule",
	"book",
	"start",
	"stop",
	"pause",
	"resume",
	"run",
	"execute",
	"exec",
	"trigger",
	"invoke",
	"deploy",
	"restart",
	"enable",
	"disable",
	"approve",
	"reject",
	"close",
	"reopen",
	"cancel",
	"archive",
	"unarchive",
	"restore",
	"mark",
	"star",
	"unstar",
	"label",
	"tag",
	"pin",
	"unpin",
	"lock",
	"unlock",
	"subscribe",
	"unsubscribe",
	"follow",
	"unfollow",
	"like",
	"react",
	"register",
	"sync",
	"refresh",
	"apply",
	"commit",
	"push",
	"fork",
	"clone",
	"submit",
	"complete",
	"transfer",
	"grant",
	"install",
	"reset",
	"clear",
	"request",
	"notify",
	"alert",
	"remind",
	"record",
	"log",
	"track",
	"plan",
	"draft",
	"compose",
	"sign",
	"connect",
	"disconnect",
	"escalate",
	"accept",
	"decline",
	"mute",
	"unmute",
	"block",
	"unblock",
	"join",
	"leave",
	"enroll",
	"upgrade",
	"downgrade",
	"provision",
	"allocate",
	"release",
	"scale",
	"migrate",
	"backup",
	"revert",
	"rollback",
	"undo",
	"redo",
	"retry",
	"navigate",
	"click",
	"type",
	"scroll",
	"fill",
	"encode",
	"encrypt",
	"index",
	"build",
	"print",
	"play",
]);

/** Verbs whose effects are typically permanent. */
export const DESTRUCTIVE_VERBS: ReadonlySet<string> = new Set([
	"delete",
	"remove",
	"purge",
	"drop",
	"destroy",
	"erase",
	"wipe",
	"truncate",
	"revoke",
	"terminate",
	"kill",
	"uninstall",
	"discard",
]);

/** Recognized action verbs whose read/write intent depends on context. */
export const NEUTRAL_VERBS: ReadonlySet<string> = new Set([
	"open",
	"resolve",
	"generate",
	"manage",
	"configure",
	"process",
	"handle",
	"toggle",
	"login",
	"logout",
	"authorize",
	"authenticate",
	"test",
	"wait",
	"watch",
	"simulate",
	"compress",
	"decompress",
	"zip",
	"unzip",
	"gzip",
	"select",
	"use",
	"choose",
	"pick",
	"call",
	"ask",
	"report",
	"map",
	"group",
]);

/** How many leading name tokens may hold the verb (allows `namespace_verb_noun` and `noun_verb`). */
const VERB_WINDOW = 3;

/** Split a tool or parameter name into lowercase words across snake, kebab, dot, and camel/Pascal case. */
export function nameTokens(name: string): string[] {
	return name
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map((token) => token.toLowerCase());
}

export function verbIntent(token: string): VerbIntent | undefined {
	if (DESTRUCTIVE_VERBS.has(token)) return "destructive";
	if (WRITE_VERBS.has(token)) return "write";
	if (READ_VERBS.has(token)) return "read";
	if (NEUTRAL_VERBS.has(token)) return "neutral";
	return undefined;
}

export interface ToolVerb {
	verb: string;
	intent: VerbIntent;
}

/**
 * Find the action verb in a tool name. The verb may follow a namespace (`github_get_issue`) or a noun
 * (`issue_create`). A read verb joined to a write or destructive verb by "or"/"and" (`get_or_create_user`,
 * `find_and_replace`) takes the stronger intent; later nouns that double as verbs (`get_post`) do not.
 */
export function toolVerb(name: string): ToolVerb | undefined {
	const tokens = nameTokens(name);
	const index = tokens.slice(0, VERB_WINDOW).findIndex((token) => verbIntent(token) !== undefined);
	if (index === -1) return undefined;
	const verb = tokens[index] as string;
	const intent = verbIntent(verb) as VerbIntent;
	if (intent !== "read" && intent !== "neutral") return { verb, intent };
	const later = tokens
		.slice(index + 1)
		.filter((_, offset, rest) => offset > 0 && ["or", "and"].includes(rest[offset - 1] as string))
		.map(verbIntent);
	if (later.includes("destructive")) return { verb, intent: "destructive" };
	if (later.includes("write")) return { verb, intent: "write" };
	return { verb, intent };
}

export type NameStyle = "snake_case" | "kebab-case" | "camelCase" | "PascalCase" | "Namespace_PascalCase" | "other";

/** Classify a name's casing convention. Single lowercase words return undefined (compatible with any style). */
export function nameStyle(name: string): NameStyle | undefined {
	const local = name.split(/[./]/).pop() ?? name;
	if (/^[a-z0-9]+$/.test(local)) return undefined;
	if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(local)) return "snake_case";
	if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(local)) return "kebab-case";
	if (/^[a-z][a-z0-9]*([A-Z][a-z0-9]*)+$/.test(local)) return "camelCase";
	if (/^[A-Z][a-zA-Z0-9]*$/.test(local)) return "PascalCase";
	if (/^[A-Z][a-zA-Z0-9]*(_[A-Z][a-zA-Z0-9]*)+$/.test(local)) return "Namespace_PascalCase";
	return "other";
}

/** Fraction of names that follow the most common style, and that style. Style-neutral names always conform. */
export function styleConsistency(names: readonly string[]): {
	ratio: number;
	dominant?: NameStyle;
	outliers: string[];
} {
	const styles = names.map((name) => ({ name, style: nameStyle(name) }));
	const counts = new Map<NameStyle, number>();
	for (const { style } of styles) if (style && style !== "other") counts.set(style, (counts.get(style) ?? 0) + 1);
	const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
	const outliers = styles.filter(({ style }) => style !== undefined && style !== dominant).map(({ name }) => name);
	return { ratio: names.length === 0 ? 1 : (names.length - outliers.length) / names.length, dominant, outliers };
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whether text refers to another tool by name. Single-word tool names (`search`) only count when written
 * as code (`search`, search(), or "search tool") so ordinary prose does not match.
 */
export function mentionsTool(text: string, toolName: string): boolean {
	const name = escapeRegExp(toolName);
	if (nameTokens(toolName).length > 1) return new RegExp(`(^|[^A-Za-z0-9_])${name}($|[^A-Za-z0-9_])`, "i").test(text);
	return new RegExp(`\`${name}\`|\\b${name}\\(|\\b${name} tool\\b`, "i").test(text);
}

export function mentionsOtherTool(text: string, self: Tool, tools: readonly Tool[]): string | undefined {
	return tools.find((tool) => tool.name !== self.name && mentionsTool(text, tool.name))?.name;
}

/** Show up to three examples, with a count of the rest. */
export function examples(values: readonly string[], limit = 3): string {
	const shown = values.slice(0, limit).join(", ");
	return values.length > limit ? `${shown}, +${values.length - limit} more` : shown;
}
