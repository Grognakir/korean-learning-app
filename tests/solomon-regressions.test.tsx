import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Messenger } from "@/features/solomonOs/apps/Messenger";
import { resetLayout } from "@/features/solomonOs/apps/Settings";
import { createOsStore } from "@/features/solomonOs/store";
import { GREETING, StoryGame } from "@/features/lessonSticker/story/StoryGame";
import { EPISODES } from "@/features/lessonSticker/story/episodeList";
import { SolomonOs } from "@/features/solomonOs/SolomonOs";

beforeEach(()=>localStorage.clear());
afterEach(()=>vi.useRealTimers());

it("изолирует аккаунты и мигрирует старое состояние только первому владельцу",()=>{
  localStorage.setItem("solomon:chat",JSON.stringify({text:"old"}));
  expect(createOsStore("lab",false).load("chat",null)).toBeNull();
  const a=createOsStore("a"),b=createOsStore("b");
  expect(a.load("chat",null)).toEqual({text:"old"});
  expect(b.load("chat",null)).toBeNull();
  a.save("task",{id:"a-task"});b.save("task",{id:"b-task"});
  expect(a.load("task",null)).toEqual({id:"a-task"});
  expect(b.load("task",null)).toEqual({id:"b-task"});
  a.remove("chat");expect(a.load("chat",null)).toBeNull();
});

it("восстанавливает очередь входящих сообщений после закрытия во время печати",()=>{
  vi.useFakeTimers();
  const view=()=> <Messenger phone={false} onRead={()=>{}}/>;
  render(view());act(()=>vi.advanceTimersByTime(900));act(()=>vi.advanceTimersByTime(900));
  fireEvent.click(screen.getByRole("button",{name:/^집에 있어요\./}));
  act(()=>vi.advanceTimersByTime(200));cleanup();
  act(()=>vi.advanceTimersByTime(1500));render(view());
  expect(screen.queryByRole("button",{name:/^좋아요!/})).toBeNull();
  act(()=>vi.advanceTimersByTime(900));
  expect(screen.getAllByText("그럼 같이 쇼핑 갈래요?").length).toBeGreaterThan(0);
  expect(JSON.parse(localStorage.getItem("solomon:chat")!).log.filter((line:string[])=>line[1]==="그럼 같이 쇼핑 갈래요?")).toHaveLength(1);
  expect(screen.getByRole("button",{name:/^좋아요!/})).toBeTruthy();
});

it("сброс расположения не удаляет переписку",()=>{
  const store=createOsStore("layout-test");store.save("chat",{text:"keep"});store.save("windows",{test:true});
  resetLayout(store);
  expect(store.load("chat",null)).toEqual({text:"keep"});expect(store.load("windows",null)).toBeNull();
});

describe("активное окно",()=>{
  it("не выбирает ответ в неактивном StoryGame",()=>{
    const episode=EPISODES.find((e)=>e.id==="wedding")!;
    const view=(active:boolean)=><StoryGame episode={episode} progressKey="inactive-test" persist={false} active={active}/>;
    const result=render(view(true));fireEvent.click(screen.getByRole("button",{name:"[ START ]"}));
    for(let i=0;i<5&&!screen.queryByRole("group",{name:"Ваш ответ"});i++)fireEvent.click(screen.getByRole("button",{name:"▶ 다음"}));
    result.rerender(view(false));fireEvent.keyDown(document.body,{key:"2"});
    expect(screen.getByRole("group",{name:"Ваш ответ"})).toBeTruthy();
    result.rerender(view(true));fireEvent.keyDown(document.body,{key:"2"});expect(screen.queryByRole("group",{name:"Ваш ответ"})).toBeNull();
  });
  it("восстанавливает реплику звонка после перезагрузки OS",()=>{
    render(<SolomonOs/>);
    fireEvent.keyDown(screen.getByRole("button",{name:/^전화 — Телефон/}),{key:"Enter"});
    fireEvent.click(screen.getByRole("button",{name:/지아: 부재중/}));
    for(let i=0;i<5&&!screen.queryByRole("group",{name:"Ваш ответ"});i++)fireEvent.click(screen.getByRole("button",{name:"▶ 다음"}));
    const before=within(screen.getByRole("group",{name:"Ваш ответ"})).getAllByRole("button").map((b)=>b.textContent);
    cleanup();render(<SolomonOs/>);
    expect(within(screen.getByRole("group",{name:"Ваш ответ"})).getAllByRole("button").map((b)=>b.textContent)).toEqual(before);
  });
});

it("сохраняет этап встречи до подтверждения завершения миссии",()=>{
  const episode=EPISODES.find((e)=>e.id==="interview")!;
  localStorage.setItem("solomon:task",JSON.stringify({trainerId:"lesson10-clothes",episodeId:episode.id,cart:episode.rules.example}));
  localStorage.setItem("solomon:meeting","true");
  localStorage.setItem("solomon:meetingSnapshot",JSON.stringify({episodeId:episode.id,index:episode.steps.findIndex((s)=>s.type==="verdict"),cart:episode.rules.example,clerk:GREETING,paid:true,verdictStep:0}));
  render(<SolomonOs/>);
  for(let i=0;i<6&&!screen.queryByRole("button",{name:/Mission completed/});i++)fireEvent.click(screen.getByRole("button",{name:"▶ 다음"}));
  expect(screen.getByRole("button",{name:/Mission completed/})).toBeTruthy();
  cleanup();render(<SolomonOs/>);
  expect(screen.getByRole("dialog",{name:"Встреча с 지아"})).toBeTruthy();
  expect(screen.getByRole("button",{name:/Mission completed/})).toBeTruthy();
});

it("не перехватывает клавишу от кнопки вне окна игры",()=>{
  const episode=EPISODES.find((e)=>e.id==="wedding")!;
  const index=episode.steps.findIndex((s)=>s.type==="reply");
  render(<><button type="button">Другое окно</button><div role="dialog" aria-label="Окно игры"><StoryGame episode={episode} progressKey="scope-test" persist={false} range={{from:index,to:index+1}}/></div></>);
  fireEvent.keyDown(screen.getByRole("button",{name:"Другое окно"}),{key:"2"});
  expect(screen.getByRole("group",{name:"Ваш ответ"})).toBeTruthy();
  fireEvent.keyDown(within(screen.getByRole("group",{name:"Ваш ответ"})).getAllByRole("button")[0],{key:"2"});
  expect(screen.queryByRole("group",{name:"Ваш ответ"})).toBeNull();
});
