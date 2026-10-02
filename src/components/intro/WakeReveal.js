// A real transparent cloud mask: the page is already alive underneath.
// The first cleared corridor follows the departing aircraft, then its wake
// rolls the remaining cloud bank off the screen. No empty intermediate frame.
export function createWakeReveal(canvas) {
  const dpr=Math.min(devicePixelRatio||1,1.4),w=innerWidth,h=innerHeight;
  canvas.width=w*dpr;canvas.height=h*dpr;
  const ctx=canvas.getContext('2d');
  const cloud=document.createElement('canvas');cloud.width=canvas.width;cloud.height=canvas.height;
  const c=cloud.getContext('2d');c.scale(dpr,dpr);
  const night=document.documentElement.dataset.theme==='night';
  c.fillStyle=night?'#263c4c':'#c4d9df';c.fillRect(0,0,w,h);
  for(let i=0;i<54;i++){
    const x=((Math.sin(i*78.23)+1)/2)*w,y=((Math.sin(i*31.17+2)+1)/2)*h;
    const r=Math.min(w,h)*(.16+(i%7)*.04),g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,night?'#a4b6c44d':'#f8faf4bb');g.addColorStop(1,'transparent');
    c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
  }
  const smooth=t=>t*t*(3-2*t);
  return {
    draw(p){
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(cloud,0,0);ctx.scale(dpr,dpr);ctx.globalCompositeOperation='destination-out';
      const travel=Math.min(1,p/.82),spread=smooth(Math.max(0,(p-.28)/.72));
      for(let i=0;i<=38*travel;i++){
        const t=i/38,x=w*(-.175+1.35*t),y=h*(.58-.15*t);
        const r=Math.min(w,h)*(.035+spread*1.42)+Math.sin(t*Math.PI)*h*.04;
        const g=ctx.createRadialGradient(x,y,r*.48,x,y,r);
        g.addColorStop(0,'#000');g.addColorStop(.65,'#000e');g.addColorStop(1,'transparent');
        ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r*1.35,r,Math.sin(t*6)*.2,0,Math.PI*2);ctx.fill();
      }
      ctx.globalCompositeOperation='source-over';
      canvas.style.opacity=String(1-smooth(Math.max(0,(p-.78)/.22)));
    },
    dispose(){cloud.width=cloud.height=0;}
  };
}
