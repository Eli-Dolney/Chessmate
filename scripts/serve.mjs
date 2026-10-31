import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist'),host='127.0.0.1',port=Number(process.env.CHESSMATE_PORT||process.env.LTW_PORT||4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local port.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 const pathname=decodeURIComponent(new URL(req.url,`http://${host}:${port}`).pathname);
 if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"app":"Chessmate","version":1}');return;}
 let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(pathname==='/')file=path.join(root,'index.html');
 const body=await readFile(file);
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port 4173 is already in use. Close the other service or reuse the running Chessmate window.':err.message);process.exit(1);});
server.listen(port,host,()=>console.log(`Chessmate is ready at http://${host}:${port}`));
