import { describe, it, expect } from "vitest";
import { getValue, isOn, parseList } from "../src/args";

describe("getValue", () => {
    it.each([
        { args: ["--name", "Card"],                 expected: "Card" },
        { args: ["--name"],                         expected: true },      // last argument
        { args: ["--name", "--force"],              expected: true },      // followed by another flag
        { args: ["--name", "-h"],                   expected: true },
        { args: ["--force"],                        expected: null },      // absent
        { args: ["--name", "A", "--name", "B"],     expected: "B" },       // last occurrence wins
    ])("--name in $args -> $expected", ({ args, expected }) => {
        expect(getValue(args, "--name")).toBe(expected);
    });
});

describe("isOn", () => {
    it.each([
        { value: null,      expected: false },
        { value: true,      expected: true },
        { value: "true",    expected: true },
        { value: "false",   expected: false },
    ] as const)("$value -> $expected", ({ value, expected }) => {
        expect(isOn(value)).toBe(expected);
    });
});

describe("parseList", () => {
    it("splits, trims, drops empty items and duplicates", () => {
        expect(parseList(" title, items,,title ")).toEqual(["title", "items"]);
    });

    it("gives an invalid empty name for a flag without value", () => {
        expect(parseList(true)).toEqual([""]);
    });
});
