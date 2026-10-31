import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { OutfitPiece } from "@/features/lessonSticker/clothing/situations";
import { ALL_ITEMS } from "@/features/lessonSticker/story/episodes";
import { ShopScene, type ClerkLine } from "@/features/lessonSticker/story/ShopScene";

// Телефон: узкий экран игры.
vi.mock("@/features/lessonSticker/story/usePhone", () => ({
  COMPACT_WIDTH: 640,
  useCompact: () => true,
  useShopLayout: () => "two",
}));

function Shop() {
  const [cart, setCart] = useState<OutfitPiece[]>([]);
  const [clerk, setClerk] = useState<ClerkLine>({ pose: "welcome", text: "뭘 드릴까요?", ru: "Что вам дать?" });
  return (
    <ShopScene
      assortment={ALL_ITEMS}
      cart={cart}
      setCart={setCart}
      clerk={clerk}
      setClerk={setClerk}
      paid={false}
      onPay={() => {}}
      onNext={() => {}}
    />
  );
}

const field = () => screen.getByRole("textbox", { name: "Что купить" });
const keyboard = () => within(screen.getByRole("group", { name: "Корейская клавиатура" }));
const type = (jamos: string) => {
  for (const j of jamos) {
    const key = j === " " ? keyboard().getByRole("button", { name: "Пробел" }) : keyboard().getByRole("button", { name: j });
    fireEvent.pointerDown(key);
  }
};

describe("магазин на телефоне: ввод как в чате", () => {
  it("подсказки собирают фразу, покупка попадает в корзину", () => {
    render(<Shop />);
    fireEvent.click(screen.getByRole("button", { name: "Написать фразу самому" }));
    // В режиме ввода реплики продавца нет — только шаги, подсказки и своя
    // клавиатура; системного поля ввода нет.
    expect(screen.queryByText("뭘 드릴까요?")).toBeNull();
    expect(document.querySelector("textarea, input")).toBeNull();
    // Шаги: сначала одежда (область → вещь), потом цвет, потом узор.
    expect(screen.getByRole("tab", { name: /옷/ }).getAttribute("aria-selected")).toBe("true");
    const chat = within(screen.getByRole("tablist", { name: "Шаги" }).parentElement!);
    fireEvent.click(chat.getByRole("button", { name: "겉옷" }));
    fireEvent.click(chat.getByRole("button", { name: "정장" }));
    expect(chat.getByRole("tab", { name: /색/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(chat.getByRole("button", { name: /남색/ }));
    expect(field().textContent).toBe("남색 정장 주세요");

    fireEvent.click(screen.getByRole("button", { name: "Enter" }));
    expect(screen.queryByRole("tab", { name: /옷/ })).toBeNull();
    expect(screen.getAllByText("남색 정장").length).toBeGreaterThan(0);
  });

  it("своя клавиатура собирает слоги, ⌫ стирает по букве, «보내기» отправляет", () => {
    render(<Shop />);
    fireEvent.click(screen.getByRole("button", { name: "Написать фразу самому" }));
    type("ㅈㅓㅇㅈㅏㅇ ㅈㅜㅅㅔㅇㅛㅎ");
    expect(field().textContent).toBe("정장 주세욯");
    fireEvent.pointerDown(keyboard().getByRole("button", { name: "Стереть" }));
    fireEvent.pointerUp(keyboard().getByRole("button", { name: "Стереть" }));
    expect(field().textContent).toBe("정장 주세요");
    fireEvent.pointerDown(keyboard().getByRole("button", { name: "Отправить" }));
    // Цвета не назвали — продавец переспрашивает.
    expect(screen.getAllByText(/무슨 색으로 드릴까요/).length).toBeGreaterThan(0);
  });
});
