import type { Tool } from "../../../config/schemas.ts";

export type JsonObject = Record<string, unknown>;

export function asObject(value: unknown): JsonObject | undefined {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

export function toolRecord(tool: Tool): JsonObject {
	return tool as unknown as JsonObject;
}

export function propertiesOf(tool: Tool): Record<string, JsonObject> {
	const schema = asObject(tool.inputSchema);
	const properties = asObject(schema?.properties);
	if (!properties) return {};
	return Object.fromEntries(
		Object.entries(properties).flatMap(([name, value]) => {
			const property = asObject(value);
			return property ? [[name, property]] : [];
		}),
	);
}

export function ratio(passed: number, total: number): number {
	return total === 0 ? 1 : passed / total;
}

export function hasType(schema: JsonObject): boolean {
	if (typeof schema.type === "string" || Array.isArray(schema.type)) return true;
	return ["anyOf", "oneOf", "allOf", "$ref", "const", "enum"].some((key) => key in schema);
}

export function hasConstraint(schema: JsonObject): boolean {
	return [
		"enum",
		"const",
		"format",
		"pattern",
		"minimum",
		"maximum",
		"exclusiveMinimum",
		"exclusiveMaximum",
		"minLength",
		"maxLength",
		"minItems",
		"maxItems",
	].some((key) => key in schema);
}

export function countToolProperties(tools: Tool[]): number {
	return tools.reduce((sum, tool) => sum + Object.keys(propertiesOf(tool)).length, 0);
}

export function toolAnnotations(tool: Tool): JsonObject | undefined {
	return asObject(toolRecord(tool).annotations);
}

export function schemaTypes(schema: JsonObject): string[] {
	if (typeof schema.type === "string") return [schema.type];
	if (Array.isArray(schema.type)) return schema.type.filter((type): type is string => typeof type === "string");
	return [];
}

export function hasEnum(schema: JsonObject): boolean {
	return Array.isArray(schema.enum) || "const" in schema;
}

export interface NamedParameter {
	tool: string;
	name: string;
	schema: JsonObject;
}

export function toolParameters(tools: Tool[]): NamedParameter[] {
	return tools.flatMap((tool) =>
		Object.entries(propertiesOf(tool)).map(([name, schema]) => ({ tool: tool.name, name, schema })),
	);
}

export function description(schema: JsonObject): string {
	return typeof schema.description === "string" ? schema.description : "";
}
