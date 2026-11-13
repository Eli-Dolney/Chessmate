import {replay,uciMove} from './chess';
import type {Analysis,PositionHistory} from './types';

/** Build one possible line without changing the study or its live game. */
export async function buildContinuation(
 root:PositionHistory,
 seed:string[],
 totalPlies:10|20,
 analyze:(position:PositionHistory)=>Promise<Analysis>,
 isCurrent:()=>boolean,
 onProgress:(plies:number)=>void,
):Promise<string[]> {
 const assertCurrent=()=>{if(!isCurrent())throw new DOMException('Line generation cancelled','AbortError');};
 assertCurrent();
 const history:PositionHistory={initialFen:root.initialFen,moves:[...root.moves]};
 const board=replay(history),moves:string[]=[];
 const append=(move:string,source:string)=>{
  assertCurrent();
  try{
   if(typeof move!=='string'||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move))throw new Error('Invalid move format');
   uciMove(board,move);
  }catch{throw new Error(`${source} contains an illegal move (${String(move)}). Try calculating the line again.`);}
  moves.push(move);history.moves.push(move);onProgress(moves.length);
 };
 for(const move of seed){
  if(moves.length>=totalPlies||board.isGameOver())break;
  append(move,'The selected line');
 }
 while(moves.length<totalPlies&&!board.isGameOver()){
  assertCurrent();
  const analysis=await analyze({initialFen:history.initialFen,moves:[...history.moves]});
  assertCurrent();
  if(analysis.fen!==board.fen())throw new Error('The engine returned a line for a different position. Calculate the line again.');
  const pv=analysis.lines[0]?.pv.length?analysis.lines[0].pv:analysis.bestmove?[analysis.bestmove]:[];
  if(!pv.length)throw new Error('The engine returned no continuation. Restart the engine and try again.');
  for(const move of pv){
   if(moves.length>=totalPlies||board.isGameOver())break;
   append(move,'The calculated line');
  }
 }
 assertCurrent();
 return moves;
}
