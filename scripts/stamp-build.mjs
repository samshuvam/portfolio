import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const date=new Date(),parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
let commit=process.env.GITHUB_SHA;
if(!commit){try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{commit='local';}}
const months='JFMAMJJASOND';
const release={code:`PS${parts.day}${months[Number(parts.month)-1]}-${parts.year.slice(-2)}-${parts.hour}${parts.minute}${parts.second}NPT`,createdAt:date.toISOString(),npt:`${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} NPT`,commit,shortCommit:commit.slice(0,7)};
await mkdir('src/data',{recursive:true});
for(const path of ['src/data/release.generated.json','public/build-info.json'])await writeFile(path,JSON.stringify(release,null,2)+'\n');
console.log(`Build ${release.code} / ${release.shortCommit}`);
