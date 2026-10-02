import type { ServerInfo } from "../../client/manager.ts";
import type { Prompt, Resource, ServerConfig, Tool } from "../../config/schemas.ts";

export const RULE_CATEGORIES = ["security", "protocol", "tool-quality", "surface"] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];
export type RuleStatus = "pass" | "warn" | "fail" | "skip";

export interface ProbeResult {
	tool: string;
	field?: string;
	error?: string;
	isError: boolean;
	actionable: boolean;
}

export interface HttpEvidence {
	url: string;
	transport: "sse" | "streamable-http" | "auto";
	unauthenticatedStatus?: number;
	wwwAuthenticate?: string;
	originStatus?: number;
	oauth?: {
		resource?: string;
		scopesSupported?: string[];
		codeChallengeMethodsSupported?: string[];
	};
}

export interface CheckContext {
	serverName: string;
	expectedDomain?: string;
	config: ServerConfig;
	serverInfo: ServerInfo;
	tools: Tool[];
	resources: Resource[];
	prompts: Prompt[];
	capabilityErrors: Partial<Record<"tools" | "resources" | "prompts", string>>;
	pingSucceeded: boolean;
	http?: HttpEvidence;
	probes: ProbeResult[];
	probesEnabled: boolean;
}

export interface RuleResult {
	/** Normalized score in the inclusive range 0..1. */
	score: number;
	status: RuleStatus;
	evidence: string;
	remediation?: string;
}

export abstract class QualityRule {
	abstract readonly id: string;
	abstract readonly category: RuleCategory;
	abstract readonly name: string;
	abstract computeScore(context: CheckContext): Promise<RuleResult>;
}

export function result(score: number, evidence: string, remediation?: string, status?: RuleStatus): RuleResult {
	const normalized = Math.max(0, Math.min(1, score));
	return {
		score: normalized,
		status: status ?? (normalized === 1 ? "pass" : normalized === 0 ? "fail" : "warn"),
		evidence,
		...(remediation ? { remediation } : {}),
	};
}

export function skipped(evidence: string): RuleResult {
	return { score: 0, status: "skip", evidence };
}
