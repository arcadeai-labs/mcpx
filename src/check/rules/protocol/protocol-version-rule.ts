import { MCP_V2_PROTOCOL } from "../../../client/mcp-version.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ProtocolVersionRule extends QualityRule {
	readonly id = "protocol.version";
	readonly category = "protocol" as const;
	readonly name = "Current MCP protocol version";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const version = context.serverInfo.protocolVersion;
		if (version === MCP_V2_PROTOCOL || context.serverInfo.protocolEra === "modern") {
			return result(1, `Negotiated modern protocol ${version ?? MCP_V2_PROTOCOL}`);
		}
		return result(
			version ? 0.5 : 0,
			version ? `Negotiated legacy protocol ${version}` : "Negotiated protocol version was not reported",
			`Support MCP ${MCP_V2_PROTOCOL}`,
		);
	}
}
