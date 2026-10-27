import fs from "node:fs";
import {ANNOTATIONS,annotationCount} from "../data/annotations.js";
import {TOPIC_GUIDE,topicHits} from "../data/topics.js";
import {splitSentences} from "../data/index.js";
const volumes=[1,2,3].map(i=>JSON.parse(fs.readFileSync("data/volume-"+i+".json","utf8")));
const entries=volumes.flatMap(v=>v.entries);
const stats=volumes.map(v=>({
 volume:v.volume,originalEntries:v.entries.length,paratexts:v.prefaces.length,
 punctuationSegments:v.entries.reduce((n,e)=>n+splitSentences(e.text).length,0),
 entriesWithDraftGlosses:v.entries.filter(e=>ANNOTATIONS[e.id]?.length).length,
 draftGlosses:v.entries.reduce((n,e)=>n+(ANNOTATIONS[e.id]?.length??0),0),
 independentlyVerifiedEntries:v.entries.filter(e=>e.verification==="verified").length
}));
const report={
 schema:"chuanxilu-coverage-v1",sourceCommit:volumes[0].source.commit,
 originalEntries:entries.length,paratexts:volumes.reduce((n,v)=>n+v.prefaces.length,0),
 punctuationSegments:stats.reduce((n,v)=>n+v.punctuationSegments,0),
 draftGlosses:annotationCount(),entriesWithDraftGlosses:Object.keys(ANNOTATIONS).length,
 independentlyVerifiedOriginalEntries:entries.filter(e=>e.verification==="verified").length,
 volumes:stats,
 topicalKeywordHits:TOPIC_GUIDE.map(t=>({topic:t.label,entryMatches:topicHits(entries,t).length})),
 caveats:["标点句段数不代表原版句数","草稿选句释读不代表完整译注","关键词命中不等于学术观点归属","待校勘原文不可被宣称已核定"]
};
console.log(JSON.stringify(report,null,2));
