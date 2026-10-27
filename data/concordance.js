// Versioned source-fragment -> Wikisource modern section-number crosswalk.
// NOT historical text verification. The 343 source fragments must be preserved.
export const SOURCE_FRAGMENT_COUNTS=Object.freeze([129,71,143]);
export const WITNESS_ENTRY_COUNTS=Object.freeze([129,71,142]);
export function crosswalkNumber(n){
 if(!Number.isSafeInteger(n)||n<1||n>343)throw new RangeError("Invalid source fragment");
 if(n===85)return 86;
 if(n===86)return 85;
 return n<=317?n:n===318?317:n-1;
}
export function witnessLabel(entry){
 const n=crosswalkNumber(entry.number);
 return entry.number>=175&&entry.number<=200
 ? "维基文库对照编号待核（本段有拆合或错序）"
 : "暂拟维基文库对照号 "+n+(entry.number===317?"（源上半段）":entry.number===318?"（源下半段）":"");
}
export function groupedWitnessEntries(entries){
 const m=new Map();
 for(const e of entries){const n=crosswalkNumber(e.number);const old=m.get(n)??[];old.push(e);m.set(n,old)}
 return m;
}
