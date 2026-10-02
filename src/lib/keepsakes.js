// Native SVG frame artwork and local canvas processing; no network requests.
const palettes=[['#173f35','#efe8d6','#b95742'],['#254936','#e7ebdf','#70956a'],['#6f343e','#f7e5dd','#bd6470'],['#315565','#edf3ef','#91b3bd'],['#6b4535','#eee0ce','#bf8764'],['#4e6251','#f0eddd','#a3b47a'],['#263950','#ecebdc','#be7e55'],['#563d67','#eee5ef','#ac85ae'],['#9c653a','#fff0cf','#d1a95d'],['#293735','#eceae5','#8b9791']];
const names=['Mithila fish','Forest flight','Lali gurans','Himalayan ice','Patan brick','Lumbini calm','Prayer flags','Blue-hour lotus','Dashain gold','Silver peaks','Janaki arches','Tea garden','Terai rose','Monsoon mist','Koshi earth','Buddha garden','Indigo night','Mithila plum','Tihar lights','Lokta monochrome'];
const filters=['contrast(1.06) saturate(.94)','saturate(.8) contrast(1.04)','saturate(.9) sepia(.1)','saturate(.75) brightness(1.04)','sepia(.3) saturate(.8)','saturate(.65) contrast(.94)','saturate(1.08) contrast(1.03)','hue-rotate(8deg) saturate(.8)','sepia(.15) saturate(1.05)','grayscale(1) contrast(1.05)','sepia(.08) brightness(1.02)','saturate(.85) contrast(1.08)','sepia(.13) saturate(.8)','saturate(.7) contrast(.95)','sepia(.22) contrast(1.02)','saturate(.6) brightness(1.03)','saturate(.72) contrast(1.12)','hue-rotate(-8deg) saturate(.85)','sepia(.12) contrast(1.08)','grayscale(1) sepia(.17) contrast(.94)'];
export const KEEPSAKE_FRAMES=names.map((name,i)=>({id:`nepal-${i+1}`,name,filter:filters[i],palette:palettes[i%10],motif:i%7,layout:Math.floor(i/7)}));
const motif=(type,ink,accent)=>{
  const common=`fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  if(type===0)return `<g ${common}><path d="M-32 0Q0-29 28 0Q0 29-32 0Z M28 0L44-15V15Z"/><circle cx="-19" cy="-3" r="2"/><path d="M-3-13Q13 0-3 13"/></g>`;
  if(type===1)return `<g ${common}><path d="M-42 20L-10-25L6-3L20-18L45 20 M-23-6L-10-25L1-10 M8 1L20-18L30-4"/></g>`;
  if(type===2)return `<g ${common}>${Array.from({length:5},(_,k)=>`<ellipse rx="8" ry="18" cy="-14" transform="rotate(${k*72})"/>`).join('')}<circle r="6" fill="${accent}"/></g>`;
  if(type===3)return `<g ${common}><path d="M-38 20H38V-7H-38Z M-24-7Q-24-27-12-31Q0-27 0-7 M0-7Q0-27 12-31Q24-27 24-7 M-28 20V9Q-20-3-12 9V20 M4 20V9Q12-3 20 9V20"/><path d="M-12-31V-37M12-31V-37"/></g>`;
  if(type===4)return `<g ${common}><path d="M-35 16H35M-26 12Q-22-9 0-12Q22-9 26 12 M0-12V-33 M-9-24H9 M-7-18H7 M-22 19V25H22V19"/></g>`;
  if(type===5)return `<g ${common}><path d="M0 24Q-29 16-32-6Q-6-8 0 24Q29 16 32-6Q6-8 0 24Z M0 20Q-20-8 0-31Q20-8 0 20Z"/></g>`;
  return `<g ${common}><path d="M-38-15Q0 0 38-15"/>${[-30,-15,0,15,30].map((x,k)=>`<path d="M${x} -11V${15+(k%2)*5}H${x+10}V-11Z" fill="${k%2?accent:ink}" opacity=".6"/>`).join('')}</g>`;
};
export function keepsakeFrameSvg(frame=KEEPSAKE_FRAMES[0],W=1200,H=1600){
  const [ink,paper,accent]=frame.palette,b=65;
  const corner=motif(frame.motif,paper,accent);
  const corners=[[b,b],[W-b,b],[W-b,H-b],[b,H-b]].map(([x,y],i)=>`<g transform="translate(${x} ${y}) scale(${frame.layout===2?.8:1}) rotate(${i*90})">${corner}</g>`).join('');
  const dots=Array.from({length:22},(_,i)=>`<circle cx="${110+i*(W-220)/21}" cy="28" r="${i%3?2:5}" fill="${i%3?paper:accent}"/><circle cx="${110+i*(W-220)/21}" cy="${H-28}" r="2" fill="${paper}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path fill="${ink}" fill-rule="evenodd" d="M0 0H${W}V${H}H0Z M${b} ${b}V${H-b}H${W-b}V${b}Z"/><rect x="12" y="12" width="${W-24}" height="${H-24}" rx="${frame.layout===1?40:4}" fill="none" stroke="${paper}" stroke-opacity=".55" stroke-width="2"/><rect x="${b}" y="${b}" width="${W-2*b}" height="${H-2*b}" fill="none" stroke="${paper}" stroke-width="4"/>${dots}${corners}<text x="${W/2}" y="${H-26}" text-anchor="middle" font-size="19" font-family="sans-serif" letter-spacing="2" fill="${paper}">SHUVAMSINGH.COM.NP · NEPAL KEEPSAKE</text></svg>`;
}
export const frameDataUrl=frame=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(keepsakeFrameSvg(frame))}`;
export async function composeKeepsake(source,frame){
  const img=new Image();img.src=source;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;
  const ctx=canvas.getContext('2d'),s=Math.max(1200/img.width,1600/img.height);
  ctx.filter=frame.filter;ctx.drawImage(img,(1200-img.width*s)/2,(1600-img.height*s)/2,img.width*s,img.height*s);ctx.filter='none';
  const border=new Image();border.src=frameDataUrl(frame);await border.decode();ctx.drawImage(border,0,0);
  // Always present, including exports made from a chosen local photo.
  ctx.fillStyle='rgba(12,28,24,.66)';ctx.fillRect(82,1490,1036,35);ctx.fillStyle='#fff';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText(`Visitor keepsake · ${frame.name} · shuvamsingh.com.np`,600,1515);
  return canvas.toDataURL('image/jpeg',.95);
}
