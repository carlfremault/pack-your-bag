import Page from "@/app/page";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

test("renders main page", async () => {
  const { getByText } = await render(<Page />);
  await expect.element(getByText("Hello world! 👋")).toBeInTheDocument();
});
