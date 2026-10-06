import { expect, test } from "bun:test";
import { mentionsTool, nameStyle, nameTokens, toolVerb } from "../../../src/check/rules/helpers/naming.ts";

test("name tokens split snake, kebab, dot, camel, and Pascal case", () => {
	expect(nameTokens("github_get_issue")).toEqual(["github", "get", "issue"]);
	expect(nameTokens("Gmail_ListEmails")).toEqual(["gmail", "list", "emails"]);
	expect(nameTokens("getURLInfo")).toEqual(["get", "url", "info"]);
	expect(nameTokens("notion.search-pages")).toEqual(["notion", "search", "pages"]);
});

test("read-verb synonyms are recognized as read intent", () => {
	for (const name of [
		"fetch_page",
		"retrieve_doc",
		"lookup_user",
		"look_up_user",
		"describe_table",
		"whoami",
		"query_logs",
	]) {
		expect(toolVerb(name)?.intent).toBe("read");
	}
});

test("verbs are found after a namespace or a noun", () => {
	expect(toolVerb("Slack_SendMessage")).toEqual({ verb: "send", intent: "write" });
	expect(toolVerb("issue_create")).toEqual({ verb: "create", intent: "write" });
	expect(toolVerb("acme_repo_delete")).toEqual({ verb: "delete", intent: "destructive" });
	expect(toolVerb("weather_data_summary_today")).toBeUndefined();
});

test("combined verbs take the stronger intent but nouns do not", () => {
	expect(toolVerb("get_or_create_user")?.intent).toBe("write");
	expect(toolVerb("find_and_remove_duplicates")?.intent).toBe("destructive");
	expect(toolVerb("get_post")?.intent).toBe("read");
	expect(toolVerb("list_comment_threads")?.intent).toBe("read");
});

test("name styles ignore single lowercase words", () => {
	expect(nameStyle("search")).toBeUndefined();
	expect(nameStyle("get_issue")).toBe("snake_case");
	expect(nameStyle("getIssue")).toBe("camelCase");
	expect(nameStyle("Gmail_ListEmails")).toBe("Namespace_PascalCase");
});

test("single-word tool mentions require code formatting", () => {
	expect(mentionsTool("Call list_users first", "list_users")).toBe(true);
	expect(mentionsTool("Search for records", "search")).toBe(false);
	expect(mentionsTool("Call `search` first", "search")).toBe(true);
});

test("select, use, and other common verbs are recognized", () => {
	expect(toolVerb("Arcade_SelectTools")?.verb).toBe("select");
	expect(toolVerb("Arcade_UseTool")?.verb).toBe("use");
	expect(toolVerb("Arcade_ListApps")?.intent).toBe("read");
	expect(toolVerb("System_ManageAuthorization")?.verb).toBe("manage");
	expect(toolVerb("notify_team")?.intent).toBe("write");
	expect(toolVerb("filter_rows")?.intent).toBe("read");
});
