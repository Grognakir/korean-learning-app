import type { MapStyle, RegionId } from "./catalog";

export type RouteMode = "self" | "guide";
export type RouteAction = "walk" | "right" | "left" | "cross" | "underpass" | "ride" | "exit";
export const ACTIONS: {id: RouteAction; ko: string; ru: string}[] = [
  {id:"walk",ko:"쭉 가다",ru:"идти прямо"},{id:"right",ko:"오른쪽으로 돌다",ru:"повернуть направо"},
  {id:"left",ko:"왼쪽으로 돌다",ru:"повернуть налево"},{id:"cross",ko:"횡단보도를 건너다",ru:"перейти улицу"},
  {id:"underpass",ko:"지하도를 건너다",ru:"пройти подземный переход"},{id:"ride",ko:"지하철을 타다",ru:"ехать на метро"},
  {id:"exit",ko:"내리다",ru:"выйти из транспорта"},
];
export type RouteStep = {to: string; action: RouteAction; ko: string; ru: string; grammar: string; landmarks: string[]; verb: string; direction?: string; distance?:number};
export type RouteScenario = {id: string; region: RegionId; title: string; start: string; goal: string; briefKo: string; briefRu: string; heading: string; steps: RouteStep[]};
export const SCENARIOS: RouteScenario[] = [
  {id:"songdo-walk",region:"songdo",title:"Из аутлета к Central Park",start:"outlet",goal:"park",heading:"Смотри в сторону перехода · на запад",briefKo:"현대아울렛에서 센트럴파크까지 가 주세요.",briefRu:"От Hyundai Outlet доберись до Central Park. Проложи путь по указаниям, затем проверь его.",steps:[
    {to:"cross",action:"cross",ko:"아울렛 앞에서 횡단보도를 건너세요.",ru:"Перед аутлетом перейди дорогу по переходу.",grammar:"N 앞에서 + 횡단보도를 건너다",landmarks:["횡단보도","길","도로"],verb:"건너"},
    {to:"avenue",action:"walk",ko:"사거리까지 앞으로 쭉 가세요.",ru:"Иди прямо до перекрёстка.",grammar:"N까지 + 쭉 가다",landmarks:["사거리","교차로"],verb:"가|오|걸"},
    {to:"convensia",action:"right",ko:"사거리에서 오른쪽으로 돌아서 컨벤시아까지 가세요.",ru:"На перекрёстке поверни направо и дойди до Convensia.",grammar:"N에서 + 방향으로 돌아서",landmarks:["컨벤시아","사거리"],verb:"돌|도세요|도십시오|회전",direction:"오른쪽|우회전"},
    {to:"park",action:"left",ko:"컨벤시아를 지나가다가 왼쪽으로 돌면 센트럴파크가 있어요.",ru:"Пройдя Convensia, поверни налево — там Central Park.",grammar:"V-다가 + 방향으로 돌다",landmarks:["컨벤시아","센트럴파크","공원"],verb:"돌|도세요|도십시오|회전",direction:"왼쪽|좌회전"},
  ]},
  {id:"clinic",region:"lesson",title:"Дорога к ветклинике",start:"kindergarten",goal:"vet",heading:"У детского сада · смотри на восток",briefKo:"한마음 동물병원에 어떻게 가는지 알려 주세요.",briefRu:"Помоги найти ветклинику 한마음. Маршрут основан на 준비하기 2 урока 11.",steps:[
    {to:"flowers",action:"right",ko:"유치원을 끼고 오른쪽으로 돌면 꽃집이 있어요.",ru:"Поверни направо у детского сада к цветочному магазину.",grammar:"N을/를 끼고 + 방향으로 돌다",landmarks:["유치원","꽃집"],verb:"돌|도세요|도십시오|회전",direction:"오른쪽|우회전"},
    {to:"fire",action:"underpass",ko:"꽃집 앞에서 지하도를 건너세요.",ru:"Перед цветочным магазином пройди подземный переход к пожарной части.",grammar:"N 앞에서 + 지하도를 건너다",landmarks:["지하도"],verb:"건너"},
    {to:"vet",action:"walk",ko:"소방서에서 앞으로 50m쯤 오시면 병원이 있어요.",ru:"От пожарной части иди прямо около 50 м — там клиника.",grammar:"N에서 + 거리 + V-(으)면",landmarks:["소방서","병원","50","오십"],distance:50,verb:"가|오|걸"},
  ]},
  {id:"songdo-metro",region:"songdo",title:"До парка на метро",start:"outlet",goal:"museum",heading:"От входа аутлета к станции",briefKo:"지하철을 타고 센트럴파크에 가서 박물관을 찾으세요.",briefRu:"Учебная поездка: станция у аутлета → метро → станция Central Park → музей. Точные выходы и время здесь не моделируются.",steps:[
    {to:"tech",action:"walk",ko:"테크노파크역 2번 출입구로 가세요.",ru:"Пройди к выходу 2 станции Technopark, соединённому с аутлетом.",grammar:"N(으)로 가다",landmarks:["테크노파크","출입구","출구"],verb:"가|오|걸"},
    {to:"central",action:"ride",ko:"지하철을 타고 센트럴파크역으로 가세요.",ru:"Сядь на метро до станции Central Park.",grammar:"교통수단을 타고 + N(으)로 가다",landmarks:["센트럴파크","지하철"],verb:"타|가"},
    {to:"museum",action:"exit",ko:"센트럴파크역에서 내려서 도시역사관으로 가세요.",ru:"Выйди на станции Central Park и направляйся к музею истории города.",grammar:"V-아/어서 + N(으)로 가다",landmarks:["도시역사관","역사관","박물관"],verb:"내려|내리"},
  ]},
];

