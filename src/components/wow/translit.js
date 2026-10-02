// Character mappings follow https://www.unicode.org/charts/PDF/U11480.pdf.
// Roman spelling is only a phonetic first pass; the editable Devanagari
// field is authoritative for a name's actual spelling.
const consonants='कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह';
const vowels='अआइईउऊऋॠऌॡएऐओऔ';
const marks={'ा':0x114b0,'ि':0x114b1,'ी':0x114b2,'ु':0x114b3,'ू':0x114b4,'ृ':0x114b5,'ॄ':0x114b6,'ॢ':0x114b7,'ॣ':0x114b8,'े':0x114b9,'ै':0x114bb,'ो':0x114bc,'ौ':0x114be,'ँ':0x114bf,'ं':0x114c0,'ः':0x114c1,'्':0x114c2,'़':0x114c3,'ऽ':0x114c4,'ॐ':0x114c7};
export function toTirhuta(text){return [...text.normalize('NFC')].map(c=>{let i=consonants.indexOf(c);if(i>=0)return String.fromCodePoint(0x1148f+i);i=vowels.indexOf(c);if(i>=0)return String.fromCodePoint(0x11481+i);if(marks[c])return String.fromCodePoint(marks[c]);if(/[०-९0-9]/.test(c))return String.fromCodePoint(0x114d0+(c>='०'?c.charCodeAt(0)-0x966:Number(c)));return c;}).join('');}
const cons={k:'क',kh:'ख',g:'ग',gh:'घ',ng:'ङ',ch:'च',chh:'छ',j:'ज',jh:'झ',ny:'ञ',t:'त',th:'थ',d:'द',dh:'ध',n:'न',p:'प',ph:'फ',b:'ब',bh:'भ',m:'म',y:'य',r:'र',l:'ल',v:'व',w:'व',sh:'श',s:'स',h:'ह',f:'फ',z:'ज'};
const vs={a:['अ',''],aa:['आ','ा'],i:['इ','ि'],ee:['ई','ी'],ii:['ई','ी'],u:['उ','ु'],oo:['ऊ','ू'],uu:['ऊ','ू'],e:['ए','े'],ai:['ऐ','ै'],o:['ओ','ो'],au:['औ','ौ']};
const known={shuvam:'शुभम्',shubham:'शुभम्',singh:'सिंह',kalyani:'कल्याणी',janakpur:'जनकपुर',nepal:'नेपाल'};
export function romanToDeva(text){return text.toLowerCase().split(/(\s+)/).map(word=>{if(known[word])return known[word];let out='',pending=false;for(let i=0;i<word.length;){let token=[word.slice(i,i+3),word.slice(i,i+2),word[i]].find(t=>vs[t]||cons[t]);if(!token){if(pending){out+='्';pending=false;}out+=word[i++];continue;}if(vs[token]){out+=vs[token][pending?1:0];pending=false;}else{if(pending)out+='्';out+=cons[token];pending=true;}i+=token.length;}return out;}).join('');}
