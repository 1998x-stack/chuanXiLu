import fs from "node:fs";
import { execFileSync } from "node:child_process";
execFileSync(process.execPath,["scripts/validate.mjs"],{stdio:"inherit"});
fs.rmSync("dist",{recursive:true,force:true});
fs.mkdirSync("dist",{recursive:true});
for(const item of ["index.html","app.js","styles.css","data","assets",".nojekyll"]){
 fs.cpSync(item,"dist/"+item,{recursive:true});
}
console.log("Built dist/ for GitHub Pages");
