import {Chess,type Color,type Move,type Square} from 'chess.js';
import {branchOf,studyPosition} from './exploration';
import {explainMove,positionPlans} from './coach';
import {legalCaptures,names,pieces,replay,resultLabel,uciMove,values} from './chess';
import type {CoachingEvidence,Exploration} from './types';

export interface LineContinuation {san:string;move:string;text:string;squares:string[]}
export interface LineCommentary {
 currentFen:string;
 heading:string;
 facts:CoachingEvidence[];
 purpose:CoachingEvidence;
 plans:{color:Color;evidence:CoachingEvidence;continuation?:LineContinuation}[];
 next?:LineContinuation;
 terminal?:string;
}
const side=(color:Color)=>color==='w'?'White':'Black';
const center=['d4','e4','d5','e5'];
const ownWords=(text:string,color:Color)=>text.replace(/\byour\b/gi,`${side(color)}’s`).replace(/\byou have\b/gi,`${side(color)} has`);

function movePurpose(before:Chess,after:Chess,m:Move):CoachingEvidence {
 const who=side(m.color),square=m.to,pattern=explainMove(before.fen(),m.lan).find(e=>e.text.includes('fork pattern')||e.text.includes('pinned to its king'));
 let text:string;
 if(after.isCheckmate())text='There is no further setup to calculate in this line: the move has delivered checkmate.';
 else if(after.isCheck())text=`The check makes ${side(after.turn())} answer the king attack. ${who} may use that forcing move to gain time, but the legal defenses still need inspection.`;
 else if(pattern)text=`A possible purpose is to create pressure with this ${pattern.text.includes('fork pattern')?'fork':'pin'}. The pattern alone does not establish a material gain; examine the opponent’s replies.`;
 else if(m.isKingsideCastle()||m.isQueensideCastle())text=`${who} may be seeking king shelter and a more active rook. Whether the king is safer depends on the open lines and opposing pieces.`;
 else if(m.promotion)text=`${who} converts the pawn into a ${names[m.promotion]}. Check the resulting checks, captures, and drawing possibilities before judging the promotion.`;
 else if(m.captured)text=`A possible purpose is to change the material balance or remove an opposing piece from the position. This capture is not automatically safe or profitable; compare the replies before judging it.`;
 else if(['n','b'].includes(m.piece)&&m.from[1]===(m.color==='w'?'1':'8')&&m.to[1]!==m.from[1])text=`${who} brings a ${names[m.piece]} off the back rank. A common aim is to bring more pieces into play and prepare coordination or castling, when immediate threats allow.`;
 else if(m.piece==='p'&&center.includes(m.to))text=`This pawn advance takes space in the center. ${who} may be preparing to support pieces or open central lines; pawn exchanges can change which side benefits.`;
 else if(m.piece==='p')text=`${who} changes the pawn structure. A possible aim is to gain space or prepare a pawn break, but the squares and lines left behind also need checking.`;
 else if(m.piece==='r')text=`${who} may be improving the rook’s access to a file or rank. Look for entry squares and opposing pawns before assuming the rook can penetrate.`;
 else if(m.piece==='k')text=`${who} may be improving the king’s position or avoiding pressure. Check opposing attacks before treating the destination as secure.`;
 else if(m.piece==='q')text=`${who} may be changing the queen’s pressure or coordinating with another piece. Check whether the opponent can gain time by attacking the queen.`;
 else text=`${who} changes the ${names[m.piece]}’s activity. Compare its new targets and escape squares with the old position; a useful-looking square can still be challenged.`;
 return {kind:'principle',text,squares:[square]};
}

function planFor(board:Chess,color:Color):CoachingEvidence {
 const who=side(color),opponent=color==='w'?'b':'w';
 if(board.turn()===color&&board.isCheck())return {kind:'principle',text:`${who} must first deal with the check. Compare legal king moves, captures of the checking piece, and blocks where available before pursuing a longer-term plan.`,squares:pieces(board).filter(p=>p.color===color&&p.type==='k').map(p=>p.square)};
 // Only the actual side to move is used for a concrete capture warning.
 if(board.turn()===opponent){
  const threat=legalCaptures(board,opponent).filter(m=>m.captured&&values[m.captured]>=3).sort((a,b)=>values[b.captured!]-values[a.captured!])[0];
  if(threat)return {kind:'principle',text:`${side(opponent)} can legally play ${threat.san} against ${who}’s ${names[threat.captured!]} on ${threat.to}. ${who}’s possible priority is to account for that capture or a counter-threat. A legal capture is not proof that it works.`,squares:[threat.from,threat.to]};
 }
 const candidates=positionPlans(board.fen(),color);
 const plan=candidates.find(e=>e.text.includes('Few pieces remain'))??candidates.find(e=>e.text.includes('no castling rights'))??candidates.find(e=>e.text.includes('minor pieces'))??candidates.find(e=>e.text.includes('rook is on a file'))??candidates[0];
 return {kind:'principle',text:ownWords(plan.text,color),squares:plan.squares};
}

