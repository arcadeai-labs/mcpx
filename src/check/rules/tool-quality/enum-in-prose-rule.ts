import { examples } from "../helpers/naming.ts";
import { description, hasEnum, toolParameters } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const QUOTED_VALUE = /["'`]([\w.-]{1,40})["'`]/g;
const CHOICE_WORDS = /\b(one of|either|or|options?|values?|allowed|accepted|supported|valid|must be|can be)\b|\|/i;
const EXAMPLE_WORDS = /(e\.g\.|\beg\b|for example|such as)/i;

/** A description that spells out two or more quoted choices ("'asc' or 'desc'"), not merely examples ("e.g., 'main'"). */
export function listsChoices(text: string): boolean {
	return (text.match(QUOTED_VALUE)?.length ?? 0) >= 2 && CHOICE_WORDS.test(text) && !EXAMPLE_WORDS.test(text);
}

export class EnumInProseRule extends QualityRule {
	readonly id = "tool-quality.enum-in-prose";
	readonly category = "tool-quality" as const;
	readonly name = "Enumerated values in schema";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const choices = toolParameters(context.tools).filter(
			({ schema }) => hasEnum(schema) || listsChoices(description(schema)),
		);
		if (choices.length === 0) return skipped("No parameters with a fixed set of values were found");
		const prose = choices.filter(({ schema }) => !hasEnum(schema)).map(({ tool, name }) => `${tool}.${name}`);
		return result(
			(choices.length - prose.length) / choices.length,
			prose.length === 0
				? `${choices.length} fixed-choice parameters declare enum values`
				: `${prose.length}/${choices.length} parameters list choices only in prose: ${examples(prose)}`,
			"Move allowed values from the description into a JSON Schema enum",
		);
	}
}
