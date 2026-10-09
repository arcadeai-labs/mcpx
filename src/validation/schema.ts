import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import Ajv2019 from "ajv/dist/2019.js";
import Ajv2020 from "ajv/dist/2020.js";
import type { Tool } from "../config/schemas.ts";

const ajvOptions = { allErrors: true, strict: false };
const ajvDraft07 = new Ajv(ajvOptions);
const ajv2019 = new Ajv2019(ajvOptions);
const ajv2020 = new Ajv2020(ajvOptions);

// Cache compiled validators by a key of "server/tool"
const validatorCache = new Map<string, ValidateFunction>();

export interface ValidationError {
	path: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/** Compile (or retrieve from cache), validate, and return result */
function validateWithSchema(
	cacheKey: string,
	schema: Record<string, unknown>,
	input: Record<string, unknown>,
): ValidationResult {
	let validate = validatorCache.get(cacheKey);

	if (!validate) {
		try {
			validate = compileSchema(normalizeSchema(schema));
			validatorCache.set(cacheKey, validate);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "unknown error";
			return { valid: false, errors: [{ path: "(schema)", message: `schema compilation failed: ${msg}` }] };
		}
	}

	const valid = validate(input);
	if (valid) {
		return { valid: true, errors: [] };
	}

	const errors = (validate.errors ?? []).map(formatAjvError);
	return { valid: false, errors };
}

/**
 * Compile with the Ajv build matching the schema's `$schema` dialect. The root
 * `$schema` is dropped so Ajv never has to resolve the meta-schema URI itself
 * (it only bundles its own draft, and URI spellings vary, e.g. a trailing `#`).
 * Schemas with no recognized `$schema` use the MCP default dialect (2020-12),
 * falling back to draft-07 for older schemas such as tuple-form `items: [...]`.
 */
function compileSchema(schema: Record<string, unknown>): ValidateFunction {
	const { $schema, ...rest } = schema;
	const dialect = typeof $schema === "string" ? $schema : "";

	if (dialect.includes("2020-12")) return ajv2020.compile(rest);
	if (dialect.includes("2019-09")) return ajv2019.compile(rest);
	if (/draft-0[467]/.test(dialect)) return ajvDraft07.compile(rest);

	try {
		return ajv2020.compile(rest);
	} catch {
		return ajvDraft07.compile(rest);
	}
}

/** Validate tool arguments against the tool's inputSchema */
export function validateToolInput(serverName: string, tool: Tool, input: Record<string, unknown>): ValidationResult {
	const schema = tool.inputSchema;
	if (!schema || Object.keys(schema).length === 0) {
		return { valid: true, errors: [] };
	}
	return validateWithSchema(`${serverName}/${tool.name}`, schema, input);
}

/** Validate user-collected form data against an elicitation requestedSchema */
export function validateElicitationResponse(
	schema: Record<string, unknown>,
	input: Record<string, unknown>,
): ValidationResult {
	return validateWithSchema(`__elicitation__${JSON.stringify(schema)}`, schema, input);
}

type JsonPrimitive = string | number | boolean | null;

function isPrimitive(v: unknown): v is JsonPrimitive {
	return v === null || ["string", "number", "boolean"].includes(typeof v);
}

function primitiveJsonType(v: JsonPrimitive): "string" | "number" | "boolean" | "null" {
	if (v === null) return "null";
	if (typeof v === "boolean") return "boolean";
	if (typeof v === "number") return "number";
	return "string";
}

/**
 * Normalize a JSON Schema before handing it to Ajv. Rewrites the malformed
 * shape `{ type: "array", enum: [<primitives>], items: { type: <matching> } }`
 * — published by some real MCP servers — into `{ type: "array", items: { ..., enum: [...] } }`.
 * Without this fix Ajv compares the whole array value against the primitive enum
 * and rejects every input. Returns a deep clone; the input schema is untouched.
 */
function normalizeSchema(schema: Record<string, unknown>): Record<string, unknown> {
	return walk(schema) as Record<string, unknown>;
}

function walk(node: unknown): unknown {
	if (Array.isArray(node)) {
		return node.map(walk);
	}
	if (!node || typeof node !== "object") {
		return node;
	}

	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
		out[key] = walk(value);
	}

	if (out.type === "array" && Array.isArray(out.enum) && out.enum.every(isPrimitive)) {
		const items = out.items;
		const enumValues = out.enum as JsonPrimitive[];
		if (items && typeof items === "object" && !Array.isArray(items)) {
			const itemsObj = items as Record<string, unknown>;
			const enumType = primitiveJsonType(enumValues[0]!);
			const allSameType = enumValues.every((v) => primitiveJsonType(v) === enumType);
			const itemsTypeMatches =
				itemsObj.type === undefined ||
				itemsObj.type === enumType ||
				(Array.isArray(itemsObj.type) && itemsObj.type.includes(enumType));
			if (allSameType && itemsTypeMatches && itemsObj.enum === undefined) {
				out.items = { ...itemsObj, enum: enumValues };
				delete out.enum;
			}
		}
	}

	return out;
}

function formatAjvError(err: ErrorObject): ValidationError {
	const path = err.instancePath ? err.instancePath.replace(/^\//, "").replace(/\//g, ".") : "(root)";

	switch (err.keyword) {
		case "required": {
			const field = (err.params as { missingProperty: string }).missingProperty;
			return { path: field, message: `missing required field "${field}"` };
		}
		case "type": {
			const expected = (err.params as { type: string }).type;
			return { path, message: `must be ${expected}` };
		}
		case "enum": {
			const allowed = (err.params as { allowedValues: unknown[] }).allowedValues;
			return { path, message: `must be one of: ${allowed.join(", ")}` };
		}
		case "additionalProperties": {
			const extra = (err.params as { additionalProperty: string }).additionalProperty;
			return { path: extra, message: `unknown property "${extra}"` };
		}
		default:
			return { path, message: err.message ?? "validation failed" };
	}
}
