const fs=require('fs'),zlib=require('zlib');
function crc32(buf){let c=~0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&(-(c&1)));}return ~c>>>0;}
function chunk(type,data){const t=Buffer.from(type,'ascii');const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const cd=Buffer.concat([t,data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(cd),0);return Buffer.concat([len,cd,crc]);}
function png(N){
  const bg=[0x4d,0xa3,0xff],fg=[0x06,0x12,0x1f];
  const segs=[[[0.30,0.53],[0.44,0.68]],[[0.44,0.68],[0.73,0.35]]].map(s=>s.map(p=>[p[0]*N,p[1]*N]));
  const th=0.10*N;
  function dseg(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1];const wx=px-a[0],wy=py-a[1];let t=(wx*vx+wy*vy)/(vx*vx+vy*vy);t=Math.max(0,Math.min(1,t));return Math.hypot(px-(a[0]+t*vx),py-(a[1]+t*vy));}
  const raw=Buffer.alloc((N*4+1)*N);let o=0;
  for(let y=0;y<N;y++){raw[o++]=0;for(let x=0;x<N;x++){
    const d=Math.min(dseg(x+0.5,y+0.5,segs[0][0],segs[0][1]),dseg(x+0.5,y+0.5,segs[1][0],segs[1][1]));
    let cov=Math.max(0,Math.min(1,(th/2-d)+0.5));
    raw[o++]=Math.round(fg[0]*cov+bg[0]*(1-cov));
    raw[o++]=Math.round(fg[1]*cov+bg[1]*(1-cov));
    raw[o++]=Math.round(fg[2]*cov+bg[2]*(1-cov));
    raw[o++]=255;
  }}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(N,0);ihdr.writeUInt32BE(N,4);ihdr[8]=8;ihdr[9]=6;
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
fs.writeFileSync('icon-512.png',png(512));
fs.writeFileSync('icon-192.png',png(192));
console.log('icons written');
