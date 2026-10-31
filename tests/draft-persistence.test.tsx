import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { GrammarExercise } from "@/features/learning/components/blocks/GrammarExercise";
import { WritingExercise } from "@/features/learning/components/blocks/WritingExercise";
import type { GrammarExerciseBlock, WritingExerciseBlock } from "@/features/learning/types";

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
