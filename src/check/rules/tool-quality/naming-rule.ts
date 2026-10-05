import { examples, styleConsistency, toolVerb } from "../helpers/naming.ts";
import { ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

/** MCP tool-name character set, capped at the 64 characters many LLM APIs accept for function names. */
const VALID_NAME = /^[A-Za-z0-9_.-]{1,64}$/;

export class NamingRule extends QualityRule {
	readonly id = "tool-quality.naming";
	readonly category = "tool-quality" as const;
	readonly name = "Tool naming";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const names = context.tools.map((tool) => tool.name);
		if (names.length === 0) return skipped("No tools to assess");
		const invalid = names.filter((name) => !VALID_NAME.test(name));
		const verbless = names.filter((name) => !toolVerb(name));
		const style = styleConsistency(names);
		const score =
			(ratio(names.length - invalid.length, names.length) +
				ratio(names.length - verbless.length, names.length) +
				style.ratio) /
			3;
		const problems = [
			invalid.length > 0 ? `invalid characters or length: ${examples(invalid)}` : undefined,
			verbless.length > 0 ? `no action verb: ${examples(verbless)}` : undefined,
			style.outliers.length > 0 ? `not ${style.dominant}: ${examples(style.outliers)}` : undefined,
		].filter(Boolean);
		return result(
			score,
			problems.length === 0
				? `${names.length} tool names use valid characters, action verbs, and consistent ${style.dominant ?? "casing"}`
				: `Tool name issues — ${problems.join("; ")}`,
			"Name tools verb_noun (get_issue, list_channels) with one casing style and only A-Z, a-z, 0-9, _, -, . (max 64)",
		);
	}
}
