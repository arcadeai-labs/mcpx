import type { CheckContext } from "../rule.ts";
import { asObject } from "./schema.ts";

export function authorizationMetadata(context: CheckContext): Record<string, unknown> | undefined {
	return context.http?.oauth?.authorizationServerMetadata;
}

export function stringList(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function absoluteHttps(value: unknown): boolean {
	if (typeof value !== "string") return false;
	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
}

export function validObject(value: unknown): boolean {
	return asObject(value) !== undefined;
}