export const VARIANTS: Record<RouteMode, {name:string; description:string; layout:string; style:MapStyle}[]> = {
  self:[
    {name:"Точки на карте",description:"Слушаешь просьбу, отмечаешь все шаги, проверяешь готовый путь.",layout:"split",style:"city"},
    {name:"Карточка шага",description:"Одна инструкция за раз. Проверяешь каждый участок отдельно.",layout:"focus",style:"night"},
    {name:"Переписка рядом",description:"Указания остаются в ленте сообщений, маршрут отмечаешь рядом.",layout:"chat",style:"district"},
    {name:"План поездки",description:"Сначала весь план в заметке, затем маршрут и проверка последовательности.",layout:"itinerary",style:"atlas"},
    {name:"Метро + пешком",description:"Соединяешь пеший участок, поездку и выход у нужного места.",layout:"transit",style:"transit"},
  ],
  guide:[
    {name:"Точка + действие",description:"Отметь следующий ориентир и выбери корейский глагол. Оба должны совпасть.",layout:"split",style:"city"},
    {name:"Разговор с братом",description:"Карта и окно звонка. Каждое указание нужно сформулировать перед движением.",layout:"call",style:"night"},
    {name:"Чат с геометками",description:"Отправляй брату фразу вместе с точкой. Он сообщает, куда пришёл.",layout:"chat",style:"district"},
    {name:"Собери фразу",description:"Составь указание из частей: ориентир, направление, глагол и окончание.",layout:"builder",style:"atlas"},
    {name:"Напиши сам",description:"Выбери точку и напиши указание. Проверяются действие, ориентир и форма просьбы.",layout:"free",style:"city"},
  ],
};

