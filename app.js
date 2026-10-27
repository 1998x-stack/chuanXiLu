import { loadCorpus, splitSentences, filterDocuments, documentById, documentKind, citationOf, readingHash, parseReadingHash, sourceLink } from "./data/index.js";
import { ANNOTATIONS, annotationCount } from "./data/annotations.js";
import { TOPIC_GUIDE, topicById, topicHits } from "./data/topics.js";

const el = id => document.getElementById(id);
const state = {
  corpus: null, id: "CXL-0005", sentenceIndex: null, query: "", volume: "全部",
  kind: "全部", topic: null, bookmarksOnly: false, bookmarks: new Set(), font: 19, theme: "light"
};

function readStorage(key,fallback) { try {return localStorage.getItem("cxl:"+key)??fallback;}catch{return fallback;} }
function saveStorage(key,value) { try {localStorage.setItem("cxl:"+key,value);}catch{ /* storage denied */ } }
function setStatus(message){el("entry-status").textContent=message;}
function makeButton(title,cls,handler) {
  const control=document.createElement("button");
  control.type="button";control.className=cls;control.textContent=title;
  control.addEventListener("click",handler);return control;
}
function writeText(target,value){target.textContent=value;}
function validDocument(id){return documentById(state.corpus,id);}
function storedBookmarks(){
  let values;
  try {values=JSON.parse(readStorage("bookmarks","[]"));}catch{return new Set();}
  if(!Array.isArray(values))return new Set();
  return new Set(values.map(value=>typeof value==="number"?"CXL-"+String(value).padStart(4,"0"):value)
    .filter(value=>typeof value==="string"&&/^(CXL-\d{4}|CXL-[上中下]-P\d+)$/.test(value)));
}
function currentDocument(){return validDocument(state.id);}
function visibleDocuments(){
  return filterDocuments(state.corpus,{
    query:state.query,volume:state.volume,kind:state.kind,bookmarksOnly:state.bookmarksOnly,
    bookmarks:state.bookmarks,topic:topicById(state.topic)
  });
}
function renderTopics(){
  const board=el("topic-grid");board.replaceChildren();
  for(const topic of TOPIC_GUIDE){
    const count=topicHits(state.corpus.entries,topic).length;
    const card=document.createElement("article");card.className="topic-card";
    if(state.topic===topic.id)card.classList.add("selected");
    const heading=makeButton(topic.label+" · "+count+" 条","topic-filter",()=>{
      state.topic=state.topic===topic.id?null:topic.id;renderTopics();renderList();
      el("entry-list").scrollTop=0;
    });
    heading.setAttribute("aria-pressed",String(state.topic===topic.id));
    const text=document.createElement("p");text.className="topic-description";text.textContent=topic.summary;
    const caution=document.createElement("p");caution.className="topic-limit";caution.textContent="今用须辨："+topic.limit;
    const evidence=document.createElement("div");evidence.className="topic-evidence";
    for(const citation of topic.evidence){
      const b=makeButton(citation.id+" · "+citation.quote,"topic-source",()=>openDocument(citation.id));
      b.title="定位真实原文";evidence.append(b);
    }
    card.append(heading,text,caution,evidence);board.append(card);
  }
}
function renderList(){
  const results=visibleDocuments(),list=el("entry-list");
  list.replaceChildren();
  el("match-count").textContent="匹配 "+results.length+" 份 / 全部 "+state.corpus.documents.length+" 份";
  let prior="";
  for(const doc of results){
    const group="卷"+doc.volume+" · "+(documentKind(doc)==="序跋附录"?"序跋附录":doc.section);
    if(group!==prior){
      const title=document.createElement("h3");
      title.className="nav-group";title.textContent=group;list.append(title);prior=group;
    }
    const label=doc.kind==="paratext" ? "〔附〕"+doc.title :
      String(doc.number).padStart(3,"0")+"  "+doc.text.replace(/\s+/g,"").slice(0,18)+"…";
    const item=makeButton(label,"entry-nav",()=>openDocument(doc.id));
    item.setAttribute("aria-current",String(doc.id===state.id));
    if(state.bookmarks.has(doc.id))item.textContent+=" ★";
    list.append(item);
  }
  if(!results.length){
    const p=document.createElement("p");p.className="muted";
    p.textContent="未找到符合条件的文本；试试清空筛选或缩短关键词。";list.append(p);
  }
}
function renderReader(){
  const doc=currentDocument();if(!doc)return;
  const preface=doc.kind==="paratext",segments=splitSentences(doc.text),notes=ANNOTATIONS[doc.id]??[];
  el("reading-position").textContent="卷"+doc.volume+" · "+doc.section+" · "+doc.id;
  el("entry-title").textContent=preface?doc.title:"第 "+doc.number+" 条 · "+doc.section;
  el("document-meta").textContent=(preface?"附属文献":"正篇 · "+documentKind(doc))+"  /  原文版本：电子转录，待独立校勘";
  el("entry-summary").textContent="共 "+segments.length+" 个标点句段 · "+notes.length+
    " 则草稿释读 · 当前全站共 "+annotationCount()+" 则选句释读；未经完整译校";
  const panel=el("sentences");panel.replaceChildren();
  for(let i=0;i<segments.length;i++){
    const row=document.createElement("section");
    row.className="sentence";row.id="sentence-"+String(i+1).padStart(3,"0");
    if(i===state.sentenceIndex)row.classList.add("sentence-target");
    const header=document.createElement("div");header.className="sentence-toolbar";
    const marker=document.createElement("span");marker.className="sentence-index";
    marker.textContent=String(i+1).padStart(3,"0");
    const anchor=makeButton("定位本句","sentence-anchor",()=>{
      state.sentenceIndex=i;
      history.replaceState(null,"",readingHash(doc.id,i));
      for(const other of panel.querySelectorAll(".sentence-target"))other.classList.remove("sentence-target");
      row.classList.add("sentence-target");
      row.scrollIntoView({block:"nearest",behavior:"auto"});
      setStatus("已定位第 "+(i+1)+" 句，可复制地址栏链接");
    });
    anchor.setAttribute("aria-label","定位第 "+(i+1)+" 句并更新分享链接");
    header.append(marker,anchor);
    const p=document.createElement("p");p.className="classical-text";p.textContent=segments[i];
    row.append(header,p);
    const matched=notes.filter(note=>segments[i].includes(note.quote));
    for(const [j,note] of matched.entries()){
      const glossId="gloss-"+i+"-"+j;
      const gloss=document.createElement("div");
      gloss.id=glossId;gloss.className="modern-gloss";gloss.hidden=true;
      const label=document.createElement("span");label.className="gloss-label";
      label.textContent="现代释读（"+note.status+"） · "+note.topic+" · "+note.author;
      const interpretation=document.createElement("p");interpretation.textContent=note.gloss;
      gloss.append(label,interpretation);
      const toggle=makeButton("展开本句释义","annotation-control",()=>{
        gloss.hidden=!gloss.hidden;
        toggle.textContent=gloss.hidden?"展开本句释义":"收起本句释义";
        toggle.setAttribute("aria-expanded",String(!gloss.hidden));
      });
      toggle.setAttribute("aria-controls",glossId);
      toggle.setAttribute("aria-expanded","false");
      row.append(toggle,gloss);
    }
    panel.append(row);
  }
  el("bookmark").textContent=state.bookmarks.has(doc.id)?"★ 已收藏":"☆ 收藏";
  const position=state.corpus.documents.findIndex(item=>item.id===doc.id);
  el("prev").disabled=position<=0;
  el("next").disabled=position<0||position>=state.corpus.documents.length-1;
  el("source-link").href=sourceLink(doc);
  document.title=(preface?doc.title:"第"+doc.number+"条 · "+doc.section)+" | 传习录";
  setStatus("第 "+(position+1)+" / "+state.corpus.documents.length+" 份文献");
  saveStorage("last",doc.id);
  if(state.sentenceIndex!==null){
    const index=state.sentenceIndex;
    if(Number.isSafeInteger(index)&&index>=0&&index<segments.length)
      requestAnimationFrame(()=>panel.children[index]?.scrollIntoView({block:"start",behavior:"auto"}));
    else state.sentenceIndex=null;
  }
}
function openDocument(id,sentenceIndex=null,{writeHistory=true}={}){
  if(!validDocument(id))return;
  state.id=id;state.sentenceIndex=sentenceIndex;
  if(writeHistory)history.pushState(null,"",readingHash(id,sentenceIndex));
  renderReader();renderList();
}
function navigateBy(delta){
  const index=state.corpus.documents.findIndex(item=>item.id===state.id);
  const next=state.corpus.documents[index+delta];
  if(next)openDocument(next.id);
}
function toggleBookmark(){
  if(state.bookmarks.has(state.id))state.bookmarks.delete(state.id);
  else state.bookmarks.add(state.id);
  saveStorage("bookmarks",JSON.stringify([...state.bookmarks]));
  renderReader();renderList();
}
function applySettings(){
  document.documentElement.dataset.theme=state.theme;
  document.documentElement.style.setProperty("--reading-size",state.font+"px");
  saveStorage("theme",state.theme);saveStorage("font",String(state.font));
}
function refreshVolumeControls(){
  for(const button of el("volume-tabs").querySelectorAll("button")){
    const active=button.dataset.volume===state.volume;
    button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
  }
}
function resetFilters(){
  state.query="";state.volume="全部";state.kind="全部";state.topic=null;state.bookmarksOnly=false;
  el("search").value="";el("kind-filter").value="全部";el("bookmarks-only").checked=false;
  refreshVolumeControls();renderTopics();renderList();
}
function showFromUrl(){
  const parsed=parseReadingHash(location.hash);
  if(parsed&&validDocument(parsed.id))openDocument(parsed.id,parsed.sentenceIndex,{writeHistory:false});
}
function installEvents(){
  el("search").addEventListener("input",event=>{state.query=event.target.value;renderList();});
  el("volume-tabs").addEventListener("click",event=>{
    const target=event.target.closest("button[data-volume]");if(!target)return;
    state.volume=target.dataset.volume;refreshVolumeControls();renderList();
  });
  el("kind-filter").addEventListener("change",event=>{state.kind=event.target.value;renderList();});
  el("bookmarks-only").addEventListener("change",event=>{state.bookmarksOnly=event.target.checked;renderList();});
  el("clear-filters").addEventListener("click",resetFilters);
  el("prev").addEventListener("click",()=>navigateBy(-1));
  el("next").addEventListener("click",()=>navigateBy(+1));
  el("bookmark").addEventListener("click",toggleBookmark);
  el("open-last").addEventListener("click",()=>{
    const last=readStorage("last","CXL-0005");
    openDocument(/^\d+$/.test(last)?"CXL-"+last.padStart(4,"0"):last);
  });
  el("font-minus").addEventListener("click",()=>{state.font=Math.max(15,state.font-1);applySettings();});
  el("font-plus").addEventListener("click",()=>{state.font=Math.min(27,state.font+1);applySettings();});
  el("theme-toggle").addEventListener("click",()=>{state.theme=state.theme==="light"?"dark":"light";applySettings();});
  el("copy-link").addEventListener("click",async()=>{
    const doc=currentDocument();
    const full=citationOf(doc)+(state.sentenceIndex===null?"":"·句"+(state.sentenceIndex+1));
    const url=new URL(readingHash(doc.id,state.sentenceIndex),location.href).href;
    const quote=state.sentenceIndex===null?"":splitSentences(doc.text)[state.sentenceIndex]??"";
    try {await navigator.clipboard.writeText(full+"\n"+quote+"\n"+url);setStatus("已复制完整出处与链接");}
    catch {setStatus("无法自动复制，请从地址栏复制链接");}
  });
  window.addEventListener("popstate",showFromUrl);
  window.addEventListener("hashchange",showFromUrl);
  document.addEventListener("keydown",event=>{
    if(event.key==="/"&&!event.ctrlKey&&!event.metaKey&&
      !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){
      event.preventDefault();el("search").focus();
    }
  });
}
async function main(){
  try{
    state.bookmarks=storedBookmarks();
    const font=Number(readStorage("font","19"));state.font=Number.isFinite(font)?Math.max(15,Math.min(27,font)):19;
    state.theme=readStorage("theme","light")==="dark"?"dark":"light";
    applySettings();
    state.corpus=await loadCorpus();
    installEvents();renderTopics();
    const prior=readStorage("last","CXL-0005");
    const fromUrl=parseReadingHash(location.hash);
    const defaultId=validDocument(prior)?prior:/^\d+$/.test(prior)&&validDocument("CXL-"+prior.padStart(4,"0"))?"CXL-"+prior.padStart(4,"0"):"CXL-0005";
    const initial=fromUrl&&validDocument(fromUrl.id)?fromUrl:{id:defaultId,sentenceIndex:null};
    openDocument(initial.id,initial.sentenceIndex,{writeHistory:false});
    if(!fromUrl)history.replaceState(null,"",readingHash(initial.id));
  }catch(error){
    el("entry-title").textContent="原文加载失败";
    el("sentences").textContent="请确认网站由 HTTP 提供服务，三个卷本 JSON 均可访问。";
    setStatus(error instanceof Error?error.message:"未知错误");
  }
}
if(typeof document!=="undefined")main();
