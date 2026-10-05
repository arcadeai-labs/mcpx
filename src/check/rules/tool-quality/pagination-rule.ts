import { examples, nameTokens, toolVerb } from "../helpers/naming.ts";
import { propertiesOf } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const LIST_VERBS = new Set(["list", "search", "find", "browse", "enumerate"]);
const LIMIT_NAMES = new Set(["limit", "maxresults", "pagesize", "perpage", "numresults", "top", "first", "count"]);
const CURSOR_NAMES = new Set([
	"cursor",
	"pagetoken",
	"nexttoken",
	"nextcursor",
	"continuationtoken",
	"after",
	"startingafter",
]);
const OFFSET_NAMES = new Set(["offset", "page", "skip", "pagenumber"]);

function joined(name: string): string {
	return nameTokens(name).join("");
}

export class PaginationRule extends QualityRule {
	readonly id = "tool-quality.pagination";
	readonly category = "tool-quality" as const;
	readonly name = "Paginated list results";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const listTools = context.tools.filter((tool) => LIST_VERBS.has(toolVerb(tool.name)?.verb ?? ""));
		if (listTools.length === 0) return skipped("No list or search tools were found");
		let earned = 0;
		const gaps: string[] = [];
		for (const tool of listTools) {
			const properties = Object.entries(propertiesOf(tool));
			const limit = properties.find(([name]) => LIMIT_NAMES.has(joined(name)))?.[1];
			const cursor = properties.some(([name]) => CURSOR_NAMES.has(joined(name)));
			const offset = properties.some(([name]) => OFFSET_NAMES.has(joined(name)));
			const bounded =
				limit !== undefined && (typeof limit.maximum === "number" || typeof limit.exclusiveMaximum === "number");
			const continuation = cursor ? 1 : offset ? 0.5 : 0;
			const score = ((limit ? 1 : 0) + (bounded ? 1 : 0) + continuation) / 3;
			earned += score;
			if (score < 1) {
				const missing = [
					!limit && "limit",
					limit && !bounded && "limit maximum",
					!cursor && (offset ? "cursor (has offset/page)" : "cursor"),
				].filter(Boolean);
				gaps.push(`${tool.name} (${missing.join(", ")})`);
			}
		}
		return result(
			earned / listTools.length,
			gaps.length === 0
				? `${listTools.length} list tools accept a bounded limit and a cursor`
				: `${gaps.length}/${listTools.length} list tools lack pagination controls: ${examples(gaps)}`,
			"Give list and search tools a limit with a default and maximum plus an opaque cursor, and return has_more/next_cursor",
		);
	}
}
