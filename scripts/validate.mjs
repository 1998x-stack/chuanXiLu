import fs from "node:fs";
import assert from "node:assert/strict";
import { splitSentences, searchEntries, entryByNumber, sourceLink } from "../data/index.js";
import { ANNOTATIONS, TOPICS } from "../data/annotations.js";
let passed=0;
function check(condition, label) { assert.ok(condition, label); passed++; }
const volumes=[1,2,3].map(i=>JSON.parse(fs.readFileSync("data/volume-"+i+".json","utf8")));
const entries=volumes.flatMap(v=>v.entries);
check(JSON.stringify(volumes.map(v=>v.volume))===JSON.stringify(["上","中","下"]),"canonical volume order");
check(JSON.stringify(volumes.map(v=>v.entries.length))===JSON.stringify([129,71,143]),"transcription counts");
check(entries.length===343,"343 original text entries");
check(volumes.every(v=>v.schemaVersion===1),"data schema");
check(volumes.every(v=>v.source.commit==="1910cd136f3dd30b41514e61e1a1ebac6adf5771"),"source is pinned");
check(volumes.every(v=>v.source.modernTranslationImported===false),"no third-party translation");
check(volumes.every(v=>v.prefaces.length>0),"paratext in every volume");
check(new Set(entries.map(e=>e.id)).size===343,"unique IDs");
check(new Set(TOPICS).size===TOPICS.length,"unique topics");
for(const [i,e] of entries.entries()){
 check(e.number===i+1,"sequence "+i);
 check(e.id==="CXL-"+String(i+1).padStart(4,"0"),"ID "+e.id);
 check(e.volume===(i<129?"上":i<200?"中":"下"),"volume "+e.id);
 check(e.text.trim().length>=10,"nonempty text "+e.id);
 check(Boolean(e.section)&&e.section!=="待考","section "+e.id);
 check(/^data\/b\d{2}\.json$/.test(e.sourceFile),"source "+e.id);
 check(e.verification==="pending","verification flag "+e.id);
 const segments=splitSentences(e.text);
 check(segments.length>0&&segments.join("")===e.text,"lossless segmentation "+e.id);
 check(entryByNumber({entries},e.number)===e,"lookup "+e.id);
 check(sourceLink(e).includes("1910cd136f3dd30b41514e61e1a1ebac6adf5771"),"stable source URL "+e.id);
}
for(const [id,items] of Object.entries(ANNOTATIONS)){
 const entry=entries.find(e=>e.id===id);
 check(Boolean(entry),"annotation entry "+id);
 for(const item of items){
  check(entry.text.includes(item.quote),"quote is literal "+id);
  check(splitSentences(entry.text).some(s=>s.includes(item.quote)),"quote fits one sentence "+id);
  check(item.gloss.length>12&&item.topic,"gloss content "+id);
 }
}
check(searchEntries(entries,"知而不行").some(e=>e.number===5),"search");
check(searchEntries(entries,"","上").length===129,"volume one filter");
check(searchEntries(entries,"","中").length===71,"volume two filter");
check(searchEntries(entries,"","下").length===143,"volume three filter");
for(const p of ["README.md","SKILL.md","AGENTS.md","CONTENT-ATTRIBUTION.md","LICENSE","index.html","styles.css","app.js",".agents/skills/chuanxilu-wisdom/SKILL.md","references/decision-framework.md","references/quotation-guide.md","docs/ARCHITECTURE.md","docs/CONTENT-MODEL.md","docs/TEXTUAL-SOURCES.md","docs/ROADMAP.md","prompts/codex-opencode.md",".github/workflows/ci.yml",".github/workflows/pages.yml","assets/favicon.svg"]){
 check(fs.existsSync(p),"required "+p);
}
const html=fs.readFileSync("index.html","utf8"),js=fs.readFileSync("app.js","utf8");
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
check(ids.length===new Set(ids).size,"unique HTML IDs");
for(const id of ["search","volume-tabs","entry-list","sentences","font-plus","font-minus","theme-toggle","bookmark","copy-link","prev","next"]){
 check(ids.includes(id),"HTML id "+id);
 check(js.includes('"'+id+'"'),"JS id "+id);
}
check(js.includes("gloss.hidden = true"),"gloss hidden by default");
check(js.includes('setAttribute("aria-expanded"'),"gloss ARIA state");
check(!js.includes("innerHTML"),"no HTML injection");
check(html.includes('src="./app.js"'),"relative GitHub Pages paths");
console.log("PASS "+passed+" assertions · 343 entries / 3 volumes / "+Object.values(ANNOTATIONS).flat().length+" quote mappings");
