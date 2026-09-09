import { describe, expect, test } from "bun:test";
import {
	MCP_V2_PROTOCOL,
	parseMcpVersion,
	resolveMcpVersion,
	versionNegotiationFor,
} from "../../src/client/mcp-version.ts";

describe("parseMcpVersion", () => {
	test("accepts v1 aliases", () => {
		expect(parseMcpVersion("v1")).toBe("v1");
		expect(parseMcpVersion("V1")).toBe("v1");
		expect(parseMcpVersion("1")).toBe("v1");
		expect(parseMcpVersion("legacy")).toBe("v1");
	});

	test("accepts v2 aliases", () => {
		expect(parseMcpVersion("v2")).toBe("v2");
		expect(parseMcpVersion("V2")).toBe("v2");
		expect(parseMcpVersion("2")).toBe("v2");
		expect(parseMcpVersion("modern")).toBe("v2");
	});

	test("accepts auto", () => {
		expect(parseMcpVersion("auto")).toBe("auto");
		expect(parseMcpVersion("AUTO")).toBe("auto");
	});

	test("returns undefined for empty input", () => {
		expect(parseMcpVersion(undefined)).toBeUndefined();
		expect(parseMcpVersion(null)).toBeUndefined();
		expect(parseMcpVersion("")).toBeUndefined();
		expect(parseMcpVersion("  ")).toBeUndefined();
	});

	test("throws on invalid values", () => {
		expect(() => parseMcpVersion("v3")).toThrow(/Invalid MCP version/);
		expect(() => parseMcpVersion("latest")).toThrow(/v1, v2, or auto/);
	});
});

describe("resolveMcpVersion", () => {
	test("defaults to v1", () => {
		expect(resolveMcpVersion({})).toBe("v1");
	});

	test("per-server config wins over CLI and env", () => {
		expect(resolveMcpVersion({ server: "v2", cli: "v1", env: "auto" })).toBe("v2");
	});

	test("CLI wins over env", () => {
		expect(resolveMcpVersion({ cli: "auto", env: "v2" })).toBe("auto");
	});

	test("env wins over fallback", () => {
		expect(resolveMcpVersion({ env: "v2", fallback: "v1" })).toBe("v2");
	});
});

describe("versionNegotiationFor", () => {
	test("v1 uses legacy initialize", () => {
		expect(versionNegotiationFor("v1")).toEqual({ mode: "legacy" });
	});

	test("v2 pins the 2026-07-28 protocol", () => {
		expect(versionNegotiationFor("v2")).toEqual({ mode: { pin: MCP_V2_PROTOCOL } });
	});

	test("auto probes then falls back", () => {
		expect(versionNegotiationFor("auto")).toEqual({ mode: "auto" });
	});
});
