import { examples, nameTokens } from "../helpers/naming.ts";
import { contentWords, wordCount } from "../helpers/text.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const MIN_WORDS = 6;

/** True when every content word of the description already appears in the tool name. */
function restatesName(name: string, text: string): boolean {
	const nameWords = new Set(contentWords(nameTokens(name).join(" ")));
	const words = contentWords(text);
	return words.length === 0 || words.every((word) => nameWords.has(word));
}

export class DescriptionSubstanceRule extends QualityRule {
	readonly id = "tool-quality.description-substance";
	readonly category = "tool-quality" as const;
	readonly name = "Substantive tool descriptions";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const described = context.tools.filter((tool) => (tool.description?.trim().length ?? 0) > 0);
		if (described.length === 0) return skipped("No tool descriptions to assess");
		const restating: string[] = [];
		const terse: string[] = [];
		for (const tool of described) {
			const text = tool.description as string;
			if (restatesName(tool.name, text)) restating.push(tool.name);
			else if (wordCount(text) < MIN_WORDS) terse.push(tool.name);
		}
		const score = (described.length - restating.length - terse.length * 0.5) / described.length;
		const problems = [
			restating.length > 0 ? `${restating.length} only restate the name (${examples(restating)})` : undefined,
			terse.length > 0 ? `${terse.length} are under ${MIN_WORDS} words (${examples(terse)})` : undefined,
		].filter(Boolean);
		return result(
			score,
			problems.length === 0
				? `${described.length} descriptions add detail beyond the tool name`
				: `Of ${described.length} descriptions, ${problems.join("; ")}`,
			"Explain what the tool does, when to choose it, and what it returns — not just its name in prose",
		);
	}
}
