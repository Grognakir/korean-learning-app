import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PlanBreadcrumbs } from "@/app/learning/plans/PlanBreadcrumbs";

it("показывает иерархию учебников, уроков и оглавления", () => {
  render(
    <PlanBreadcrumbs
      items={[
        { href: "/learning/plans", label: "К учебникам" },
        { href: "/learning/plans/inha-2", label: "К урокам" },
        { href: "/learning/plans/inha-2/2", label: "К оглавлению" },
      ]}
    />,
  );

  expect(screen.getByRole("navigation", { name: "Навигация по плану обучения" })).toBeDefined();
  expect(screen.getByRole("link", { name: "К учебникам" }).getAttribute("href"))
    .toBe("/learning/plans");
  expect(screen.getByRole("link", { name: "К урокам" }).getAttribute("href"))
    .toBe("/learning/plans/inha-2");
  expect(screen.getByRole("link", { name: "К оглавлению" }).getAttribute("href"))
    .toBe("/learning/plans/inha-2/2");
});
