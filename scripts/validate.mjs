import fs from "node:fs";
import assert from "node:assert/strict";
import {
  loadCorpus,splitSentences,searchEntries,entryByNumber,documentById,documentKind,
  filterDocuments,sentenceId,citationOf,readingHash,parseReadingHash,sourceLink,READING_KINDS,SOURCE_COMMIT
} from "../data/index.js";
import {ANNOTATIONS,TOPICS,annotationCount} from "../data/annotations.js";
import {TOPIC_GUIDE,topicById,topicHits} from "../data/topics.js";

let passed=0;
function check(actual,label){assert.ok(actual,label);passed++}
const volumes=[1,2,3].map(i=>JSON.parse(fs.readFileSync("data/volume-"+i+".json","utf8")));
const entries=volumes.flatMap(v=>v.entries);
const prefaces=volumes.flatMap(v=>v.prefaces.map(p=>({...p,volume:v.volume,section:p.title})));
const corpus=await loadCorpus(async path=>({
  ok:true,json:async()=>JSON.parse(fs.readFileSync(path.replace("./",""),"utf8"))
}));
check(volumes.length===3,"three volumes");
check(JSON.stringify(volumes.map(v=>v.volume))===JSON.stringify(["上","中","下"]),"canonical volume order");
check(JSON.stringify(volumes.map(v=>v.entries.length))===JSON.stringify([129,71,143]),"source transcription counts");
check(entries.length===343,"343 unverified third-party source fragments (not independently verified full text)");
check(prefaces.length===5,"five paratexts imported and accessible");
check(corpus.documents.length===348,"all documents available for navigation");
check(corpus.prefaces.length===5,"prefaces included by loader");
check(volumes.every(v=>v.schemaVersion===1),"versioned data schema");
check(volumes.every(v=>v.source.commit===SOURCE_COMMIT),"source commit pinned and consistent");
check(volumes.every(v=>v.source.modernTranslationImported===false),"no upstream modern translations imported");
check(new Set(corpus.documents.map(e=>e.id)).size===348,"all stable IDs globally unique");
check(new Set(TOPICS).size===TOPICS.length,"annotation topics unique");
check(new Set(READING_KINDS).size===READING_KINDS.length,"kind filters unique");

for(const [i,e] of entries.entries()){
  const title=e.id;
  check(e.number===i+1,"ordinal "+title);
  check(e.id==="CXL-"+String(i+1).padStart(4,"0"),"stable ID "+title);
  check(e.volume===(i<129?"上":i<200?"中":"下"),"volume membership "+title);
  check(e.text.trim().length>=10,"nonempty text "+title);
  check(e.section&&e.section!=="待考","source section "+title);
  check(/^data\/b\d{2}\.json$/.test(e.sourceFile),"source file "+title);
  check(e.verification==="pending","not prematurely verified "+title);
  const segments=splitSentences(e.text);
  check(segments.length>0&&segments.join("")===e.text,"lossless punctuation split "+title);
  check(entryByNumber(corpus,e.number)===corpus.entries[i],"entryByNumber "+title);
  check(documentById(corpus,title)===corpus.entries[i],"documentById "+title);
  check(documentKind(e)===(e.volume==="中"?/训蒙|教约/.test(e.section)?"训蒙教约":"论学书信":"问答语录"),"kind "+title);
  check(sourceLink(e).startsWith("https://github.com/jeklau/chuanxilu/blob/"+SOURCE_COMMIT+"/data/b"),"pinned source "+title);
  const hash=readingHash(title);
  check(parseReadingHash(hash)?.id===title,"entry permalink "+title);
  const anchor=readingHash(title,0);
  check(parseReadingHash(anchor)?.sentenceIndex===0,"sentence deep link "+title);
  check(sentenceId(title,0)===title+"-s001","stable sentence ID "+title);
}
for(const doc of prefaces){
  check(doc.kind==="paratext","paratext layer "+doc.id);
  check(doc.text.trim().length>20,"paratext readable "+doc.id);
  check(doc.verification==="pending","paratext editorial status "+doc.id);
  check(/^data\/b\d{2}\.json$/.test(doc.sourceFile),"precise paratext provenance "+doc.id);
  check(documentById(corpus,doc.id)?.title===doc.title,"loader handles paratext "+doc.id);
  check(documentKind(doc)==="序跋附录","paratext kind "+doc.id);
  check(parseReadingHash(readingHash(doc.id,0))?.id===doc.id,"encoded preface deep link "+doc.id);
  check(splitSentences(doc.text).join("")===doc.text,"lossless paratext split "+doc.id);
}
check(ANNOTATIONS&&annotationCount()>=20,"meaningful editorial annotations");
for(const [id,items] of Object.entries(ANNOTATIONS)){
  const entry=documentById(corpus,id);
  check(Boolean(entry)&&entry.kind!=="paratext","annotation reference "+id);
  for(const note of items){
    check(note.status==="draft"&&note.author==="1998x-stack contributors","honest editorial status "+id);
    check(TOPICS.includes(note.topic),"known topic "+id);
    check(entry.text.includes(note.quote),"literal quote exists "+id+"/"+note.quote);
    check(splitSentences(entry.text).some(s=>s.includes(note.quote)),"quote within one punctuation segment "+id);
    check(note.gloss.length>35,"substantive independent reading "+id);
  }
}
check(TOPIC_GUIDE.length>=8,"eight curated concept lenses");
check(new Set(TOPIC_GUIDE.map(x=>x.id)).size===TOPIC_GUIDE.length,"concept unique IDs");
for(const topic of TOPIC_GUIDE){
  check(topicById(topic.id)===topic,"concept ID resolution "+topic.id);
  check(topic.keywords.length>0&&topic.summary&&topic.limit,"concept with context and boundary "+topic.id);
  check(topicHits(entries,topic).length>=2,"supported keyword topic "+topic.id);
  for(const e of topic.evidence){
    const source=documentById(corpus,e.id);
    check(Boolean(source),"source exists for concept "+topic.id);
    check(source.text.includes(e.quote),"topic quote matched verbatim "+topic.id+" "+e.id);
    check(splitSentences(source.text).some(s=>s.includes(e.quote)),"concept quote in same segment "+topic.id+" "+e.id);
  }
}
check(searchEntries(entries,"知而不行").some(e=>e.number===5),"classical full-text search");
check(searchEntries(entries,"","上").length===129,"volume one filter");
check(searchEntries(entries,"","中").length===71,"volume two filter");
check(searchEntries(entries,"","下").length===143,"volume three filter");
check(filterDocuments(corpus,{kind:"序跋附录"}).length===5,"paratext reader filter");
check(filterDocuments(corpus,{kind:"训蒙教约"}).length>0,"teaching book filter");
check(filterDocuments(corpus,{kind:"论学书信"}).length>0,"letter filter");
check(filterDocuments(corpus,{kind:"问答语录"}).length===272,"spoken records source count");
check(filterDocuments(corpus,{topic:topicById("zhi-xing")}).every(doc=>topicById("zhi-xing").keywords.some(word=>doc.text.includes(word))),"topic filter grounded in literal hits");
check(filterDocuments(corpus,{bookmarksOnly:true,bookmarks:new Set(["CXL-0005","CXL-上-P1"])}).length===2,"bookmarks handle entries and prefaces");
check(filterDocuments(corpus,{bookmarksOnly:true,bookmarks:new Set(["CXL-上-P1"]),kind:"问答语录"}).length===0,"composable document filters");
check(parseReadingHash("#entry-0005-s003")?.sentenceIndex===2,"sentence hash parses correctly");
check(parseReadingHash("#preface-%E4%B8%8A-P1")?.id==="CXL-上-P1","encoded Unicode hash parses correctly");
check(parseReadingHash("#entry-001")===null,"reject malformed entry links");
check(parseReadingHash("#entry-9999")?.id==="CXL-9999"&&documentById(corpus,"CXL-9999")===null,"invalid-but-well-formed links safely rejected by lookup");
check(citationOf(entries[4]).includes("CXL-0005"),"citation embeds stable ID");
check(sourceLink(prefaces[0]).endsWith("/data/b01.json"),"preface source page link");

