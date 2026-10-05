import { examples, mentionsOtherTool } from "../helpers/naming.ts";
import { asObject, toolAnnotations, toolRecord } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const VERSION_SUFFIX = /^(.*?)(?:[_.-][vV]|V)(\d+)$/;

function isMarkedDeprecated(tool: Parameters<typeof toolAnnotations>[0]): boolean {
	return (
		/deprecat/i.test(tool.description ?? "") ||
		toolAnnotations(tool)?.deprecated === true ||
		asObject(toolRecord(tool)._meta)?.deprecated === true
	);
}

export class DeprecationGuidanceRule extends QualityRule {
	readonly id = "tool-quality.deprecation-guidance";
	readonly category = "tool-quality" as const;
	readonly name = "Deprecation guidance";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const versions = new Map<string, { name: string; version: number }[]>();
		for (const tool of context.tools) {
			const match = VERSION_SUFFIX.exec(tool.name);
			const base = (match?.[1] ?? tool.name).toLowerCase();
			const version = match ? Number(match[2]) : 1;
			versions.set(base, [...(versions.get(base) ?? []), { name: tool.name, version }]);
		}
		const superseded = new Set(
			[...versions.values()]
				.filter((group) => group.length > 1)
				.flatMap((group) => {
					const latest = Math.max(...group.map((entry) => entry.version));
					return group.filter((entry) => entry.version < latest).map((entry) => entry.name);
				}),
		);
		const assessed = context.tools.filter((tool) => superseded.has(tool.name) || isMarkedDeprecated(tool));
		if (assessed.length === 0) return skipped("No deprecated or superseded tools were found");
		const unguided = assessed
			.filter((tool) => !isMarkedDeprecated(tool) || !mentionsOtherTool(tool.description ?? "", tool, context.tools))
			.map((tool) => tool.name);
		return result(
			(assessed.length - unguided.length) / assessed.length,
			unguided.length === 0
				? `${assessed.length} deprecated tools name their replacement`
				: `${unguided.length}/${assessed.length} deprecated or superseded tools lack a deprecation notice naming a replacement: ${examples(unguided)}`,
			'Mark older tool versions deprecated and name the replacement (e.g., "Deprecated: use create_user_v2")',
		);
	}
}