export type RouteRun = {id:string; mode:RouteMode; scenarioId:string; at:number; selected:string[]; confirmed:number; commands:string[]; draft:string; completed:boolean; mistakes:number};
export type MapWorkspace = {mode:RouteMode; variant:Record<RouteMode,number>; style:MapStyle; scenarioId:string; runs:RouteRun[]; active:Partial<Record<RouteMode,string>>};
export const freshWorkspace = (): MapWorkspace => ({mode:"self",variant:{self:0,guide:0},style:"city",scenarioId:"songdo-walk",runs:[],active:{}});
export const scenarioById = (id:string) => SCENARIOS.find((s)=>s.id===id) ?? SCENARIOS[0];
export const activeRun = (w:MapWorkspace) => w.runs.find((r)=>r.id===w.active[w.mode]);
export const nextStep = (r:RouteRun) => scenarioById(r.scenarioId).steps[r.confirmed];
export function createRun(w:MapWorkspace, now=Date.now()): MapWorkspace {
  const run:RouteRun={id:`route-${w.mode}-${now}-${w.runs.length}`,mode:w.mode,scenarioId:w.scenarioId,at:now,selected:[],confirmed:0,commands:[],draft:"",completed:false,mistakes:0};
  return {...w,runs:[...w.runs,run],active:{...w.active,[w.mode]:run.id}};
}
export function updateRun(w:MapWorkspace, next:RouteRun): MapWorkspace {
  return {...w,runs:w.runs.map((r)=>r.id===next.id ? next:r)};
}
export function checkPlan(run:RouteRun): {ok:boolean; message:string; run:RouteRun} {
  const steps=scenarioById(run.scenarioId).steps;
  const exact=steps.length===run.selected.length && steps.every((s,i)=>s.to===run.selected[i]);
  if(exact) return {ok:true,message:"Маршрут верный. Ты добрался до цели!",run:{...run,confirmed:steps.length,completed:true}};
  const first=steps.findIndex((s,i)=>s.to!==run.selected[i]);
  return {ok:false,message:`Проверь шаг ${first<0?steps.length+1:first+1}: ориентир или последовательность не совпадают с указанием.`,run:{...run,mistakes:run.mistakes+1}};
}
export function checkCommand(step:RouteStep, point:string, action:RouteAction, phrase?:string) {
  if(point!==step.to) return {ok:false,kind:"route",message:"Этот ориентир ведёт в другую сторону. Перечитай последнее указание."};
  if(action!==step.action) return {ok:false,kind:"action",message:"Точка верная, но действие другое: идти, повернуть или перейти — не одно и то же."};
  if(phrase!==undefined) {
    const text=phrase.normalize("NFC").replace(/\s+/g," ").trim();
    if(!/[가-힣]/.test(text)) return {ok:false,kind:"language",message:"Напиши указание по-корейски."};
    if(/(?:안\s|말고|마세요|않|못\s)/.test(text)) return {ok:false,kind:"language",message:"Получилось отрицание или отказ. Сейчас нужно положительное указание."};
    const distance=text.match(/(\d+)\s*(?:m|미터)/i);
    if(step.distance && distance && Number(distance[1])!==step.distance) return {ok:false,kind:"language",message:"Проверь расстояние: в этом указании нужно около 50 метров."};
    if(step.direction && !new RegExp(step.direction).test(text)) return {ok:false,kind:"language",message:"Укажи нужное направление: 오른쪽 или 왼쪽."};
    if(step.direction?.includes("오른쪽") && /왼쪽|좌회전/.test(text) || step.direction?.includes("왼쪽") && /오른쪽|우회전/.test(text)) return {ok:false,kind:"language",message:"В указании перепутаны направо и налево."};
    if(!step.landmarks.some((landmark)=>text.includes(landmark))) return {ok:false,kind:"language",message:"Добавь ориентир: где повернуть, что перейти или до чего дойти."};
    if(!new RegExp(step.verb).test(text)) return {ok:false,kind:"language",message:"Для этого участка нужен другой глагол."};
    if(!/(세요|십시오|어요|아요|돼요|있어요|있습니다)[.!?\s]*$/.test(text)) return {ok:false,kind:"language",message:"Заверши указание вежливой формой, например -세요."};
    if(!/(에서|까지|으로|로|을|를|앞|쯤)/.test(text)) return {ok:false,kind:"language",message:"Свяжи ориентир с действием: N에서, N까지, N을/를…"};
  }
  return {ok:true,kind:"ok",message:"Понятно! Иду по твоему указанию."};
}
