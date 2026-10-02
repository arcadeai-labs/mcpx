import { propertiesOf } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

const CREDENTIAL_NAME = /(api[_-]?key|access[_-]?token|secret|password|credential|authorization)/i;

export class CredentialParametersRule extends QualityRule {
	readonly id = "tool-quality.credential-parameters";
	readonly category = "tool-quality" as const;
	readonly name = "Credentials outside tool parameters";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const names = context.tools.flatMap((tool) => Object.keys(propertiesOf(tool)));
		const credentials = names.filter((name) => CREDENTIAL_NAME.test(name));
		return result(
			credentials.length === 0 ? 1 : 0,
			credentials.length === 0
				? "No credential-like tool parameters found"
				: `Credential-like parameters: ${credentials.join(", ")}`,
			"Use OAuth or transport authentication instead of passing credentials to tools",
		);
	}
}
