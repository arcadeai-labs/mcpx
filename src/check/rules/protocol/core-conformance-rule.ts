import { asObject } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

const TOOL_NAME = /^[A-Za-z0-9_./-]{1,64}$/;

export class CoreConformanceRule extends QualityRule {
	readonly id = "protocol.core-conformance";
	readonly category = "protocol" as const;
	readonly name = "Core MCP conformance";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		let passed = context.pingSucceeded ? 1 : 0;
		let total = 2;
		passed += context.capabilityErrors.tools ? 0 : 1;
		for (const tool of context.tools) {
			total += 2;
			if (TOOL_NAME.test(tool.name)) passed++;
			if (asObject(tool.inputSchema)) passed++;
		}
		const score = passed / total;
		return result(
			score,
			`${passed}/${total} ping, tools/list, tool-name, and input-schema checks passed`,
			"Fix ping, tools/list structure, tool names, and JSON Schema definitions",
		);
	}
}
