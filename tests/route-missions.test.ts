import { describe, expect, it } from "vitest";
import { ACTIONS, SCENARIOS, VARIANTS, activeRun, checkCommand, checkPlan, createRun, freshWorkspace } from "@/features/solomonOs/map/missions";
import { MAP_STYLES, placeById } from "@/features/solomonOs/map/catalog";
import { routeNote, shoppingNote } from "@/features/solomonOs/missions";
import { INTERVIEW_EPISODE } from "@/features/lessonSticker/story/interviewEpisode";

describe("маршруты",()=>{
  it("каждая инструкция имеет точку и глагол, её эталонная фраза принимается",()=>{
    for(const s of SCENARIOS){
      expect(placeById(s.region,s.start)).toBeTruthy();expect(placeById(s.region,s.goal)).toBeTruthy();
      for(const step of s.steps){
        expect(placeById(s.region,step.to)).toBeTruthy();
        expect(ACTIONS.some((a)=>a.id===step.action)).toBe(true);
        expect(checkCommand(step,step.to,step.action,step.ko),`${s.id}: ${step.ko}`).toMatchObject({ok:true});
      }
    }
    expect(VARIANTS.self).toHaveLength(5);expect(VARIANTS.guide).toHaveLength(5);expect(MAP_STYLES).toHaveLength(5);
  });
  it("не засчитывает точку без правильного действия, отрицание и неправильное направление",()=>{
    const step=SCENARIOS[1].steps[0];
    expect(checkCommand(step,step.to,"walk").ok).toBe(false);
    expect(checkCommand(step,"vet",step.action).ok).toBe(false);
    expect(checkCommand(step,step.to,step.action,"유치원에서 왼쪽으로 도세요.").ok).toBe(false);
    expect(checkCommand(step,step.to,step.action,"유치원에서 오른쪽으로 돌지 마세요.").ok).toBe(false);
    expect(checkCommand(step,step.to,step.action,"오른쪽").ok).toBe(false);
    expect(checkCommand(step,step.to,step.action,"유치원에서 오른쪽으로 도세요.").ok).toBe(true);
    const final=SCENARIOS[1].steps[2];
    expect(checkCommand(final,final.to,final.action,"소방서에서 100m 오세요.").ok).toBe(false);
  });
  it("проверяет порядок всех точек и не помечает выбранный путь выполненным до проверки",()=>{
    const w=createRun(freshWorkspace(),1);const run=activeRun(w)!;
    const path=SCENARIOS[0].steps.map((s)=>s.to);
    const planned={...run,selected:path};
    expect(routeNote(planned).steps.every((s)=>s.status==="todo")).toBe(true);
    expect(checkPlan({...planned,selected:[...path].reverse()}).ok).toBe(false);
    expect(checkPlan(planned).run.completed).toBe(true);
    expect(routeNote(checkPlan(planned).run).steps.every((s)=>s.status==="done")).toBe(true);
  });
  it("заметка покупок отличает купленное, отсутствующее и неверный цвет",()=>{
    const note=shoppingNote({trainerId:"lesson10-clothes",episodeId:"interview",cart:[{id:"suit",color:"navy",pattern:"plain"},{id:"dress_shirt",color:"red",pattern:"plain"}]},INTERVIEW_EPISODE);
    expect(note.steps.map((s)=>s.status)).toEqual(["done","attention","todo","todo"]);
  });
});
