export type DocumentRow = { id: string; ko: string; ru: string; detailKo?: string; usageKo?: string; icon?: string; hex?: string };
export type DocumentSection = { id: string; titleKo: string; titleRu: string; groups: { id: string; title?: string; rows: DocumentRow[] }[] };
export type ReadableDocument = { id: string; titleKo: string; titleRu: string; source: string; sections: DocumentSection[] };
