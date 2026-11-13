import { Chess, type Color, type Square, type PieceSymbol } from 'chess.js';
import type { CandidateLine, Difficulty, GameSession } from './types';
export const names: Record<PieceSymbol, string> = { p:'pawn', n:'knight', b:'bishop', r:'rook', q:'queen', k:'king' };
export const values: Record<PieceSymbol, number> = {p:1,n:3,b:3,r:5,q:9,k:100};
export function newGame(player: Color = 'w', difficulty: Difficulty = 'Gentle'): GameSession {
  return {id:crypto.randomUUID(),initialFen:new Chess().fen(),moves:[],player,difficulty,created:new Date().toISOString(),updated:new Date().toISOString(),moments:[],pending:false};
}
export function replay(session: Pick<GameSession,'initialFen'|'moves'>) {
  if(typeof session.initialFen!=='string'||!session.initialFen.trim()||!Array.isArray(session.moves))throw new Error('Invalid saved position history.');
  const c=new Chess(session.initialFen);for(const m of session.moves)uciMove(c,m);return c;
}
export function positionKey(fen: string) { return fen.split(' ').slice(0,4).join(' '); }
export function uciMove(c: Chess, move: string) {
  if(typeof move!=='string'||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move))throw new Error('Invalid saved move.');
  const made=c.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]});
  // chess.js ignores promotion suffixes on ordinary moves; our stored/engine notation must be exact.
  if(made.lan!==move){c.undo();throw new Error('Invalid saved move.');}return made;
}
export function sanFor(fen: string, move: string) { try {return uciMove(new Chess(fen),move).san;} catch {return move;} }
export function lineSan(fen: string, pv: string[],limit=10) { const c=new Chess(fen); const result:string[]=[]; for(const m of pv.slice(0,limit)){try{result.push(uciMove(c,m).san);}catch{break;}}return result; }
export function score(line?: CandidateLine) { if(!line)return 0; return line.mate!==undefined ? Math.sign(line.mate || 1)*(100000-Math.abs(line.mate)*100) : line.cp ?? 0; }
export function scoreLabel(line: CandidateLine, turn: Color) { if(line.mate!==undefined) return `Mate in ${Math.abs(line.mate)} for ${line.mate>0?(turn==='w'?'White':'Black'):(turn==='w'?'Black':'White')}`; const cp=(line.cp??0)*(turn==='w'?1:-1);return `${cp>=0?'+':''}${(cp/100).toFixed(2)} · White’s perspective`; }
export function resultLabel(c:Chess) { if(c.isCheckmate())return `${c.turn()==='w'?'Black':'White'} wins by checkmate`; if(c.isStalemate())return 'Draw by stalemate'; if(c.isThreefoldRepetition())return 'Draw by repetition'; if(c.isInsufficientMaterial())return 'Draw by insufficient material'; if(c.isDrawByFiftyMoves())return 'Draw by the fifty-move rule'; if(c.isDraw())return 'Draw'; return ''; }
export function pieces(c: Chess) { return c.board().flat().filter(p=>p!==null); }
// Reconstruct a hypothetical side-to-move only for legal threat inspection, never game state.
export function forSide(c:Chess,color:Color) { const fields=c.fen().split(' '); if(fields[1]!==color){fields[1]=color;fields[3]='-';}return new Chess(fields.join(' ')); }
export function legalCaptures(c:Chess,color:Color,target?:Square) { try{return forSide(c,color).moves({verbose:true}).filter(m=>m.captured && m.captured!=='k' && (!target||m.to===target));}catch{return [];} }
