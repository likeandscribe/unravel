import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimeAgo } from "./time-ago";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("correct relative time", () => {
  vi.setSystemTime(new Date("2024-01-02"));
  render(<TimeAgo createdAt={new Date("2024-01-01")} />);
  expect(screen.getByText("1 day ago")).toBeDefined();
});
