import {replay,score,positionKey} from './chess';
import type {CandidateLine,GameReview,GameSession,LearningMoment} from './types';
export function createReview(game:GameSession,color=game.player):GameReview{
 const position={initialFen:game.initialFen,moves:[...game.moves]},entries:GameReview['entries']=[];
 const board=replay({initialFen:game.initialFen,moves:[]});
 game.moves.forEach((move,ply)=>{if(board.turn()===color){const m=game.moments.find(m=>m.fen===board.fen()&&m.played===move&&m.bestLine&&m.playedLine&&m.position?.initialFen===position.initialFen&&m.position.moves.length===ply&&m.position.moves.every((u,i)=>u===position.moves[i]));if(m)entries.push({ply,moment:structuredClone(m)});}board.move(move);});
 return {id:crypto.randomUUID(),gameId:game.id,position,color,entries,search:{time:1000,skill:20},selected:0};
}
export function reviewPlies(review:GameReview){const c=replay({initialFen:review.position.initialFen,moves:[]});return review.position.moves.flatMap((m,i)=>{const own=c.turn()===review.color;c.move(m);return own?[i]:[];});}
export function reviewHighlights(review:GameReview){const seen=new Set<string>();return [...review.entries].sort((a,b)=>b.moment.loss-a.moment.loss||a.ply-b.ply).filter(e=>{const key=positionKey(e.moment.fen);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,3);}
export function makeReviewMoment(review:GameReview,ply:number,best:CandidateLine,played:CandidateLine):LearningMoment{
 const position={initialFen:review.position.initialFen,moves:review.position.moves.slice(0,ply)},fen=replay(position).fen();
 return {id:`${review.gameId}:${review.color}:${ply}`,position,fen,played:review.position.moves[ply],best:best.move,loss:Math.max(0,score(best)-score(played)),pv:best.pv.slice(0,10),bestLine:best,playedLine:played,explanation:best.move===played.move?'Your move matched the leading candidate at this search depth.':'Compare the replies to your move and the engine’s candidate. These lines are possibilities, not guaranteed outcomes.'};
}
