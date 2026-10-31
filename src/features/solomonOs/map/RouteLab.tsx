"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { INTERVIEW_EPISODE } from "../../lessonSticker/story/interviewEpisode";
import { Shop } from "../apps/Shop";
import type { OutfitPiece } from "../../lessonSticker/clothing/situations";
import { Notes, NOTE_STYLES, type NoteStyle } from "../apps/Notes";
import { OsStorageProvider, useOsStore } from "../OsStorage";
import { routeNote, shoppingNote } from "../missions";
import { MAP_STYLES, REGIONS, type RegionId } from "./catalog";
import { MapApp } from "./MapApp";
import { activeRun, createRun, freshWorkspace, SCENARIOS, scenarioById, VARIANTS, type MapWorkspace, type RouteMode } from "./missions";
import styles from "./RouteLab.module.css";

export function RouteLab({userId}:{userId:string}) {
  return <OsStorageProvider userId={`${userId}:design-lab`} migrateLegacy={false}><Lab /></OsStorageProvider>;
}
function Lab() {
  const store=useOsStore();
  const [tab,setTab]=useState<"map"|"notes"|"shop">("map");
  const [workspace,setWorkspace]=useState<MapWorkspace>(()=>store.load("workspace",{...createRun({...createRun(freshWorkspace()),mode:"guide",scenarioId:"clinic"}),mode:"self",scenarioId:"songdo-walk"}));
  const [region,setRegion]=useState<RegionId>(()=>scenarioById(workspace.scenarioId).region);
  const [noteStyle,setNoteStyle]=useState<NoteStyle>(()=>store.load("noteStyle","paper"));
  useEffect(()=>store.save("workspace",workspace),[workspace,store]);
  useEffect(()=>store.save("noteStyle",noteStyle),[noteStyle,store]);
  const [sampleCart,setSampleCart]=useState<OutfitPiece[]>(()=>store.load("sampleCart",[{id:"suit",color:"navy",pattern:"plain"}]));
  useEffect(()=>store.save("sampleCart",sampleCart),[sampleCart,store]);
  const [sampleAt]=useState(()=>store.load("sampleAt",Date.now()));
  useEffect(()=>store.save("sampleAt",sampleAt),[sampleAt,store]);
  const sampleTask={id:"sample-interview",assignedAt:sampleAt,trainerId:"lesson10-clothes",episodeId:"interview",cart:sampleCart};
  const notes=[...workspace.runs.map(routeNote),shoppingNote(sampleTask,INTERVIEW_EPISODE)];
  const mode=workspace.mode;
  const setMode=(next:RouteMode)=>{
    const run=activeRun({...workspace,mode:next});
    const scenarioId=run?.scenarioId??workspace.scenarioId;
    setWorkspace({...workspace,mode:next,scenarioId,style:VARIANTS[next][workspace.variant[next]].style});
    setRegion(scenarioById(scenarioId).region);
  };
  const setVariant=(index:number)=>{
    const scenarioId=mode==="self"&&index===4?"songdo-metro":workspace.scenarioId;
    setWorkspace({...workspace,variant:{...workspace.variant,[mode]:index},style:VARIANTS[mode][index].style,scenarioId});
    setRegion(scenarioById(scenarioId).region);
  };
  return <main className={styles.lab}>
    <header className={styles.top}><Link href="/os">← Solomon OS</Link><span>Предпросмотр приложений</span><small>Варианты — слева</small></header>
    <div className={styles.layout}>
      <aside className={styles.controls} aria-label="Варианты предпросмотра">
        <div className={styles.apps}><button type="button" aria-pressed={tab==="map"} onClick={()=>setTab("map")}>지도 · Карта</button><button type="button" aria-pressed={tab==="notes"} onClick={()=>setTab("notes")}>메모 · Заметки</button></div>
        {tab==="map"?<>
          <label>Задание</label><div className={styles.numbers} role="group" aria-label="Тип задания">{(["self","guide"] as const).map((id,i)=><button type="button" key={id} title={id==="self"?"Построй свой маршрут":"Проведи брата 지아"} aria-label={id==="self"?"Построй свой маршрут":"Проведи брата 지아"} aria-pressed={mode===id} onClick={()=>setMode(id)}>{i+1}</button>)}</div>
          <label>Вариант</label><div className={styles.numbers} role="group" aria-label="Варианты задания">{VARIANTS[mode].map((v,i)=><button type="button" key={v.name} title={v.name} aria-label={v.name} aria-pressed={workspace.variant[mode]===i} onClick={()=>setVariant(i)}>{i+1}</button>)}</div>
          <span className={styles.caption}>{VARIANTS[mode][workspace.variant[mode]].name}</span>
          <label>Карта</label><div className={styles.numbers} role="group" aria-label="Вид карты">{MAP_STYLES.map((s,i)=><button type="button" key={s.id} title={s.name} aria-label={s.name} aria-pressed={workspace.style===s.id} onClick={()=>setWorkspace({...workspace,style:s.id})}>{i+1}</button>)}</div>
          <label>Район<select aria-label="Район карты" value={region} onChange={(e)=>setRegion(e.target.value as RegionId)}>{REGIONS.map((r)=><option key={r.id} value={r.id}>{r.ru}</option>)}</select></label>
          <label>Маршрут<select aria-label="Маршрут задания" value={workspace.scenarioId} onChange={(e)=>{setWorkspace({...workspace,scenarioId:e.target.value});setRegion(scenarioById(e.target.value).region);}}>{SCENARIOS.map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        </>:tab==="notes"?<><label>Вариант</label><div className={styles.numbers} role="group" aria-label="Оформление заметок">{NOTE_STYLES.map((s,i)=><button type="button" key={s.id} title={s.name} aria-label={s.name} aria-pressed={noteStyle===s.id} onClick={()=>setNoteStyle(s.id)}>{i+1}</button>)}</div><span className={styles.caption}>{NOTE_STYLES.find((s)=>s.id===noteStyle)?.name}</span></>:<button type="button" onClick={()=>setTab("notes")}>← К заметкам</button>}
        <p className={styles.footnote}>Отдельные примеры. Учебный прогресс OS не меняется.</p>
      </aside>
      <section className={styles.surface} data-app={tab} aria-label="Экран приложения"><div className={styles.titlebar}><span>{tab==="map"?"지도 · Карта":tab==="notes"?"메모 · Заметки":"쇼핑 · Магазин"}</span><span aria-hidden>—　□　×</span></div><div className={styles.content}>
        {tab==="map"?<MapApp key={`${mode}-${workspace.scenarioId}-${workspace.variant[mode]}`} comparison regionOverride={region} workspace={workspace} onChange={setWorkspace} onNotes={()=>setTab("notes")}/>:tab==="shop"?<Shop task={sampleTask} onCart={setSampleCart} onPay={()=>setTab("notes")}/>:<Notes key={noteStyle} initialStyle={noteStyle} notes={notes} onOpen={(note)=>{if(note.routeRunId){const run=workspace.runs.find((r)=>r.id===note.routeRunId);if(run){setWorkspace({...workspace,mode:run.mode,scenarioId:run.scenarioId,active:{...workspace.active,[run.mode]:run.id}});setRegion(scenarioById(run.scenarioId).region);}}setTab(note.app==="shop"?"shop":"map");}}/>}
      </div></section>
    </div>
  </main>;
}
