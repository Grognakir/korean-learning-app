import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAngleBrackets } from "@/features/learning/components/blocks/angleBrackets";

describe("renderAngleBrackets", () => {
  it("оставляет в тексте символы 〈 〉 для копирования", () => {
    const { container } = render(<span>{renderAngleBrackets("〈보기〉와 같이")}</span>);
    expect(container.textContent).toBe("〈보기〉와 같이");
    expect(container.querySelectorAll("span span")).toHaveLength(2);
  });

  it("не оборачивает текст без скобок", () => {
    expect(renderAngleBrackets("보기")).toBe("보기");
  });
});
