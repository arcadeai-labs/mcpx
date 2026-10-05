import { examples, mentionsOtherTool, nameTokens } from "../helpers/naming.ts";
import { description, hasEnum, propertiesOf } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const SOURCE_PHRASE =
	/(returned by|returned from|obtained from|retrieved from|from the (output|result|response) of|call \S+ first)/i;

function isIdentifier(name: string, schema: Record<string, unknown>): boolean {
	if (hasEnum(schema)) return false;
	const last = nameTokens(name).at(-1);
	return last === "id" || last === "ids" || last === "uuid" || schema.format === "uuid";
}

export class DependencyHintsRule extends QualityRule {
	readonly id = "tool-quality.dependency-hints";
	readonly category = "tool-quality" as const;
	readonly name = "Prerequisite hints for IDs";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		let total = 0;
		const missing: string[] = [];
		for (const tool of context.tools) {
			for (const [name, schema] of Object.entries(propertiesOf(tool))) {
				if (!isIdentifier(name, schema)) continue;
				total++;
				const text = `${description(schema)}\n${tool.description ?? ""}`;
				if (!SOURCE_PHRASE.test(description(schema)) && !mentionsOtherTool(text, tool, context.tools)) {
					missing.push(`${tool.name}.${name}`);
				}
			}
		}
		if (total === 0) return skipped("No identifier parameters were found");
		return result(
			(total - missing.length) / total,
			missing.length === 0
				? `${total} identifier parameters say where to get their values`
				: `${missing.length}/${total} identifier parameters do not say which tool provides them: ${examples(missing)}`,
			'Name the tool that produces each ID (e.g., "If you only have a name, call search_users first")',
		);
	}
}
