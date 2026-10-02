import { CoreConformanceRule } from "./protocol/core-conformance-rule.ts";
import { ElicitationRule } from "./protocol/elicitation-rule.ts";
import { OriginValidationRule } from "./protocol/origin-validation-rule.ts";
import { ProtocolVersionRule } from "./protocol/protocol-version-rule.ts";
import { StatelessHttpRule } from "./protocol/stateless-http-rule.ts";
import { ToolAnnotationsRule } from "./protocol/tool-annotations-rule.ts";
import type { QualityRule } from "./rule.ts";
import { AuthenticationRule } from "./security/authentication-rule.ts";
import { DomainValidationRule } from "./security/domain-validation-rule.ts";
import { HttpsRule } from "./security/https-rule.ts";
import { PkceRule } from "./security/pkce-rule.ts";
import { ScopesRule } from "./security/scopes-rule.ts";
import { DeclaredCapabilitiesRule } from "./surface/declared-capabilities-rule.ts";
import { ServerInstructionsRule } from "./surface/server-instructions-rule.ts";
import { ToolCountRule } from "./surface/tool-count-rule.ts";
import { ActionableErrorsRule } from "./tool-quality/actionable-errors-rule.ts";
import { CredentialParametersRule } from "./tool-quality/credential-parameters-rule.ts";
import { DescriptionContentRule } from "./tool-quality/description-content-rule.ts";
import { DocumentationLinksRule } from "./tool-quality/documentation-links-rule.ts";
import { InputConstraintsRule } from "./tool-quality/input-constraints-rule.ts";
import { OutputSchemasRule } from "./tool-quality/output-schemas-rule.ts";
import { ParameterCountRule } from "./tool-quality/parameter-count-rule.ts";
import { ParameterDescriptionsRule } from "./tool-quality/parameter-descriptions-rule.ts";
import { ToolDescriptionsRule } from "./tool-quality/tool-descriptions-rule.ts";
import { ToolTitlesRule } from "./tool-quality/tool-titles-rule.ts";
import { TypedParametersRule } from "./tool-quality/typed-parameters-rule.ts";

export const QUALITY_RULES: readonly QualityRule[] = [
	new HttpsRule(),
	new AuthenticationRule(),
	new ScopesRule(),
	new DomainValidationRule(),
	new PkceRule(),
	new CoreConformanceRule(),
	new ProtocolVersionRule(),
	new StatelessHttpRule(),
	new ToolAnnotationsRule(),
	new ElicitationRule(),
	new OriginValidationRule(),
	new ToolDescriptionsRule(),
	new DescriptionContentRule(),
	new TypedParametersRule(),
	new ParameterDescriptionsRule(),
	new InputConstraintsRule(),
	new OutputSchemasRule(),
	new DocumentationLinksRule(),
	new ParameterCountRule(),
	new ToolTitlesRule(),
	new ActionableErrorsRule(),
	new CredentialParametersRule(),
	new ToolCountRule(),
	new DeclaredCapabilitiesRule(),
	new ServerInstructionsRule(),
];
