const icons = {
  plus: <><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></>,
  cards: <><path d="M2 7v10M6 5v14"/><rect x="10" y="2" width="12" height="20" rx="2"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2ZM8 7h8M8 11h6"/></>,
  filter: <path d="M3 6h18M7 12h10M10 18h4"/>,
  edit: <><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m16 3 5 5-9 9-5 1 1-5ZM14 5l5 5"/></>,
  delete: <><path d="M3 6h18M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/></>,
  close: <path d="m18 6-12 12M6 6l12 12"/>,
  folder: <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM3 7h18"/>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
};

export function DictionaryIcon({ name }: { name: keyof typeof icons }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === "close" ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}