const paths=["README.md","SKILL.md","AGENTS.md","CONTENT-ATTRIBUTION.md","LICENSE","index.html","styles.css","app.js","data/index.js","data/topics.js","data/annotations.js",".agents/skills/chuanxilu-wisdom/SKILL.md","references/decision-framework.md","references/quotation-guide.md","docs/ARCHITECTURE.md","docs/CONTENT-MODEL.md","docs/TEXTUAL-SOURCES.md","docs/ROADMAP.md","docs/READING-INTERACTION.md","docs/QA.md","prompts/codex-opencode.md",".github/workflows/ci.yml",".github/workflows/pages.yml","assets/favicon.svg"];
for(const path of paths)check(fs.existsSync(path),"required "+path);
const html=fs.readFileSync("index.html","utf8"),js=fs.readFileSync("app.js","utf8"),css=fs.readFileSync("styles.css","utf8");
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
check(ids.length===new Set(ids).size,"unique HTML IDs");
for(const id of ["topic-grid","search","kind-filter","bookmarks-only","clear-filters","volume-tabs","entry-list","sentences","document-meta","font-plus","font-minus","theme-toggle","bookmark","copy-link","prev","next"]){
 check(ids.includes(id),"HTML id "+id);
 check(js.includes('"'+id+'"'),"element is wired in JS "+id);
}
check(js.includes("gloss.hidden=true"),"gloss initial state hidden");
check(js.includes('toggle.setAttribute("aria-expanded"'),"semantic commentary accessibility state");
check(js.includes("history.pushState")&&js.includes("popstate"),"browser back navigation");
check(js.includes("readingHash(doc.id,i)"),"sentence deep link navigable");
check(js.includes("renderTopics()"),"topic section rendered");
check(!js.includes("innerHTML"),"no raw HTML injection");
check(html.includes('src="./app.js"'),"relative Pages application path");
check(html.includes('class="source-alert"'),"uncollated corpus must present explicit source warning");
check(fs.readFileSync("SKILL.md","utf8").includes("SOURCE-CRITICAL-AUDIT.md"),"Skill must require external source scrutiny");
check(css.includes(".modern-gloss[hidden]{display:none}"),"modern gloss CSS actually respects hidden");
check(css.includes(".topic-card")&&css.includes(".sentence-target"),"topic and sentence styles exist");
console.log("PASS "+passed+" assertions; "+entries.length+" original segments, "+prefaces.length+" appendices, "+
  TOPIC_GUIDE.length+" topical lenses, "+annotationCount()+" draft glosses.");
