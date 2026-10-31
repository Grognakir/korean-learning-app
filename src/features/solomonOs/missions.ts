import { describePiece } from "../lessonSticker/clothing/buildSentence";
import { ITEM_BY_ID } from "../lessonSticker/clothing/items";
import { wrongPieces } from "../lessonSticker/story/verdict";
import type { Episode } from "../lessonSticker/story/types";
import { placeById } from "./map/catalog";
import { scenarioById, type RouteRun } from "./map/missions";
import { requestLines, type OsTask } from "./trainers";

export type MissionStep = {id:string; text:string; detail?:string; status:"todo"|"done"|"attention"};
export type MissionLine = {ko:string; ru?:string};
export type MissionNote = {id:string; kind:"shopping"|"route"; title:string; ko:string; brief:string; said:MissionLine[]; at:number; completed:boolean; steps:MissionStep[]; rules:string[]; app:"shop"|"map"; routeRunId?:string};

export function shoppingNote(task:OsTask,episode:Episode):MissionNote {
  const bad=new Set(wrongPieces(episode.rules,task.cart).map((p)=>p.id));
  const steps:MissionStep[]=(episode.rules.required??[]).map((group,i)=>{
    const purchased=task.cart.filter((p)=>group.anyOf.includes(p.id));
    return {id:`required-${i}`,text:`${group.anyOf.map((id)=>ITEM_BY_ID[id]?.ko??id).join(" / ")} 사기`,detail:purchased.length?purchased.map(describePiece).join(", "):group.ru,status:purchased.length?purchased.some((p)=>bad.has(p.id))?"attention":"done":"todo"};
  });
  if(episode.rules.kind==="outfit" && task.cart.some((p)=>p.id==="jacket")&&!task.cart.some((p)=>["suit","pants"].includes(p.id)))steps.push({id:"pants",text:"바지 사기",detail:"К пиджаку нужны брюки",status:"todo"});
  return {id:task.id??`shopping-${episode.id}`,kind:"shopping",title:episode.title,ko:"지아의 부탁",brief:`Купить ${episode.adviceRu}. ${episode.kind==="forJia"?"Для 지아":"Для себя"} — ${episode.placeRu}.`,said:requestLines(episode),at:task.assignedAt??0,completed:false,steps,rules:[...(episode.rules.colors??[]).map((r)=>r.ru),...(episode.rules.patterns??[]).map((r)=>r.ru),...(episode.rules.forbidden??[]).map((r)=>r.ru)],app:"shop"};
}
export function routeNote(run:RouteRun):MissionNote {
  const scenario=scenarioById(run.scenarioId);
  return {id:run.id,kind:"route",title:scenario.title,ko:run.mode==="self"?"나의 경로":"동생 길 안내",brief:run.mode==="self"?scenario.briefRu:`지아 просит помочь брату. ${scenario.briefRu}`,said:[{ko:scenario.briefKo,ru:scenario.briefRu}],at:run.at,completed:run.completed,steps:scenario.steps.map((s,i)=>({id:s.to,text:s.ko,detail:`${placeById(scenario.region,s.to).ru} · ${s.ru}`,status:i<run.confirmed?"done":"todo"})),rules:[`Старт: ${placeById(scenario.region,scenario.start).ko}`,`Цель: ${placeById(scenario.region,scenario.goal).ko}`,run.mode==="guide"?"Каждый участок: точка на карте + глагол; в сложном режиме — фраза.":"Сначала отметь последовательность точек, затем проверь маршрут."],app:"map",routeRunId:run.id};
}
