import { examples, nameTokens, styleConsistency } from "../helpers/naming.ts";
import { toolParameters } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

/** Parameter names that mean the same thing; a server should pick one per concept. */
const SYNONYM_GROUPS: Record<string, readonly string[]> = {
	"page size": ["limit", "maxresults", "pagesize", "perpage", "numresults", "top"],
	cursor: ["cursor", "pagetoken", "nexttoken", "nextcursor", "continuationtoken", "startingafter"],
	"search text": ["query", "q", "searchquery", "searchterm", "term", "keyword", "keywords"],
};

export class NamingConsistencyRule extends QualityRule {
	readonly id = "tool-quality.naming-consistency";
	readonly category = "tool-quality" as const;
	readonly name = "Consistent parameter naming";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const names = [...new Set(toolParameters(context.tools).map(({ name }) => name))];
		if (names.length === 0) return skipped("No tool parameters to assess");
		const style = styleConsistency(names);
		const joined = new Map(names.map((name) => [name, nameTokens(name).join("")]));
		const groups = Object.entries(SYNONYM_GROUPS).flatMap(([concept, members]) => {
			const used = names.filter((name) => members.includes(joined.get(name) as string));
			const variants = new Set(used.map((name) => joined.get(name)));
			return used.length === 0 ? [] : [{ concept, used, consistent: variants.size === 1 }];
		});
		const conflicting = groups.filter((group) => !group.consistent);
		const conceptRatio = groups.length === 0 ? 1 : (groups.length - conflicting.length) / groups.length;
		const problems = [
			style.outliers.length > 0 ? `not ${style.dominant}: ${examples(style.outliers)}` : undefined,
			...conflicting.map((group) => `${group.concept} named ${group.used.join(" / ")}`),
		].filter(Boolean);
		return result(
			(style.ratio + conceptRatio) / 2,
			problems.length === 0
				? `${names.length} parameter names share one casing style and one name per concept`
				: `Parameter naming varies — ${problems.join("; ")}`,
			"Use one casing style and the same parameter name for the same concept across every tool",
		);
	}
}
