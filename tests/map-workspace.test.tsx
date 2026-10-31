import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { MapApp } from "@/features/solomonOs/map/MapApp";
import { createRun, freshWorkspace, type MapWorkspace } from "@/features/solomonOs/map/missions";

afterEach(cleanup);
function Harness({initial}:{initial:MapWorkspace}) {
  const [workspace,setWorkspace]=useState(initial);
  return <MapApp workspace={workspace} onChange={setWorkspace} onNotes={()=>{}}/>;
}
describe("Переключение маршрутов",()=>{
  it("показывает выбранный новый маршрут до начала попытки",()=>{
    render(<Harness initial={createRun(freshWorkspace(),1)}/>);
    fireEvent.change(screen.getByRole("combobox",{name:"Маршрут задания"}),{target:{value:"clinic"}});
    expect(screen.getByRole("heading",{name:"Дорога к ветклинике"})).toBeTruthy();
    expect(screen.getByLabelText("Карта: Район учебника")).toBeTruthy();
    expect(screen.getByRole("button",{name:"Начать задание →"})).toBeTruthy();
    expect(screen.queryByRole("button",{name:"Проверить маршрут"})).toBeNull();
  });
  it("восстанавливает район и сценарий при смене роли",()=>{
    const self=createRun(freshWorkspace(),1);
    const both=createRun({...self,mode:"guide",scenarioId:"clinic"},2);
    render(<Harness initial={{...both,mode:"self",scenarioId:"songdo-walk"}}/>);
    fireEvent.change(screen.getByRole("combobox",{name:"Тип задания"}),{target:{value:"guide"}});
    expect(screen.getByLabelText("Карта: Район учебника")).toBeTruthy();
    expect(screen.getByRole("heading",{name:"Дорога к ветклинике"})).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox",{name:"Тип задания"}),{target:{value:"self"}});
    expect(screen.getByLabelText("Карта: Сонгдо")).toBeTruthy();
    expect(screen.getByRole("heading",{name:"Из аутлета к Central Park"})).toBeTruthy();
  });
});
