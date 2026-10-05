import { examples, nameTokens } from "../helpers/naming.ts";
import { description, hasEnum, schemaTypes, toolParameters } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const TEMPORAL_WORDS = new Set(["date", "datetime", "time", "timestamp", "since", "until", "before", "after"]);
const DURATION_WORDS = new Set([
	"zone",
	"timezone",
	"ms",
	"sec",
	"secs",
	"seconds",
	"minutes",
	"mins",
	"hours",
	"days",
	"limit",
	"max",
	"min",
]);
const DATE_FORMATS = new Set(["date", "date-time", "time", "duration"]);
const DOCUMENTED =
	/(iso|8601|rfc ?3339|yyyy|mm-dd|hh:mm|unix|epoch|e\.g\.|example|format|relative|today|yesterday|\d{4}-\d{2}-\d{2})/i;

function isTemporal(name: string): boolean {
	const tokens = nameTokens(name);
	if (tokens.some((token) => DURATION_WORDS.has(token))) return false;
	return tokens.some((token) => TEMPORAL_WORDS.has(token)) || (tokens.length > 1 && tokens.at(-1) === "at");
}

export class FormatDocumentationRule extends QualityRule {
	readonly id = "tool-quality.format-documentation";
	readonly category = "tool-quality" as const;
	readonly name = "Date and time formats documented";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const temporal = toolParameters(context.tools).filter(
			({ name, schema }) => isTemporal(name) && !hasEnum(schema) && !schemaTypes(schema).includes("boolean"),
		);
		if (temporal.length === 0) return skipped("No date or time parameters were found");
		const undocumented = temporal
			.filter(({ schema }) => !DATE_FORMATS.has(String(schema.format)) && !DOCUMENTED.test(description(schema)))
			.map(({ tool, name }) => `${tool}.${name}`);
		return result(
			(temporal.length - undocumented.length) / temporal.length,
			undocumented.length === 0
				? `${temporal.length} date and time parameters document their format`
				: `${undocumented.length}/${temporal.length} date and time parameters do not state a format: ${examples(undocumented)}`,
			'Set format: "date-time" (or "date") or describe the accepted format, e.g. "ISO 8601, like 2026-01-31T09:00:00Z"',
		);
	}
}
