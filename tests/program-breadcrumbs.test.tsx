import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProgramBreadcrumbs } from "@/app/learning/programs/ProgramBreadcrumbs";

it("показывает иерархию учебников, уроков и оглавления", () => {
  render(
    <ProgramBreadcrumbs
      items={[
        { href: "/learning/programs", label: "К учебникам" },
        { href: "/learning/programs/inha-2", label: "К урокам" },
        { href: "/learning/programs/inha-2/2", label: "К оглавлению" },
      ]}
    />,
  );

  expect(screen.getByRole("navigation", { name: "Навигация по программе обучения" })).toBeDefined();
  expect(screen.getByRole("link", { name: "К учебникам" }).getAttribute("href"))
    .toBe("/learning/programs");
  expect(screen.getByRole("link", { name: "К урокам" }).getAttribute("href"))
    .toBe("/learning/programs/inha-2");
  expect(screen.getByRole("link", { name: "К оглавлению" }).getAttribute("href"))
    .toBe("/learning/programs/inha-2/2");
});
