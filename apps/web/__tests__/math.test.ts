import { add } from "@/app/utils/add";
import { expect, test } from "vitest";

test("adds", () => {
  expect(add(1, 2)).toBe(3);
});
