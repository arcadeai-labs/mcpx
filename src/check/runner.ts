import type { Rubric } from "./rubric.ts";
import { QUALITY_RULES } from "./rules/index.ts";
import type { CheckContext, RuleResult } from "./rules/rule.ts";

export interface RuleExecution {
	id: string;
	category: string;
	name: string;
	weight: number;
	result: RuleResult;
}

export async function runRules(context: CheckContext, rubric: Rubric): Promise<RuleExecution[]> {
	const implementations = new Map(QUALITY_RULES.map((rule) => [rule.id, rule]));
	return Promise.all(
		rubric.rules
			.filter((configured) => configured.enabled)
			.map(async (configured) => {
				const implementation = implementations.get(configured.id);
				if (!implementation) throw new Error(`No implementation for rubric rule ${configured.id}`);
				let result: RuleResult;
				try {
					result = await implementation.computeScore(context);
				} catch (error) {
					result = {
						score: 0,
						status: "fail",
						evidence: `Rule failed: ${error instanceof Error ? error.message : String(error)}`,
						remediation: "Retry with --verbose and report this mcpx rule failure",
					};
				}
				return {
					id: configured.id,
					category: configured.category,
					name: configured.name,
					weight: configured.weight,
					result,
				};
			}),
	);
}
