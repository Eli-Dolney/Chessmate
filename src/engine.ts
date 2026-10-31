import type { Analysis, CandidateLine, PositionHistory } from './types';
export interface WorkerLike { postMessage(message:string):void; terminate():void; onmessage:((event:MessageEvent)=>void)|null; onerror:((event:ErrorEvent)=>void)|null }
interface Request { fen:string; time:number; multi:number; skill:number; searchMoves?:string[]; history?:PositionHistory; resolve:(a:Analysis)=>void; reject:(e:Error)=>void }
export class Engine {
 private worker?:WorkerLike; private ready=false; private queue:Request[]=[]; private active?:Request;
 private lines=new Map<number,CandidateLine>(); private timer?:ReturnType<typeof setTimeout>; private started=0;
 onStatus:(s:string)=>void=()=>{};
 constructor(private factory:()=>WorkerLike=()=>new Worker('/engine/stockfish-18-lite-single.js')){}
 analyze(fen:string,time=1000,multi=3,skill=20,searchMoves?:string[],history?:PositionHistory):Promise<Analysis>{return new Promise((resolve,reject)=>{this.queue.push({fen,time,multi,skill,searchMoves,history,resolve,reject});this.pump();});}
 private boot(){
  try{this.onStatus('Loading local engine…');this.worker=this.factory();const worker=this.worker;worker.onmessage=e=>{if(this.worker===worker)this.receive(String(e.data));};worker.onerror=()=>{if(this.worker===worker)this.fail(new Error('The local engine could not start. Try Restart engine.'));};this.timer=setTimeout(()=>this.fail(new Error('Engine initialization timed out. Try Restart engine.')),20000);worker.postMessage('uci');}
  catch(e){this.fail(e instanceof Error?e:new Error('Engine unavailable'));}
 }
 private pump(){if(!this.worker){this.boot();return;}if(!this.ready||this.active||!this.queue.length)return;
  this.active=this.queue.shift()!;this.lines.clear();this.started=performance.now();this.onStatus('Analyzing on your PC…');
  const r=this.active;
  this.worker.postMessage('setoption name Hash value 32');
  this.worker.postMessage(`setoption name Skill Level value ${r.skill}`);
  this.worker.postMessage(`setoption name MultiPV value ${r.multi}`);
  this.worker.postMessage(r.history?`position fen ${r.history.initialFen}${r.history.moves.length?` moves ${r.history.moves.join(' ')}`:''}`:`position fen ${r.fen}`);
  this.timer=setTimeout(()=>this.fail(new Error('Analysis timed out. Restart the engine to try again.')),r.time+15000);
  this.worker.postMessage(`go movetime ${r.time}${r.searchMoves?.length?` searchmoves ${r.searchMoves.join(' ')}`:''}`);
 }
 private receive(message:string){for(const line of message.split('\n')){
  if(line==='uciok'){this.worker?.postMessage('isready');continue;}
  if(line==='readyok'){clearTimeout(this.timer);this.ready=true;this.onStatus('Engine ready · local');this.pump();continue;}
  if(!this.active)continue;
  if(line.startsWith('info ')&&line.includes(' pv ')&&!line.includes('bound')){
   const pv=line.split(' pv ')[1].trim().split(/\s+/);const sc=line.match(/score (cp|mate) (-?\d+)/);const depth=Number(line.match(/depth (\d+)/)?.[1]??0);const rank=Number(line.match(/multipv (\d+)/)?.[1]??1);
   if(sc&&pv.length)this.lines.set(rank,{move:pv[0],pv,depth,...(sc[1]==='mate'?{mate:Number(sc[2])}:{cp:Number(sc[2])})});
  }
  if(line.startsWith('bestmove ')){
   clearTimeout(this.timer);const r=this.active;this.active=undefined;const bestmove=line.split(' ')[1];
   const lines=[...this.lines.entries()].sort((a,b)=>a[0]-b[0]).map(([,l])=>l);
   r.resolve({fen:r.fen,lines,bestmove:bestmove==='(none)'||bestmove==='0000'?undefined:bestmove,elapsed:performance.now()-this.started});this.onStatus('Engine ready · local');this.pump();
  }
 }}
 private fail(error:Error){clearTimeout(this.timer);this.worker?.terminate();this.worker=undefined;this.ready=false;this.active?.reject(error);this.active=undefined;for(const r of this.queue)r.reject(error);this.queue=[];this.onStatus(error.message);}
 cancel(){this.fail(new DOMException('Analysis cancelled','AbortError'));this.onStatus('Engine ready to restart');}
 restart(){this.cancel();this.boot();}
 dispose(){this.cancel();}
}
