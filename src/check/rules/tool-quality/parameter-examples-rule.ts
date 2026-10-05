import { examples, nameTokens } from "../helpers/naming.ts";
import { description, hasEnum, schemaTypes, toolParameters } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

/** Free-form prose fields where an example value adds little. */
const PROSE_WORDS = new Set([
	"body",
	"content",
	"text",
	"message",
	"description",
	"prompt",
	"comment",
	"note",
	"notes",
	"summary",
	"reason",
	"title",
	"subject",
]);
const EXAMPLE = /(e\.g\.|\beg\b|for example|example|such as|like ["'`]|i\.e\.|["'`][^"'`\s]{2,}["'`])/i;

export class ParameterExamplesRule extends QualityRule {
	readonly id = "tool-quality.parameter-examples";
	readonly category = "tool-quality" as const;
	readonly name = "Parameter examples";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const freeform = toolParameters(context.tools).filter(
			({ name, schema }) =>
				schemaTypes(schema).includes("string") &&
				!hasEnum(schema) &&
				!("format" in schema) &&
				!nameTokens(name).some((token) => PROSE_WORDS.has(token)),
		);
		if (freeform.length === 0) return skipped("No free-form string parameters were found");
		const missing = freeform
			.filter(
				({ schema }) =>
					!(Array.isArray(schema.examples) && schema.examples.length > 0) && !EXAMPLE.test(description(schema)),
			)
			.map(({ tool, name }) => `${tool}.${name}`);
		return result(
			(freeform.length - missing.length) / freeform.length,
			missing.length === 0
				? `${freeform.length} free-form string parameters include examples`
				: `${missing.length}/${freeform.length} free-form string parameters have no example value: ${examples(missing)}`,
			'Add JSON Schema examples or an "e.g." value to identifier, query, and other free-form string parameters',
		);
	}
}
