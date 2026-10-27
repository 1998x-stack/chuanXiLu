const VOLUME_FILES = ["./data/volume-1.json", "./data/volume-2.json", "./data/volume-3.json"];
export const VOLUME_NAMES = ["上", "中", "下"];
export async function loadCorpus(fetcher = fetch) {
  const volumes = await Promise.all(VOLUME_FILES.map(async path => {
    const response = await fetcher(path);
    if (!response.ok) throw new Error("原典数据加载失败：" + path + " (" + response.status + ")");
    return response.json();
  }));
  return {
    volumes,
    entries: volumes.flatMap(volume => volume.entries),
    prefaces: volumes.flatMap(volume => volume.prefaces.map(item => ({ ...item, volume: volume.volume })))
  };
}
export function splitSentences(text) {
  if (typeof text !== "string") throw new TypeError("Expected classical text");
  return text.match(/[^。！？；]*[。！？；]|[^。！？；]+$/gu)?.filter(Boolean) ?? [];
}
export function entryByNumber(corpus, number) {
  return corpus.entries.find(entry => entry.number === number) ?? null;
}
export function searchEntries(entries, query, volume = "全部") {
  const needle = query.trim().toLocaleLowerCase("zh-CN");
  return entries.filter(entry => (volume === "全部" || entry.volume === volume) &&
    (!needle || [entry.id, entry.section, entry.text, String(entry.number)].some(field =>
      field.toLocaleLowerCase("zh-CN").includes(needle))));
}
export function sourceLink(entry) {
  const hash = "1910cd136f3dd30b41514e61e1a1ebac6adf5771";
  return "https://github.com/jeklau/chuanxilu/blob/" + hash + "/" + entry.sourceFile;
}
