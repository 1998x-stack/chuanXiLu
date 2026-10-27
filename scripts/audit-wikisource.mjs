import fs from "node:fs";
const titles=["傳習錄/卷上","傳習錄/卷中","傳習錄/卷下"];
const expected=[[1,129],[130,200],[201,342]];
const outputs=[];
for(let i=0;i<3;i++){
 const api="https://zh.wikisource.org/w/api.php?action=parse&prop=wikitext&format=json&formatversion=2&page="+encodeURIComponent(titles[i]);
 const response=await fetch(api,{headers:{"user-agent":"chuanxilu-text-audit/0.1 (https://github.com/1998x-stack/chuanXiLu; educational textual comparison)","accept":"application/json"},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error(titles[i]+" remote witness HTTP "+response.status);
 const data=await response.json();
 if(data.error)throw Error(JSON.stringify(data.error));
 const wikitext=data?.parse?.wikitext;
 if(typeof wikitext!=="string"||wikitext.length<500)throw Error("Missing raw source wikitext: "+titles[i]);
 const headingLines=wikitext.split("\n").filter(l=>/^={2,5}\s*\d{1,3}\s*={2,5}\s*$/.test(l.trim()));
 const numbers=headingLines.map(l=>Number(l.match(/\d+/)[0]));
 console.log(titles[i]+": rawChars="+wikitext.length+", numericHeadings="+numbers.length+"; first="+numbers.slice(0,5)+", last="+numbers.slice(-5));
 console.log("Wikitext head preview: "+wikitext.slice(0,280).replace(/\s+/g," "));
 if(numbers.length===0)throw Error("No numeric headings; human audit of witness source markup required");
 outputs.push({title:titles[i],pageId:data.parse.pageid,revisionId:data.parse.revid,characters:wikitext.length,firstNumber:numbers[0],lastNumber:numbers.at(-1),numberedEntries:numbers.length,hasUnbroken317:i===2?wikitext.includes("先儒解"):undefined});
 if(numbers[0]!==expected[i][0]||numbers.at(-1)!==expected[i][1])throw Error("Witness numbering not expected: "+titles[i]);
}
fs.mkdirSync("audit",{recursive:true});
fs.writeFileSync("audit/wikisource-observations.json",JSON.stringify({generatedAt:new Date().toISOString(),source:"https://zh.wikisource.org/wiki/傳習錄",method:"MediaWiki parse/wikitext; heading counts, NOT textual collation",volumes:outputs},null,2)+"\n");
console.log("EXTERNAL WITNESS CHECK SUCCESS: metadata established independently; textual characters NOT verified.");
