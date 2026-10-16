import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TopicTocMenu } from "@/features/topics/questions/TopicTocMenu";
import { TOC } from "@/features/topics/questions/toc";

it("открывает список разделов темы по нажатию и закрывает после выбора пункта", () => {
  render(<TopicTocMenu />);
  expect(screen.queryByRole("navigation", { name: "Содержание темы" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Содержание темы" }));
  const nav = screen.getByRole("navigation", { name: "Содержание темы" });
  expect(nav.querySelectorAll("a")).toHaveLength(TOC.length);

  fireEvent.click(screen.getByRole("link", { name: "03 Частицы" }));
  expect(screen.queryByRole("navigation", { name: "Содержание темы" })).toBeNull();
});

it("закрывается по Esc", () => {
  render(<TopicTocMenu />);
  fireEvent.click(screen.getByRole("button", { name: "Содержание темы" }));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("navigation", { name: "Содержание темы" })).toBeNull();
});