/** Synchronous narration of the visible study step; no saved game or engine state is changed. */
export function buildLineCommentary(study:Exploration):LineCommentary {
 const board=replay(studyPosition(study)),branch=branchOf(study),terminal=board.isGameOver()?resultLabel(board):undefined;
 const last=study.step?branch.moves[study.step-1]:undefined;
 let facts:CoachingEvidence[],purpose:CoachingEvidence,heading:string;
 if(last){
  const before=replay(studyPosition({...study,step:study.step-1})),after=replay(studyPosition({...study,step:study.step-1})),m=uciMove(after,last);
  heading=`${side(m.color)} played ${m.san}`;
  facts=explainMove(before.fen(),last).filter(e=>e.kind==='fact').map(e=>({...e,text:ownWords(e.text,m.color)}));
  if(m.isEnPassant())facts=facts.filter(e=>!e.text.includes('captures a')).concat({kind:'fact',text:`${m.san} captures the pawn en passant: ${side(m.color)}’s pawn lands on ${m.to}, and the opposing pawn is removed from ${m.to[0]}${m.from[1]}.`,squares:[m.to,m.to[0]+m.from[1]]});
  if(['n','b'].includes(m.piece)&&m.from[1]===(m.color==='w'?'1':'8')&&m.to[1]!==m.from[1])facts.unshift({kind:'fact',text:`The ${names[m.piece]} moves from the back rank on ${m.from} to ${m.to}.`,squares:[m.from,m.to]});
  if(m.piece==='p'&&center.includes(m.to))facts.unshift({kind:'fact',text:`${side(m.color)}’s pawn now occupies the central square ${m.to}.`,squares:[m.to]});
  if(!facts.length)facts=[{kind:'fact',text:`${side(m.color)} moves the ${names[m.piece]} from ${m.from} to ${m.to}.`,squares:[m.from,m.to]}];
  purpose=movePurpose(before,after,m);
 }else{
  heading=`Starting position · ${side(board.turn())} to move`;
  facts=[{kind:'fact',text:`This is the starting position of the selected line. ${side(board.turn())} moves next.`}];
  purpose={kind:'principle',text:'Compare checks, captures, and threats before following the continuation. The saved moves show one possible sequence, not the only way either side can play.'};
 }
 if(terminal){facts=[{kind:'fact' as const,text:terminal},...(last?facts.filter(e=>!e.text.includes('checkmate')):[])].slice(0,3);if(!last)heading=`Line finished · ${terminal}`;purpose={kind:'principle',text:'This line has ended under the game rules. Step back to examine where a different choice could change the outcome.'};}
 const plans:LineCommentary['plans']=(['w','b'] as const).map(color=>({color,evidence:terminal?{kind:'principle',text:`${side(color)} has no further move to plan in this finished line.`}:planFor(board,color)}));
 let next:LineContinuation|undefined;
 if(!terminal){
  const future=replay(studyPosition(study)),intervening:string[]=[];
  for(const move of branch.moves.slice(study.step,study.step+6)){
   if(future.isGameOver())break;
   const before=new Chess(future.fen()),m=uciMove(future,move),current=board.get(m.from);
   const samePiece=current?.color===m.color&&current.type===m.piece&&!intervening.some(u=>u.slice(0,2)===m.from||u.slice(2,4)===m.from);
   const squares=intervening.length===0?[m.from,m.to]:samePiece?[m.from]:[];
   const continuation:LineContinuation={san:m.san,move,text:`In this saved line, ${side(m.color)} ${intervening.length?'later':'next'} plays ${m.san}. ${movePurpose(before,future,m).text} This continuation is a possibility, not a forced prediction.`,squares};
   if(!next)next=continuation;
   const plan=plans.find(p=>p.color===m.color)!;if(!plan.continuation)plan.continuation=continuation;
   intervening.push(move);
  }
 }
 return {currentFen:board.fen(),heading,facts:facts.slice(0,3),purpose,plans,next,terminal};
}
