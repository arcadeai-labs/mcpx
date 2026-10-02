import { CoreConformanceRule } from "./protocol/core-conformance-rule.ts";
import { ElicitationRule } from "./protocol/elicitation-rule.ts";
import { JsonRpcErrorRule } from "./protocol/json-rpc-error-rule.ts";
import { JsonRpcRequestRule } from "./protocol/json-rpc-request-rule.ts";
import { JsonRpcResultRule } from "./protocol/json-rpc-result-rule.ts";
import { NotificationResponseRule } from "./protocol/notification-response-rule.ts";
import { OriginValidationRule } from "./protocol/origin-validation-rule.ts";
import { PostContentTypeRule } from "./protocol/post-content-type-rule.ts";
import { ProtocolHeaderRule } from "./protocol/protocol-header-rule.ts";
import { ProtocolVersionRule } from "./protocol/protocol-version-rule.ts";
import { ReservedMetaRule } from "./protocol/reserved-meta-rule.ts";
import { SessionTerminationRule } from "./protocol/session-termination-rule.ts";
import { StatelessHttpRule } from "./protocol/stateless-http-rule.ts";
import { ToolAnnotationsRule } from "./protocol/tool-annotations-rule.ts";
import type { QualityRule } from "./rule.ts";
import { AsEndpointsRule } from "./security/as-endpoints-rule.ts";
import { AsIssuerRule } from "./security/as-issuer-rule.ts";
import { AsResponseTypesRule } from "./security/as-response-types-rule.ts";
import { AuthenticationRule } from "./security/authentication-rule.ts";
import { AuthorizationDiscoveryRule } from "./security/authorization-discovery-rule.ts";
import { BearerChallengeRule } from "./security/bearer-challenge-rule.ts";
import { ChallengeResourceMetadataRule } from "./security/challenge-resource-metadata-rule.ts";
import { ChallengeScopeRule } from "./security/challenge-scope-rule.ts";
import { ClientCredentialsRule } from "./security/client-credentials-rule.ts";
import { ClientRegistrationRule } from "./security/client-registration-rule.ts";
import { DomainValidationRule } from "./security/domain-validation-rule.ts";
import { GrantTypesRule } from "./security/grant-types-rule.ts";
import { HttpsRule } from "./security/https-rule.ts";
import { InvalidTokenRule } from "./security/invalid-token-rule.ts";
import { OidcDiscoveryRule } from "./security/oidc-discovery-rule.ts";
import { PkceRule } from "./security/pkce-rule.ts";
import { PrmAuthorizationServersRule } from "./security/prm-authorization-servers-rule.ts";
import { PrmDiscoveryRule } from "./security/prm-discovery-rule.ts";
import { PrmResourceRule } from "./security/prm-resource-rule.ts";
import { PrmScopesRule } from "./security/prm-scopes-rule.ts";
import { Rfc8414DiscoveryRule } from "./security/rfc8414-discovery-rule.ts";
import { ScopesRule } from "./security/scopes-rule.ts";
import { TokenAuthMethodsRule } from "./security/token-auth-methods-rule.ts";
import { UnauthorizedStatusRule } from "./security/unauthorized-status-rule.ts";
import { WwwAuthenticateRule } from "./security/www-authenticate-rule.ts";
import { DeclaredCapabilitiesRule } from "./surface/declared-capabilities-rule.ts";
import { ResourceListingRule } from "./surface/resource-listing-rule.ts";
import { ServerInstructionsRule } from "./surface/server-instructions-rule.ts";
import { ToolCountRule } from "./surface/tool-count-rule.ts";
import { ActionableErrorsRule } from "./tool-quality/actionable-errors-rule.ts";
import { AnnotationValidityRule } from "./tool-quality/annotation-validity-rule.ts";
import { CredentialParametersRule } from "./tool-quality/credential-parameters-rule.ts";
import { DescriptionContentRule } from "./tool-quality/description-content-rule.ts";
import { DocumentationLinksRule } from "./tool-quality/documentation-links-rule.ts";
import { InputConstraintsRule } from "./tool-quality/input-constraints-rule.ts";
import { OutputSchemasRule } from "./tool-quality/output-schemas-rule.ts";
import { ParameterCountRule } from "./tool-quality/parameter-count-rule.ts";
import { ParameterDescriptionsRule } from "./tool-quality/parameter-descriptions-rule.ts";
import { SchemaValidityRule } from "./tool-quality/schema-validity-rule.ts";
import { ToolDescriptionsRule } from "./tool-quality/tool-descriptions-rule.ts";
import { ToolTitlesRule } from "./tool-quality/tool-titles-rule.ts";
import { TypedParametersRule } from "./tool-quality/typed-parameters-rule.ts";

export const QUALITY_RULES: readonly QualityRule[] = [
	new HttpsRule(),
	new AuthenticationRule(),
	new ScopesRule(),
	new DomainValidationRule(),
	new PkceRule(),
	new UnauthorizedStatusRule(),
	new WwwAuthenticateRule(),
	new BearerChallengeRule(),
	new ChallengeResourceMetadataRule(),
	new ChallengeScopeRule(),
	new PrmDiscoveryRule(),
	new PrmResourceRule(),
	new PrmAuthorizationServersRule(),
	new PrmScopesRule(),
	new Rfc8414DiscoveryRule(),
	new OidcDiscoveryRule(),
	new AuthorizationDiscoveryRule(),
	new AsIssuerRule(),
	new AsEndpointsRule(),
	new AsResponseTypesRule(),
	new ClientRegistrationRule(),
	new TokenAuthMethodsRule(),
	new GrantTypesRule(),
	new ClientCredentialsRule(),
	new InvalidTokenRule(),
	new CoreConformanceRule(),
	new ProtocolVersionRule(),
	new StatelessHttpRule(),
	new ToolAnnotationsRule(),
	new ElicitationRule(),
	new OriginValidationRule(),
	new JsonRpcRequestRule(),
	new ProtocolHeaderRule(),
	new SessionTerminationRule(),
	new JsonRpcResultRule(),
	new PostContentTypeRule(),
	new ReservedMetaRule(),
	new JsonRpcErrorRule(),
	new NotificationResponseRule(),
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
	new SchemaValidityRule(),
	new AnnotationValidityRule(),
	new ToolCountRule(),
	new DeclaredCapabilitiesRule(),
	new ResourceListingRule(),
	new ServerInstructionsRule(),
];
