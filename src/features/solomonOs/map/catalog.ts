import type { BuildingId } from "./buildings";

export type RegionId = "songdo" | "lesson" | "incheon" | "korea";
export type PlaceKind = "shop" | "park" | "station" | "museum" | "school" | "hospital" | "temple" | "office" | "food" | "crossing" | "stop";
export type Place = { id: string; ko: string; ru: string; x: number; y: number; kind: PlaceKind; origin: "real" | "lesson" | "game"; source?: string; detail?: string; icon?: BuildingId };
export type Region = { id: RegionId; ko: string; ru: string; subtitle: string; places: Place[]; roads: string[][]; parks?: [x: number, y: number, w: number, h: number, ko: string][]; water?: string };

export const SOURCES = {
  outlet: "https://home.ehyundai.com/newPortal/DP/WC/WC000000_V.do?branchCd=B00174000",
  park: "https://www.insiseol.or.kr/park/songdo/facility/central.jsp",
  culture: "https://www.yeonsu.go.kr/tour/tourism/future_road.asp",
  immigration: "https://www.immigration.go.kr/immigration/2100/subview.do",
  temple: "https://www.yeonsu.or.kr/page/sub3_3",
  metro: "https://www.ictr.or.kr/main/subway/subwayStation.do?line_no=1&station_no=134",
  centralStation: "https://www.ictr.or.kr/main/subway/subwayStation.do?line_no=1&station_no=137",
  naverRoute: "https://map.naver.com/p/directions/3z4eh0,2AEi1R,현대프리미엄아울렛%20송도점,35439053,PLACE_POI/3z3vpR,2AEHfp,송도%20센트럴파크,20118926,PLACE_POI/-/transit",
};

