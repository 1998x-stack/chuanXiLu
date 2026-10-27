#!/usr/bin/env python3
"""Independent, reproducible per-entry witness comparison. NOT final scholarly collation."""
import difflib
import html
import json
import re
import urllib.parse
import urllib.request
import csv
import io
from pathlib import Path
from opencc import OpenCC

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"audit"
OUT.mkdir(exist_ok=True)
simplify=OpenCC("t2s").convert
TITLES=["傳習錄/卷上","傳習錄/卷中","傳習錄/卷下"]
VOLUMES=[json.loads((ROOT/"data"/f"volume-{i}.json").read_text()) for i in (1,2,3)]
ENTS={e["number"]:e for v in VOLUMES for e in v["entries"]}

def download(title):
    # Resolve one revision first, then explicitly ask for that fixed revision's raw wikitext.
    rev_url="https://zh.wikisource.org/w/api.php?"+urllib.parse.urlencode({"action":"query","prop":"revisions","rvprop":"ids","format":"json","formatversion":"2","titles":title})
    headers={"User-Agent":"chuanxilu-critical-edition-comparison/0.1 (github.com/1998x-stack/chuanXiLu)","Accept":"application/json"}
    with urllib.request.urlopen(urllib.request.Request(rev_url,headers=headers),timeout=30) as f:
        page=json.load(f)["query"]["pages"][0]
    rev=page["revisions"][0]["revid"]
    url="https://zh.wikisource.org/w/api.php?"+urllib.parse.urlencode({"action":"parse","prop":"wikitext","format":"json","formatversion":"2","oldid":rev})
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=30) as f:
        j=json.load(f)
    if "error" in j: raise RuntimeError(str(j["error"]))
    return j["parse"]["wikitext"],rev

# Only the third-party editorial apparatus is stripped, never edited inside the old source.
def clean_wikitext(text):
    text=re.sub(r"<!--.*?-->","",text,flags=re.S)
    text=re.sub(r"<ref\b[^>]*?/>","",text,flags=re.S|re.I)
    text=re.sub(r"<ref\b[^>]*>.*?</ref>","",text,flags=re.S|re.I)
    text=re.sub(r"\[\[([^\]|]*?)\|([^\]]+)\]\]",lambda m:m.group(2),text)
    text=re.sub(r"\[\[([^\]]+)\]\]",lambda m:m.group(1),text)
    text=re.sub(r"<[^>]*>","",text)
    text=re.sub(r"\{\{[^{}]*\}\}","",text)
    return html.unescape(text)

def han_only(text):
    return "".join(c for c in simplify(clean_wikitext(text)) if "\u3400"<=c<="\u9fff")

WITNESS={}
revisions={}
for title in TITLES:
    raw,rev=download(title)
    revisions[title]=rev
    splits=re.split(r"(?m)^={3,5}\s*(\d{1,3})\s*={3,5}\s*$",raw)
    if len(splits)<3: raise RuntimeError(f"No numeric headings: {title}")
    for i in range(1,len(splits),2):
        n=int(splits[i])
        piece=splits[i+1]
        piece=re.split(r"(?m)^==\s*[^=\n]+\s*==\s*$",piece,maxsplit=1)[0]
        if n in WITNESS:raise RuntimeError(f"Duplicate section {n}")
        WITNESS[n]=piece
assert len(WITNESS)==342,(len(WITNESS),min(WITNESS),max(WITNESS))
assert list(sorted(WITNESS))==list(range(1,343))

rows=[]
for n in range(1,343):
    source_ids=[n] if n<317 else [317,318] if n==317 else [n+1]
    old="".join(ENTS[x]["text"] for x in source_ids)
    raw=WITNESS[n]
    a=han_only(old)
    b=han_only(raw)
    matcher=difflib.SequenceMatcher(None,a,b,autojunk=False)
    operations=[(tag,i1,i2,j1,j2) for tag,i1,i2,j1,j2 in matcher.get_opcodes() if tag!="equal"]
    edits=sum(max(i2-i1,j2-j1) for _,i1,i2,j1,j2 in operations)
    samples=[]
    for tag,i1,i2,j1,j2 in operations[:3]:
        samples.append({"operation":tag,"old":a[i1:i2][:28],"witness":b[j1:j2][:28]})
    rows.append({"witness_no":n,"source_ids":"+".join(str(x) for x in source_ids),"source_chars":len(a),"witness_chars":len(b),
      "similarity":round(matcher.ratio(),5),"different_spans":len(operations),"edit_units":edits,"samples":samples})

