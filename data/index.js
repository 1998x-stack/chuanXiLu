const VOLUME_FILES = ["./data/volume-1.json", "./data/volume-2.json", "./data/volume-3.json"];
export const VOLUME_NAMES = ["上", "中", "下"];
export {witnessLabel,crosswalkNumber} from "./concordance.js";
export const READING_KINDS = ["全部", "问答语录", "论学书信", "训蒙教约", "序跋附录"];
export const SOURCE_COMMIT = "1910cd136f3dd30b41514e61e1a1ebac6adf5771";

export function documentKind(document) {
  if (document.kind === "paratext") return "序跋附录";
  if (document.volume !== "中") return "问答语录";
  return /训蒙|教约/.test(document.section) ? "训蒙教约" : "论学书信";
}

export async function loadCorpus(fetcher = fetch) {
  const volumes = await Promise.all(VOLUME_FILES.map(async path => {
    const response = await fetcher(path);
    if (!response.ok) throw new Error("原典数据加载失败：" + path + " (" + response.status + ")");
    return response.json();
  }));
  const entries = volumes.flatMap(volume => volume.entries);
  const prefaces = volumes.flatMap(volume => volume.prefaces.map(item => ({
    ...item, volume:volume.volume, section:item.title
  })));
  const documents = volumes.flatMap(volume => [
    ...volume.entries,
    ...prefaces.filter(preface => preface.volume === volume.volume)
  ]);
  return { volumes, entries, prefaces, documents };
}

// This is an editorial punctuation split, not a verified historical sentence boundary.
// Concatenating the resulting segments MUST reproduce the source string byte-for-byte.
export function splitSentences(text) {
  if (typeof text !== "string") throw new TypeError("Expected classical text");
  return text.match(/[^。！？；]*[。！？；]|[^。！？；]+$/gu)?.filter(Boolean) ?? [];
}
export function sentenceId(docId,index) {
  if (!/^(CXL-\d{4}|CXL-[上中下]-P[1-9]\d*)$/.test(docId) || !Number.isSafeInteger(index) || index < 0)
    throw new RangeError("Invalid document or sentence index");
  return docId + "-s" + String(index+1).padStart(3,"0");
}
export function entryByNumber(corpus, number) {
  return corpus.entries.find(entry => entry.number === number) ?? null;
}
export function documentById(corpus,id) {
  return (corpus.documents ?? corpus.entries).find(entry=>entry.id===id) ?? null;
}
export function searchEntries(entries, query, volume = "全部") {
  const needle = query.trim().toLocaleLowerCase("zh-CN");
  return entries.filter(entry => (volume === "全部" || entry.volume === volume) &&
    (!needle || [entry.id, entry.section, entry.title??"", entry.text, String(entry.number??"")].some(field =>
      field.toLocaleLowerCase("zh-CN").includes(needle))));
}
export function filterDocuments(corpus,{query="",volume="全部",kind="全部",bookmarksOnly=false,bookmarks=new Set(),topic=null}={}) {
  return searchEntries(corpus.documents,query,volume).filter(doc=>
    (kind==="全部" || documentKind(doc)===kind) &&
    (!bookmarksOnly || bookmarks.has(doc.id)) &&
    (!topic || topic.keywords.some(word=>doc.text.includes(word)))
  );
}
export function citationOf(doc){
  return "《传习录·卷"+doc.volume+"·"+doc.section+"》（电子条目 "+doc.id+"；编号非原版固有）";
}
export function readingHash(id, sentenceIndex=null){
  const base = /^CXL-\d{4}$/.test(id) ? "entry-"+id.slice(4) :
    /^CXL-[上中下]-P[1-9]\d*$/.test(id) ? "preface-"+id.slice(4) : null;
  if (!base) throw new Error("Invalid reading ID");
  return "#"+encodeURI(base)+(sentenceIndex===null?"":"-s"+String(sentenceIndex+1).padStart(3,"0"));
}
export function parseReadingHash(hash){
  let raw;
  try {raw=decodeURIComponent(hash.replace(/^#/,""));}catch{return null;}
  let match=raw.match(/^entry-(\d{4})(?:-s(\d{1,4}))?$/);
  if(match)return {id:"CXL-"+match[1],sentenceIndex:match[2]?Number(match[2])-1:null};
  match=raw.match(/^preface-([上中下]-P[1-9]\d*)(?:-s(\d{1,4}))?$/);
  if(match)return {id:"CXL-"+match[1],sentenceIndex:match[2]?Number(match[2])-1:null};
  return null;
}
export function sourceLink(doc){
  // All content comes from the same exact archived upstream commit.
  const valid = /^data\/b\d{2}\.json$/.test(doc.sourceFile??"") ? doc.sourceFile : "data";
  return "https://github.com/jeklau/chuanxilu/" + (valid==="data"?"tree/":"blob/") + SOURCE_COMMIT + "/" + valid;
}
