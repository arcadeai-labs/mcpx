import defaultRubricData from "../../rubric/mcp-quality.json";
import { QUALITY_RULES } from "./rules/index.ts";
import { RULE_CATEGORIES, type RuleCategory } from "./rules/rule.ts";

export interface GradeBand {
	grade: string;
	minimum: number;
}

export interface RubricRule {
	id: string;
	category: RuleCategory;
	name: string;
	weight: number;
	enabled: boolean;
}

export interface Rubric {
	version: number;
	gradeBands: GradeBand[];
	rules: RubricRule[];
}

export async function loadRubric(path?: string): Promise<Rubric> {
	if (!path) return validateRubric(defaultRubricData);
	const file = Bun.file(path);
	if (!(await file.exists())) throw new Error(`Rubric file not found: ${path}`);
	return validateRubric(JSON.parse(await file.text()));
}

export function validateRubric(data: unknown): Rubric {
	if (!isObject(data)) throw new Error("Rubric must be a JSON object");
	if (!Number.isInteger(data.version) || (data.version as number) < 1) {
		throw new Error("Rubric version must be a positive integer");
	}
	const gradeBands = validateGradeBands(data.gradeBands);
	if (!Array.isArray(data.rules)) throw new Error('Rubric must have a "rules" array');

	const registry = new Map(QUALITY_RULES.map((rule) => [rule.id, rule]));
	const seen = new Set<string>();
	const rules: RubricRule[] = data.rules.map((raw, index) => {
		if (!isObject(raw)) throw new Error(`Rubric rule ${index} must be an object`);
		const id = requireString(raw.id, `Rubric rule ${index} id`);
		if (seen.has(id)) throw new Error(`Duplicate rubric rule: ${id}`);
		seen.add(id);
		const implementation = registry.get(id);
		if (!implementation) throw new Error(`Unknown rubric rule: ${id}`);
		const category = requireString(raw.category, `${id} category`);
		const name = requireString(raw.name, `${id} name`);
		if (!RULE_CATEGORIES.includes(category as RuleCategory) || category !== implementation.category) {
			throw new Error(`${id} category must match implementation (${implementation.category})`);
		}
		if (name !== implementation.name) throw new Error(`${id} name must match implementation (${implementation.name})`);
		if (typeof raw.weight !== "number" || !Number.isFinite(raw.weight) || raw.weight < 0) {
			throw new Error(`${id} weight must be a non-negative number`);
		}
		return {
			id,
			category: implementation.category,
			name,
			weight: raw.weight,
			enabled: raw.enabled !== false,
		};
	});

	const missing = QUALITY_RULES.filter((rule) => !seen.has(rule.id));
	if (missing.length > 0) throw new Error(`Rubric is missing rules: ${missing.map((rule) => rule.id).join(", ")}`);
	const total = rules.filter((rule) => rule.enabled).reduce((sum, rule) => sum + rule.weight, 0);
	if (Math.abs(total - 100) > 1e-9) throw new Error(`Enabled rubric weights must total 100 (got ${total})`);
	return { version: data.version as number, gradeBands, rules };
}

function validateGradeBands(value: unknown): GradeBand[] {
	if (!Array.isArray(value) || value.length === 0) throw new Error("Rubric gradeBands must be a non-empty array");
	const bands = value.map((raw, index) => {
		if (!isObject(raw)) throw new Error(`Grade band ${index} must be an object`);
		const grade = requireString(raw.grade, `Grade band ${index} grade`);
		if (typeof raw.minimum !== "number" || raw.minimum < 0 || raw.minimum > 100) {
			throw new Error(`Grade band ${grade} minimum must be between 0 and 100`);
		}
		return { grade, minimum: raw.minimum };
	});
	return bands.sort((a, b) => b.minimum - a.minimum);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value: unknown, label: string): string {
	if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
	return value;
}
