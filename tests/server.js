import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8'};
http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const relative=pathname.replace(/^\/livro-de-receitas\//,'');
  const file=path.resolve(root,relative || 'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}).listen(4173,'127.0.0.1');
