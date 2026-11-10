import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { ComprehensionExercise } from "@/features/learning/components/blocks/ComprehensionExercise";
import { GrammarExercise } from "@/features/learning/components/blocks/GrammarExercise";
import { WritingExercise } from "@/features/learning/components/blocks/WritingExercise";
import type { ComprehensionExerciseBlock, GrammarExerciseBlock, WritingExerciseBlock } from "@/features/learning/types";

beforeEach(()=>localStorage.clear());
const grammar:GrammarExerciseBlock={id:"draft-test",type:"grammar_exercise",exercise_title:"연습",grammar_ref:"test",prompt:"연습",example:{given:["가다"],dialogue:["가요"]},template:["{0}"],items:[{given:["가다"],answers:["가요"]}]};
const writing:WritingExerciseBlock={id:"writing-test",type:"writing_exercise",title:"쓰기",outline_prompt:"개요",outline:[{stage:"처음",explanation:"",questions:[{kr:"어디에 가요?",ru:"Куда?"}]}],manuscript_prompt:"글"};
const exercise=()=> <GrammarExercise block={grammar} textbookSlug="draft-book" lessonNumber={11}/>;

it("восстанавливает непроверенный ответ и правку после проверки",()=>{
  render(exercise());fireEvent.click(screen.getByRole("button",{name:"가다"}));
  fireEvent.change(screen.getByRole("textbox"),{target:{value:"가"}});
  cleanup();render(exercise());fireEvent.click(screen.getByRole("button",{name:"가다"}));
  expect(screen.getByRole("textbox")).toHaveProperty("value","가");
  fireEvent.click(screen.getByRole("button",{name:"Проверить"}));
  fireEvent.change(screen.getByRole("textbox"),{target:{value:"가요"}});
  cleanup();render(exercise());fireEvent.click(screen.getByRole("button",{name:"가다"}));
  expect(screen.getByRole("textbox")).toHaveProperty("value","가요");
  expect(screen.queryByText(/Неверно/)).toBeNull();
});

it("сохраняет сочинение и план отдельно для каждого урока",()=>{
  const page=(lesson:number)=><WritingExercise block={writing} textbookSlug="draft-book" lessonNumber={lesson}/>;
  render(page(11));
  fireEvent.change(screen.getByRole("textbox",{name:"어디에 가요?"}),{target:{value:"센트럴파크"}});
  fireEvent.change(screen.getByRole("textbox",{name:"Текст сочинения"}),{target:{value:"횡단보도를 건너세요."}});
  cleanup();render(page(12));
  expect(screen.getByRole("textbox",{name:"Текст сочинения"})).toHaveProperty("value","");
  cleanup();render(page(11));
  expect(screen.getByRole("textbox",{name:"어디에 가요?"})).toHaveProperty("value","센트럴파크");
  expect(screen.getByRole("textbox",{name:"Текст сочинения"})).toHaveProperty("value","횡단보도를 건너세요.");
});

it("сохраняет выбранные ответы, текст и таблицу в заданиях на понимание после обновления страницы",()=>{
  const block:ComprehensionExerciseBlock={id:"comp-test",type:"comprehension_exercise",exercise_kind:"listening",title:"듣기",questions:[
    {kind:"open",prompt:"무슨 이야기를 합니까?"},
    {kind:"table",prompt:"쓰십시오.",table:{columns:["나라"],rows:["가"]}},
    {kind:"choice",prompt:"고르십시오.",choices:["하나","둘"],correct:1},
  ]};
  const page=(lesson:number)=><ComprehensionExercise block={block} textbookSlug="draft-book" lessonNumber={lesson}/>;
  const {container}=render(page(13));
  fireEvent.change(screen.getByRole("textbox",{name:"무슨 이야기를 합니까?"}),{target:{value:"고민"}});
  fireEvent.change(container.querySelector("table input") as HTMLInputElement,{target:{value:"한국"}});
  fireEvent.click(screen.getByRole("button",{name:/둘/}));
  cleanup();
  const again=render(page(13));
  expect(screen.getByRole("textbox",{name:"무슨 이야기를 합니까?"})).toHaveProperty("value","고민");
  expect((again.container.querySelector("table input") as HTMLInputElement).value).toBe("한국");
  expect(screen.getByText("✓ Верно!")).toBeTruthy();
  cleanup();render(page(14));
  expect(screen.getByRole("textbox",{name:"무슨 이야기를 합니까?"})).toHaveProperty("value","");
  expect(screen.queryByText("✓ Верно!")).toBeNull();
});
