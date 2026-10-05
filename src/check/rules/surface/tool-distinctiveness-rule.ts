import { examples, nameTokens } from "../helpers/naming.ts";
import { contentWords } from "../helpers/text.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const SIMILARITY_THRESHOLD = 0.8;
const MIN_WORDS = 4;

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
	let shared = 0;
	for (const word of a) if (b.has(word)) shared++;
	return shared / (a.size + b.size - shared);
}

export class ToolDistinctivenessRule extends QualityRule {
	readonly id = "surface.tool-distinctiveness";
	readonly category = "surface" as const;
	readonly name = "Distinct tool descriptions";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (context.tools.length < 2) return skipped("Fewer than two tools to compare");
		const entries = context.tools.map((tool) => ({
			name: tool.name,
			key: nameTokens(tool.name).join(""),
			words: new Set(contentWords(tool.description ?? "")),
		}));
		const confusable = new Set<string>();
		const pairs: string[] = [];
		for (let i = 0; i < entries.length; i++) {
			for (let j = i + 1; j < entries.length; j++) {
				const a = entries[i]!;
				const b = entries[j]!;
				const sameName = a.key === b.key;
				const similar =
					a.words.size >= MIN_WORDS && b.words.size >= MIN_WORDS && jaccard(a.words, b.words) >= SIMILARITY_THRESHOLD;
				if (!sameName && !similar) continue;
				confusable.add(a.name).add(b.name);
				pairs.push(`${a.name} ~ ${b.name}`);
			}
		}
		return result(
			(entries.length - confusable.size) / entries.length,
			pairs.length === 0
				? `${entries.length} tools have distinct names and descriptions`
				: `${confusable.size}/${entries.length} tools are easy to confuse: ${examples(pairs)}`,
			"Give each tool a distinct name and say how it differs from similar tools",
		);
	}
}
