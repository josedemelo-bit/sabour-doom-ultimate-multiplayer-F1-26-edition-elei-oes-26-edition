const http=require('http');
const fs=require('fs');
const path=require('path');
const {WebSocketServer}=require('ws');
const PORT=process.env.PORT||10000;
const PUBLIC=path.join(__dirname,'public');
const players=new Map();
const server=http.createServer((req,res)=>{
  let u=decodeURIComponent((req.url||'/').split('?')[0]); if(u==='/')u='/index.html';
  const file=path.normalize(path.join(PUBLIC,u));
  if(!file.startsWith(PUBLIC)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
  });
});
const wss=new WebSocketServer({server});
function broadcast(){const data={};for(const [id,p] of players)data[id]=p;const msg=JSON.stringify({type:'players',players:data});for(const ws of wss.clients)if(ws.readyState===1)ws.send(msg);}
wss.on('connection',ws=>{
  const id=Math.random().toString(36).slice(2,10);players.set(id,{x:1.5,y:1.5,dirX:1,dirY:0,skin:0});ws.send(JSON.stringify({type:'welcome',id}));broadcast();
  ws.on('message',raw=>{try{const m=JSON.parse(raw);if(m.type!=='state')return;const p=players.get(id);if(!p)return;for(const k of ['x','y','dirX','dirY'])if(Number.isFinite(m[k]))p[k]=m[k];if(Number.isInteger(m.skin)&&m.skin>=0&&m.skin<=3)p.skin=m.skin;broadcast();}catch{}});
  ws.on('close',()=>{players.delete(id);broadcast();});
});
server.listen(PORT,'0.0.0.0',()=>console.log(`DOOM multiplayer server on ${PORT}`));
