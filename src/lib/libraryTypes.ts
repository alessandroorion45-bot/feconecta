export interface LibraryResourceType {
  value: string;
  label: string;
  emoji: string;
}

export const LIBRARY_RESOURCE_TYPES: LibraryResourceType[] = [
  { value: "pdf", label: "PDF", emoji: "📄" },
  { value: "slides", label: "Slides", emoji: "🖥️" },
  { value: "video", label: "Vídeo", emoji: "🎬" },
  { value: "audio", label: "Áudio", emoji: "🎧" },
  { value: "devotional", label: "Devocional", emoji: "🕯️" },
  { value: "study", label: "Estudo", emoji: "📖" },
  { value: "book", label: "Livro", emoji: "📚" },
  { value: "link", label: "Link", emoji: "🔗" },
];

export const LIBRARY_TYPE_BY_VALUE = Object.fromEntries(LIBRARY_RESOURCE_TYPES.map(t => [t.value, t]));

export function getLibraryTypeInfo(type: string): LibraryResourceType {
  return LIBRARY_TYPE_BY_VALUE[type] || { value: type, label: type, emoji: "📁" };
}
