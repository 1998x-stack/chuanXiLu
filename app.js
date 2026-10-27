import { loadCorpus, splitSentences, searchEntries, entryByNumber, sourceLink } from "./data/index.js";
import { ANNOTATIONS } from "./data/annotations.js";
const byId = id => document.getElementById(id);
const state = { corpus: null, number: 5, volume: "全部", query: "", bookmarks: new Set(), font: 19, theme: "light" };
function readStorage(key, fallback) { try { return localStorage.getItem("cxl:" + key) ?? fallback; } catch { return fallback; } }
function saveStorage(key, value) { try { localStorage.setItem("cxl:" + key, value); } catch { /* private browsing */ } }
function setStatus(value) { byId("entry-status").textContent = value; }
function button(title, cls, handler) { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = title; b.addEventListener("click", handler); return b; }
function pickNumber() { const match = location.hash.match(/^#entry-(\d{4})$/); return match ? Number(match[1]) : Number(readStorage("last", "5")); }
function renderList() {
  const results = searchEntries(state.corpus.entries, state.query, state.volume);
  const list = byId("entry-list"); list.replaceChildren();
  byId("match-count").textContent = "共 " + results.length + " 条";
  let prior = "";
  for (const entry of results) {
    const group = "卷" + entry.volume + " · " + entry.section;
    if (group !== prior) { const div = document.createElement("div"); div.className = "nav-group"; div.textContent = group; list.append(div); prior = group; }
    const item = button(String(entry.number).padStart(3,"0") + "  " + entry.text.slice(0, 20).replace(/\s/g,"") + (entry.text.length > 20 ? "……" : ""), "entry-nav", () => selectEntry(entry.number));
    item.setAttribute("aria-current", String(entry.number === state.number));
    list.append(item);
  }
  if (!results.length) { const p = document.createElement("p"); p.className = "muted"; p.textContent = "未找到匹配条目，请缩短关键词。"; list.append(p); }
}
function renderReader() {
  const entry = entryByNumber(state.corpus, state.number);
  if (!entry) return;
  byId("reading-position").textContent = "卷" + entry.volume + " · " + entry.section + " · " + entry.id;
  byId("entry-title").textContent = "第 " + entry.number + " 条 · " + entry.section;
  const annotations = ANNOTATIONS[entry.id] ?? [];
  const pieces = splitSentences(entry.text);
  byId("entry-summary").textContent = "共 " + pieces.length + " 个标点句段 · " + annotations.length + " 则示范译注 · 逐句核对原文上下文";
  const panel = byId("sentences"); panel.replaceChildren();
  for (let i = 0; i < pieces.length; i++) {
    const row = document.createElement("div"); row.className = "sentence";
    const p = document.createElement("p"); p.className = "classical-text"; p.textContent = pieces[i]; row.append(p);
    const matched = annotations.filter(item => pieces[i].includes(item.quote));
    for (const [j, item] of matched.entries()) {
      const glossId = "gloss-" + entry.number + "-" + i + "-" + j;
      const gloss = document.createElement("div"); gloss.id = glossId; gloss.className = "modern-gloss"; gloss.hidden = true;
      const label = document.createElement("span"); label.className = "gloss-label"; label.textContent = "现代释读 · " + item.topic + "（编辑性导读）";
      const explain = document.createElement("div"); explain.textContent = item.gloss;
      gloss.append(label, explain);
      const toggle = button("展开本句释义", "annotation-control", () => {
        gloss.hidden = !gloss.hidden;
        toggle.textContent = gloss.hidden ? "展开本句释义" : "收起本句释义";
        toggle.setAttribute("aria-expanded", String(!gloss.hidden));
      });
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", glossId);
      row.append(toggle, gloss);
    }
    panel.append(row);
  }
  byId("bookmark").textContent = state.bookmarks.has(entry.number) ? "★ 已收藏" : "☆ 收藏";
  byId("prev").disabled = entry.number <= 1;
  byId("next").disabled = entry.number >= state.corpus.entries.length;
  byId("source-link").href = sourceLink(entry);
  document.title = "第 " + entry.number + " 条 · " + entry.section + " | 传习录";
  setStatus("当前第 " + entry.number + " / " + state.corpus.entries.length + " 条");
  saveStorage("last", String(entry.number));
}
function selectEntry(number) {
  if (!entryByNumber(state.corpus, number)) return;
  state.number = number; history.replaceState(null, "", "#entry-" + String(number).padStart(4, "0"));
  renderReader(); renderList();
}
function toggleBookmark() {
  if (state.bookmarks.has(state.number)) state.bookmarks.delete(state.number); else state.bookmarks.add(state.number);
  saveStorage("bookmarks", JSON.stringify([...state.bookmarks])); renderReader();
}
function applySettings() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.setProperty("--reading-size", state.font + "px");
  saveStorage("theme", state.theme); saveStorage("font", String(state.font));
}
function setupEvents() {
  byId("search").addEventListener("input", e => { state.query = e.target.value; renderList(); });
  byId("volume-tabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-volume]"); if (!b) return;
    state.volume = b.dataset.volume;
    for (const button of byId("volume-tabs").querySelectorAll("button")) {
      button.classList.toggle("active", button === b);
      button.setAttribute("aria-pressed", String(button === b));
    }
    renderList();
  });
  byId("prev").addEventListener("click", () => selectEntry(state.number-1));
  byId("next").addEventListener("click", () => selectEntry(state.number+1));
  byId("bookmark").addEventListener("click", toggleBookmark);
  byId("open-last").addEventListener("click", () => selectEntry(Number(readStorage("last", "5"))));
  byId("font-minus").addEventListener("click", () => { state.font = Math.max(15, state.font-1); applySettings(); });
  byId("font-plus").addEventListener("click", () => { state.font = Math.min(27, state.font+1); applySettings(); });
  byId("theme-toggle").addEventListener("click", () => { state.theme = state.theme === "light" ? "dark" : "light"; applySettings(); });
  byId("copy-link").addEventListener("click", async () => {
    const e=entryByNumber(state.corpus,state.number);
    const citation = "《传习录·卷" + e.volume + "·" + e.section + "》（本项目电子条目 " + e.id + "，编号并非古籍原有）：" + location.href;
    try { await navigator.clipboard.writeText(citation); setStatus("引用及链接已复制"); }
    catch { setStatus("浏览器无法复制，请复制地址栏链接"); }
  });
  window.addEventListener("hashchange", () => { const next=pickNumber(); if(next !== state.number) selectEntry(next); });
}
async function main() {
  try {
    state.bookmarks=new Set(JSON.parse(readStorage("bookmarks", "[]")));
    state.font=Math.max(15, Math.min(27, Number(readStorage("font", "19")) || 19));
    state.theme=readStorage("theme", "light") === "dark" ? "dark" : "light";
    applySettings();
    state.corpus=await loadCorpus();
    setupEvents();
    selectEntry(entryByNumber(state.corpus,pickNumber()) ? pickNumber() : 5);
  } catch (error) {
    byId("entry-title").textContent = "加载失败";
    byId("sentences").textContent = "无法读取数据文件。请通过本地 HTTP 服务打开，或检查网络连接。";
    setStatus(error instanceof Error ? error.message : "未知错误");
  }
}
if (typeof document !== "undefined") main();
