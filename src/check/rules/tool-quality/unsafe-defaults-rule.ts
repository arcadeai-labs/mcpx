import { examples, nameTokens } from "../helpers/naming.ts";
import { schemaTypes, toolParameters } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const RISKY_WORDS = new Set([
	"force",
	"overwrite",
	"delete",
	"remove",
	"purge",
	"permanent",
	"permanently",
	"recursive",
	"cascade",
	"destroy",
	"drop",
	"wipe",
	"hard",
	"unsafe",
	"confirm",
	"confirmed",
]);

function isRisky(name: string): boolean {
	const tokens = nameTokens(name);
	return (
		tokens.some((token) => RISKY_WORDS.has(token)) ||
		(tokens.includes("skip") && tokens.some((token) => token.startsWith("confirm"))) ||
		(tokens.includes("auto") && tokens.some((token) => token.startsWith("approv")))
	);
}

export class UnsafeDefaultsRule extends QualityRule {
	readonly id = "tool-quality.unsafe-defaults";
	readonly category = "tool-quality" as const;
	readonly name = "Safe parameter defaults";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const risky = toolParameters(context.tools).filter(
			({ name, schema }) => schemaTypes(schema).includes("boolean") && isRisky(name),
		);
		if (risky.length === 0) return skipped("No risky boolean parameters were found");
		const unsafe = risky.filter(({ schema }) => schema.default === true).map(({ tool, name }) => `${tool}.${name}`);
		return result(
			(risky.length - unsafe.length) / risky.length,
			unsafe.length === 0
				? `${risky.length} risky boolean parameters default to off`
				: `${unsafe.length}/${risky.length} risky boolean parameters default to true: ${examples(unsafe)}`,
			"Default force, overwrite, delete, recursive, and confirmation-skipping flags to false",
		);
	}
}