export const REGIONS: Region[] = [
  { id: "songdo", ko: "송도", ru: "Сонгдо", subtitle: "Знакомые места · учебная схема улиц", parks: [[180,130,440,190,"센트럴파크"]], water: "M160 175 C300 260 430 120 620 235", places: [
    {id:"outlet",ko:"현대아울렛",ru:"Hyundai Outlet",x:1010,y:620,kind:"shop",origin:"real",source:SOURCES.outlet,detail:"송도국제대로 123 · выход 2 станции 테크노파크. Naver подтвердил поездку по I1 до 센트럴파크 и автобус 16-1 до 인천스타트업파크 с пешей частью. Проверено 31.10.2026; интервалы меняются.",icon:"mall"},
    {id:"triple",ko:"트리플스트리트",ru:"Торговый квартал",x:1110,y:490,kind:"shop",origin:"real",source:"https://itour.incheon.go.kr/ssst/ssst/detail.do?cotId=ITD21122810413800966",detail:"Торговый квартал у Technopark; существование и расположение подтверждены Incheon Tour, улицы на игровой схеме упрощены."},
    {id:"tech",ko:"테크노파크역",ru:"Technopark · I1",x:970,y:740,kind:"station",origin:"real",source:SOURCES.outlet},
    {id:"cross",ko:"횡단보도",ru:"Пешеходный переход",x:830,y:620,kind:"crossing",origin:"game"},
    {id:"avenue",ko:"사거리",ru:"Перекрёсток",x:700,y:620,kind:"crossing",origin:"game",icon:"junction"},
    {id:"convensia",ko:"송도컨벤시아",ru:"Convensia",x:700,y:390,kind:"office",origin:"real",source:SOURCES.culture},
    {id:"park",ko:"센트럴파크",ru:"Central Park",x:490,y:390,kind:"park",origin:"real",source:SOURCES.park},
    {id:"museum",ko:"도시역사관",ru:"Музей истории города",x:280,y:390,kind:"museum",origin:"real",source:SOURCES.culture},
    {id:"tribowl",ko:"트라이볼",ru:"Tri-bowl",x:280,y:260,kind:"museum",origin:"real",source:SOURCES.culture},
    {id:"central",ko:"센트럴파크역",ru:"Central Park · I1",x:210,y:520,kind:"station",origin:"real",source:SOURCES.centralStation,detail:"По данным перевозчика: выход 3 ведёт к музею истории города, Tri-bowl и Central Park."},
    {id:"knowledge",ko:"지식정보단지역",ru:"Knowledge Information · I1",x:740,y:740,kind:"station",origin:"real",source:SOURCES.metro,detail:"Следующая станция после 테크노파크 в сторону Central Park; схема расстояний условная."},
    {id:"university",ko:"인천대입구역",ru:"Incheon National Univ. · I1",x:490,y:600,kind:"station",origin:"real",source:SOURCES.centralStation},
    {id:"school",ko:"한빛학교",ru:"Школа Ханбит",x:1030,y:280,kind:"school",origin:"game"},
    {id:"hospital",ko:"송도병원",ru:"Городская больница",x:490,y:160,kind:"hospital",origin:"game"},
    {id:"cafe",ko:"분식집",ru:"Ттокпокки и одэн",x:700,y:180,kind:"food",origin:"game"},
    {id:"bus",ko:"한빛학교 정류장",ru:"Остановка «Школа Ханбит»",x:1030,y:160,kind:"stop",origin:"game"},
  ], roads:[["tech","outlet","triple","school","bus"],["outlet","cross","avenue","university","central"],["avenue","convensia","cafe"],["convensia","park","museum","central"],["museum","tribowl"],["park","hospital","cafe","bus"],["tech","knowledge","university","central"]]},
  {id:"lesson",ko:"교재 마을",ru:"Район учебника",subtitle:"2급 11과 · карта ветклиники",parks:[[80,80,300,140,"공원"]],places:[
    {id:"kindergarten",ko:"꿈나무 유치원",ru:"Детский сад",x:300,y:180,kind:"school",origin:"lesson",icon:"kindergarten"},
    {id:"flowers",ko:"무지개 꽃집",ru:"Цветочный магазин",x:300,y:440,kind:"shop",origin:"lesson",icon:"flowers"},
    {id:"fire",ko:"소방서",ru:"Пожарная часть",x:670,y:440,kind:"office",origin:"lesson",detail:"От цветочного магазина сюда ведёт подземный переход 지하도.",icon:"fire"},
    {id:"vet",ko:"한마음 동물병원",ru:"Ветеринарная клиника",x:1000,y:440,kind:"hospital",origin:"lesson",icon:"vet"},
    {id:"post",ko:"우체국",ru:"Почта",x:670,y:180,kind:"office",origin:"game",icon:"post"},
    {id:"store",ko:"편의점",ru:"Магазин у дома",x:1000,y:180,kind:"shop",origin:"game",icon:"store"},
    {id:"station",ko:"기차역",ru:"Вокзал",x:1000,y:670,kind:"station",origin:"game",icon:"train"},
    {id:"snack",ko:"길거리 음식",ru:"Уличная еда",x:670,y:670,kind:"food",origin:"game"},
    {id:"temple",ko:"작은 절",ru:"Небольшой храм",x:300,y:670,kind:"temple",origin:"game"},
  ],roads:[["kindergarten","flowers","temple","snack","station","vet","store","post","kindergarten"],["flowers","fire","vet"],["post","fire","snack"]]},
  {id:"incheon",ko:"인천",ru:"Инчхон · районы",subtitle:"Обзор районов · учебные транспортные связи",parks:[[730,80,340,180,"공원"]],places:[
    {id:"songdo",ko:"송도",ru:"Сонгдо",x:950,y:620,kind:"station",origin:"real",source:SOURCES.park,icon:"city"},
    {id:"immigration",ko:"출입국·외국인청",ru:"Иммиграционный центр",x:300,y:420,kind:"office",origin:"real",source:SOURCES.immigration,detail:"인천 중구 서해대로 393. Находится за пределами Сонгдо; связь на схеме учебная, не прямой подтверждённый автобус."},
    {id:"inha",ko:"인하대학교",ru:"Университет Инха",x:600,y:420,kind:"school",origin:"game"},
    {id:"cityhospital",ko:"시민병원",ru:"Городская больница",x:600,y:620,kind:"hospital",origin:"game"},
    {id:"heungryunsa",ko:"흥륜사",ru:"Храм Хыннюнса",x:950,y:250,kind:"temple",origin:"real",source:SOURCES.temple,detail:"Храм в районе Ёнсу на материковой части; здесь показан как отдельная точка обзорной схемы."},
    {id:"munhak",ko:"문학경기장",ru:"Стадион Мунхак",x:600,y:180,kind:"park",origin:"lesson",detail:"В учебнике: автобусы 5 / 111-2, северные ворота и 500m. Это сведения учебника, не проверенное текущее расписание.",icon:"stadium"},
    {id:"terminal",ko:"버스 터미널",ru:"Автовокзал",x:300,y:180,kind:"station",origin:"game",icon:"bus"},
    {id:"market",ko:"시장",ru:"Рынок и уличная еда",x:130,y:620,kind:"food",origin:"game"},
  ],roads:[["songdo","cityhospital","inha","terminal","munhak","heungryunsa","songdo"],["inha","immigration","market"]]},
  {id:"korea",ko:"도시 연결",ru:"Между городами",subtitle:"Учебная сеть поездок · без настоящего расписания",places:[
    {id:"incheon",ko:"인천",ru:"Инчхон",x:200,y:270,kind:"station",origin:"game",icon:"city"},
    {id:"seoul",ko:"서울",ru:"Сеул",x:500,y:180,kind:"station",origin:"game",icon:"city"},
    {id:"rest",ko:"휴게소",ru:"Зона отдыха · перекус",x:650,y:410,kind:"food",origin:"game"},
    {id:"chuncheon",ko:"춘천",ru:"Чхунчхон",x:970,y:180,kind:"station",origin:"game",icon:"city"},
    {id:"busan",ko:"부산",ru:"Пусан",x:970,y:650,kind:"station",origin:"game",icon:"city"},
    {id:"temple-city",ko:"절과 박물관",ru:"Храм и музей",x:500,y:650,kind:"temple",origin:"game"},
  ],roads:[["incheon","seoul","chuncheon"],["seoul","rest","busan","temple-city"]]},
];

export const regionById = (id: RegionId) => REGIONS.find((r) => r.id === id)!;
export const placeById = (region: RegionId, id: string) => regionById(region).places.find((p) => p.id === id)!;

export const MAP_STYLES = [
  {id:"city",name:"Городской план",description:"Светлая карта, кварталы, вода и ориентиры"},
  {id:"night",name:"Ночная навигация",description:"Тёмная карта OS, контрастный маршрут"},
  {id:"district",name:"Районы",description:"Крупные зоны и места вместо мелких деталей"},
  {id:"transit",name:"Транспорт",description:"Станции и связи на первом плане"},
  {id:"atlas",name:"Атлас",description:"Координатная сетка и пронумерованные точки в стиле OS"},
] as const;
export type MapStyle = typeof MAP_STYLES[number]["id"];

export const SONGDO_TRANSPORT = [
  {name:"Метро I1",path:"테크노파크 → 지식정보단지 → 인천대입구 → 센트럴파크",detail:"Направление 송도달빛축제공원. Музей и Tri-bowl — у выхода 3 Central Park.",source:SOURCES.centralStation},
  {name:"Автобус 16-1",path:"테크노파크역 → 인천스타트업파크 → пешком до парка",detail:"Вариант найден в Naver 31.10.2026. Время ожидания в учебном задании не фиксируется.",source:SOURCES.naverRoute},
];
