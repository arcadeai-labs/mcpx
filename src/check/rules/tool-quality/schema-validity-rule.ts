import Ajv2020 from "ajv/dist/2020.js";
import { asObject, toolRecord } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class SchemaValidityRule extends QualityRule {
	readonly id = "tool-quality.schema-validity";
	readonly category = "tool-quality" as const;
	readonly name = "Tool schema validity";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const ajv = new Ajv2020({ strict: false });
		let valid = 0;
		let total = 0;
		for (const tool of context.tools) {
			for (const schema of [tool.inputSchema, toolRecord(tool).outputSchema]) {
				if (schema === undefined) continue;
				total++;
				try {
					if (!asObject(schema)) continue;
					ajv.compile(schema);
					valid++;
				} catch {
					// Invalid schemas score zero.
				}
			}
		}
		return result(
			total === 0 ? 0 : valid / total,
			`${valid}/${total} input and output schemas compile as JSON Schema 2020-12`,
		);
	}
}
