import { examples } from "../helpers/naming.ts";
import { asObject, toolRecord } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const MAX_INPUT_DEPTH = 3;
const MAX_OUTPUT_DEPTH = 4;
const COMBINATORS = ["anyOf", "oneOf", "allOf"];

/** Count nested object levels; the top-level object is depth 1. $ref targets are not followed. */
export function objectDepth(value: unknown, guard = 0): number {
	const schema = asObject(value);
	if (!schema || guard > 32) return 0;
	const own = asObject(schema.properties) || schema.type === "object" ? 1 : 0;
	const children = [
		...Object.values(asObject(schema.properties) ?? {}),
		...(Array.isArray(schema.items) ? schema.items : [schema.items]),
		schema.additionalProperties,
		...COMBINATORS.flatMap((key) => (Array.isArray(schema[key]) ? (schema[key] as unknown[]) : [])),
	];
	const isWrapper = own === 0;
	const deepest = Math.max(0, ...children.map((child) => objectDepth(child, guard + 1)));
	return isWrapper ? deepest : own + deepest;
}

export class SchemaDepthRule extends QualityRule {
	readonly id = "tool-quality.schema-depth";
	readonly category = "tool-quality" as const;
	readonly name = "Shallow schemas";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (context.tools.length === 0) return skipped("No tools to assess");
		const deep = context.tools
			.map((tool) => ({
				name: tool.name,
				input: objectDepth(tool.inputSchema),
				output: objectDepth(toolRecord(tool).outputSchema),
			}))
			.filter(({ input, output }) => input > MAX_INPUT_DEPTH || output > MAX_OUTPUT_DEPTH)
			.map(({ name, input, output }) => `${name} (input ${input}, output ${output})`);
		return result(
			(context.tools.length - deep.length) / context.tools.length,
			deep.length === 0
				? `All ${context.tools.length} tools nest at most ${MAX_INPUT_DEPTH} input / ${MAX_OUTPUT_DEPTH} output object levels`
				: `${deep.length}/${context.tools.length} tools have deeply nested schemas: ${examples(deep)}`,
			`Flatten schemas to at most ${MAX_INPUT_DEPTH} nested object levels for input and ${MAX_OUTPUT_DEPTH} for output`,
		);
	}
}
