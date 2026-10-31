import {build} from 'esbuild';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {Chess} from 'chess.js';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await mkdir(path.join(root,'test-results'),{recursive:true});
await mkdir(path.join(root,'verification'),{recursive:true});
const bundle=path.join(root,'test-results/expanded-verify.mjs');
await build({entryPoints:[path.join(root,'src/expandedLessons.ts')],outfile:bundle,bundle:true,platform:'node',format:'esm'});
const {extraExercises:exercises}=await import(pathToFileURL(bundle));
const proc=spawn(process.execPath,[path.join(root,'node_modules/stockfish/bin/stockfish-18-lite-single.js')],{stdio:['pipe','pipe','pipe']});
let buffer='',waiter,lines=[];proc.stdout.on('data',data=>{buffer+=data;let p;while((p=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,p).trim();buffer=buffer.slice(p+1);lines.push(line);if(waiter?.match(line)){const w=waiter;waiter=null;w.resolve(lines);lines=[];}}});proc.stderr.on('data',data=>process.stderr.write(data));
function wait(match){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{proc.kill();reject(new Error('Engine timeout'));},20000);waiter={match,resolve:v=>{clearTimeout(timer);resolve(v);}};});}
function send(s){proc.stdin.write(s+'\n');}
let ready=wait(l=>l==='uciok');send('uci');await ready;ready=wait(l=>l==='readyok');send('setoption name Hash value 64');send('isready');await ready;
async function analyze(fen,move,time=2500){send('setoption name MultiPV value 1');send('position fen '+fen);const result=wait(l=>l.startsWith('bestmove '));send(`go movetime ${time}${move?' searchmoves '+move:''}`);const output=await result;const info=output.filter(l=>l.includes(' score ')&&l.includes(' pv ')).at(-1);const score=info?.match(/score (cp|mate) (-?\d+)/);return {best:output.at(-1)?.split(' ')[1],score:score?{kind:score[1],value:Number(score[2])}:null,depth:Number(info?.match(/depth (\d+)/)?.[1]),pv:info?.split(' pv ')[1]};}
const report=[]; const selected=process.env.LESSON_IDS?.split(',');
try{
 for(const e of exercises.filter(e=>!selected||selected.includes(e.id))){const c=new Chess(e.fen),move=c.move(e.accepted[0]).lan;const best=await analyze(e.fen,undefined,selected||e.theme==='tactic'||e.theme==='defense'?5000:1500);const chosen=best.best===move?best:await analyze(e.fen,move,selected||e.theme==='tactic'||e.theme==='defense'?5000:1500);const loss=best.score?.kind==='cp'&&chosen.score?.kind==='cp'?best.score.value-chosen.score.value:null;const row={id:e.id,solution:e.accepted[0],best,chosen,lossCp:loss};report.push(row);console.log(`${e.id}: ${e.accepted[0]}, loss=${loss??'mate'}cp, depth=${chosen.depth}`);}

 await writeFile(path.join(root,selected?'verification/expanded-analysis-targeted.json':'verification/expanded-analysis.json'),JSON.stringify(report,null,2));
}finally{send('quit');proc.kill();}


