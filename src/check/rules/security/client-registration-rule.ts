import { absoluteHttps, authorizationMetadata } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ClientRegistrationRule extends QualityRule {
	readonly id = "security.client-registration";
	readonly category = "security" as const;
	readonly name = "Client registration support";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		const dcr = absoluteHttps(metadata.registration_endpoint);
		const cimd =
			metadata.client_id_metadata_document_supported === true ||
			metadata.client_id_metadata_documents_supported === true;
		return result(dcr || cimd ? 1 : 0, `Dynamic registration: ${dcr}; client ID metadata documents: ${cimd}`);
	}
}