worst=sorted(rows,key=lambda r:r["similarity"])[:30]
report={"method":"Wikisource independent electronic witness, OpenCC t2s, strip editorial markup, compare Han characters only; NOT Ming edition proof",
  "revisions":revisions,"reference_count":len(WITNESS),
  "source_fragment_count":343,
  "exact_han_matches":sum(r["different_spans"]==0 for r in rows),
  "high_similarity_98":sum(r["similarity"]>=0.98 for r in rows),
  "low_similarity_below_90":sum(r["similarity"]<0.9 for r in rows),
  "mean_ratio":round(sum(r["similarity"] for r in rows)/342,5),
  "total_difference_spans":sum(r["different_spans"] for r in rows),
  "warnings":["This is transcription-to-transcription comparison, not collation of ancient printed witnesses",
  "Traditional/simplified and editorial markup are normalized heuristically; automatic differences require human review",
  "Fragment 317+318 concatenation is provisional; quote context and speaker attribution may still disagree"],
  "worst_30":worst}
(OUT/"witness-text-differences.json").write_text(json.dumps({"summary":report,"items":rows},ensure_ascii=False,indent=2)+"\n")
with (OUT/"witness-text-differences.csv").open("w",newline="") as f:
    writer=csv.DictWriter(f,fieldnames=["witness_no","source_ids","source_chars","witness_chars","similarity","different_spans","edit_units"])
    writer.writeheader()
    writer.writerows([{k:v for k,v in row.items() if k in writer.fieldnames} for row in rows])
lines=["# 《传习录》电子见证本逐条差异检查","","**重要：仅是两个电子转录本比较，尚不能确认哪个文字是明代刊本原字。**","",
 f"参考编号：342条；旧转录片段：343个。完全一致：{report['exact_han_matches']}条；相似度≥98%：{report['high_similarity_98']}条；相似度<90%：{report['low_similarity_below_90']}条；差异块合计：{report['total_difference_spans']}。","",
 "此报告将繁体转简体、删去脚注与大部分标记、忽略标点后计算汉字差异；未做古籍影印逐字审查。","",
 "| 参考号 | 旧片段 | 相似度 | 差异块 | 示例（最多3段） |","| ---: | --- | ---: | ---: | --- |"]
for r in worst:
    sample="；".join(s["old"][:14]+" → "+s["witness"][:14] for s in r["samples"])
    lines.append(f"| {r['witness_no']} | {r['source_ids']} | {r['similarity']:.2%} | {r['different_spans']} | {sample} |")
(OUT/"witness-text-differences.md").write_text("\n".join(lines)+"\n")
print("INDEPENDENT ELECTRONIC WITNESS COMPARISON")
print(json.dumps({k:v for k,v in report.items() if k!="worst_30"},ensure_ascii=False,indent=2))
for r in worst[:12]: print("WARNING",json.dumps(r,ensure_ascii=False))

# The simple ordinal comparison above intentionally does NOT fix differing editorial
# item order/splitting. Suggest approximate local matches separately; never auto-correct.
from rapidfuzz import fuzz
cand_text={n:han_only(raw) for n,raw in WITNESS.items()}
suggestions=[]
for source_no,source_entry in ENTS.items():
    source_text=han_only(source_entry["text"])
    proposed=source_no if source_no<=317 else source_no-1
    candidate_numbers=range(max(1,proposed-25),min(342,proposed+25)+1)
    results=sorted(((n,fuzz.ratio(source_text,cand_text[n])/100) for n in candidate_numbers),
                   key=lambda x:x[1],reverse=True)
    best_n,best_ratio=results[0]
    expected_ratio=fuzz.ratio(source_text,cand_text.get(proposed,""))/100
    # Partial similarity is a diagnostic of one-to-many splits; not a verified alignment.
    partial=fuzz.partial_ratio(source_text,cand_text[best_n])/100 if best_ratio<0.9 else 1.0
    suggestions.append({"source_no":source_no,"nominal_ref":proposed,"best_ref":best_n,
      "direct_ratio":round(expected_ratio,5),"best_ratio":round(best_ratio,5),
      "partial_ratio":round(partial,5),"delta":round(best_ratio-expected_ratio,5),
      "needs_review":bool(best_n!=proposed or best_ratio<0.98)})
moved=[x for x in suggestions if x["best_ref"]!=x["nominal_ref"] and x["delta"]>=0.12]
low=[x for x in suggestions if x["best_ratio"]<0.80]
align={
 "method":"rapidfuzz ratio among reference +/-25; HYPOTHESES ONLY, no automatic renumbering",
 "source_segments":343,
 "different_best_reference_count":sum(x["best_ref"]!=x["nominal_ref"] for x in suggestions),
 "strong_remapping_candidates":len(moved),
 "weak_best_matches_below_80_percent":len(low),
 "examples":moved[:70],
 "weak_samples":low[:40]
}
(OUT/"alignment-suggestions.json").write_text(json.dumps({"summary":align,"items":suggestions},ensure_ascii=False,indent=2)+"\\n")
print("ALIGNMENT DIAGNOSTICS",json.dumps({k:v for k,v in align.items() if k not in ("examples","weak_samples")},ensure_ascii=False))
for item in moved[:30]:print("REORDER_CANDIDATE",json.dumps(item,ensure_ascii=False))
for item in low[:12]:print("LOW_CONFIDENCE",json.dumps(item,ensure_ascii=False))
