import { Chess, type Color, type Square } from 'chess.js';
import { legalCaptures, names, pieces, values, uciMove, sanFor } from './chess';
import type { CandidateLine, CoachingEvidence } from './types';
const other=(color:Color):Color=>color==='w'?'b':'w';
export function positionPlans(fen:string,player:Color):CoachingEvidence[]{
 const c=new Chess(fen),own=pieces(c).filter(p=>p.color===player),out=inspectPosition(fen,player).filter(e=>e.kind==='principle');
 const pawns=own.filter(p=>p.type==='p');
 const isolated=pawns.filter(p=>!pawns.some(q=>Math.abs(q.square.charCodeAt(0)-p.square.charCodeAt(0))===1));
 if(isolated.length)out.push({kind:'principle',text:'These pawns have no friendly pawns on adjacent files. They may need piece support; active pieces and open lines can compensate.',squares:isolated.map(p=>p.square)});
 const breaks=c.turn()===player?c.moves({verbose:true}).filter(m=>m.piece==='p'&&(m.captured||['d4','e4','d5','e5'].includes(m.to))):[];
 if(breaks.length)out.push({kind:'principle',text:'Examine a central pawn advance or pawn capture. Opening lines changes both sides’ activity; calculate the replies before committing.',squares:breaks.slice(0,3).map(m=>m.from)});
 const rooks=own.filter(p=>p.type==='r'&&!pawns.some(q=>q.square[0]===p.square[0]));
 if(rooks.length)out.push({kind:'principle',text:'A rook is on a file without one of your pawns. Look for useful entry squares, but check opposing pawns and pieces before advancing.',squares:rooks.map(p=>p.square)});
 if(!out.length)out.push({kind:'principle',text:'Compare the activity of your pieces. Look for a safe improvement that answers immediate threats before making a long-term plan.'});
 return out;
}
export function inspectPosition(fen:string,player:Color):CoachingEvidence[] {
 const c=new Chess(fen), evidence:CoachingEvidence[]=[];
 if(c.isCheck())evidence.push({kind:'fact',text:`${c.turn()==='w'?'White':'Black'} is in check. A legal reply must deal with the check.`});
 const threats=legalCaptures(c,other(player)).filter(m=>m.captured!=='p').slice(0,3);
 for(const m of threats){
   const hypothetical=new Chess(c.fen().split(' ').map((v,i)=>i===1?other(player):i===3?'-':v).join(' '));
   try{hypothetical.move(m.san);const recaptures=legalCaptures(hypothetical,player,m.to);evidence.push({kind:'fact',text:`${m.to}: your ${names[m.captured!]} can be captured by the ${names[m.piece]} on ${m.from}${recaptures.length?' (you have a legal recapture).':'; no immediate legal recapture is available.'} This alone does not prove the capture is good.`,squares:[m.from,m.to]});}catch{/* Skip impossible hypothetical positions. */}
 }
 const home=player==='w'?'1':'8';
 const undeveloped=pieces(c).filter(p=>p.color===player&&(['b','n'].includes(p.type))&&p.square[1]===home);
 if(undeveloped.length)evidence.push({kind:'principle',text:`${undeveloped.length} of your minor pieces remain on the back rank. Consider bringing one toward useful central squares when immediate threats allow.`,squares:undeveloped.map(p=>p.square)});
 const king=pieces(c).find(p=>p.color===player&&p.type==='k');
 const remaining=pieces(c).filter(p=>!['p','k'].includes(p.type)),rights=c.getCastlingRights(player);
 if(king&&remaining.length<=4&&!remaining.some(p=>p.type==='q'))evidence.push({kind:'principle',text:'Few pieces remain and there are no queens. Examine whether your king can safely support pawns or attack weaknesses; still check the opponent’s forcing moves.',squares:[king.square]});
 else if(king&&['d','e'].includes(king.square[0]))evidence.push({kind:'principle',text:rights.k||rights.q?'Your king is on a central file. Check whether castling or keeping the center closed would make it safer.':'Your king is on a central file and no castling rights remain. Inspect checks and safe escape squares before opening central lines.',squares:[king.square]});
 const central=['d4','e4','d5','e5'] as Square[];
 const controlled=central.filter(s=>c.isAttacked(s,player));
 evidence.push({kind:'fact',text:`Your pieces attack ${controlled.length} of the four central squares${controlled.length?`: ${controlled.join(', ')}`:''}. An attack map includes pinned pieces; it is not proof of a legal move.`,squares:controlled});
 return evidence;
}
export function explainMove(fen:string,uci:string):CoachingEvidence[] {
 const c=new Chess(fen), out:CoachingEvidence[]=[]; let m;
 try{m=uciMove(c,uci);}catch{return [{kind:'fact',text:'This move is not legal in this position.'}];}
 if(m.captured)out.push({kind:'fact',text:`${m.san} captures a ${names[m.captured]} on ${m.to}. Whether the exchange works depends on the replies.`,squares:[m.to]});
 if(m.isKingsideCastle()||m.isQueensideCastle())out.push({kind:'fact',text:'Castling moves the king away from its starting square and brings a rook toward the center.'});
 if(m.promotion)out.push({kind:'fact',text:`The pawn promotes to a ${names[m.promotion]}.`});
 if(c.isCheckmate())out.push({kind:'fact',text:'This is checkmate: the king is in check and has no legal escape.'});
 else if(c.isCheck())out.push({kind:'fact',text:'This gives check, so the opponent must respond to the attack on their king.'});
 if(['n','b'].includes(m.piece)&&m.from[1]===(m.color==='w'?'1':'8')&&m.to[1]!==m.from[1])out.push({kind:'principle',text:`This develops a ${names[m.piece]} from the back rank. Its usefulness still depends on the position.`});
 const targets=legalCaptures(c,m.color).filter(x=>x.from===m.to&&values[x.captured!]>=3);
 if(targets.length>=2)out.push({kind:'fact',text:`The ${names[m.piece]} on ${m.to} attacks ${targets.map(x=>`${names[x.captured!]} on ${x.to}`).join(' and ')} with legal captures. This is a fork pattern, but check whether it wins anything.`,squares:targets.map(x=>x.to)});
 // Absolute pins: removal exposes the king, and the blocker is on a bishop/rook/queen ray.
 const enemy=other(m.color),king=pieces(c).find(p=>p.color===enemy&&p.type==='k');
 if(king&&['b','r','q'].includes(m.piece)){
   const fx=m.to.charCodeAt(0),fy=Number(m.to[1]),kx=king.square.charCodeAt(0),ky=Number(king.square[1]),dx=kx-fx,dy=ky-fy;
   const diagonal=Math.abs(dx)===Math.abs(dy),straight=dx===0||dy===0;
   if((diagonal&&m.piece!=='r')||(straight&&m.piece!=='b')){
     const blockers=[];let x=fx+Math.sign(dx),y=fy+Math.sign(dy);
     while(x!==kx||y!==ky){const s=(String.fromCharCode(x)+y) as Square;const p=c.get(s);if(p)blockers.push({s,p});x+=Math.sign(dx);y+=Math.sign(dy);}
     if(blockers.length===1&&blockers[0].p.color===enemy)out.push({kind:'fact',text:`The ${names[blockers[0].p.type]} on ${blockers[0].s} is pinned to its king along the ${names[m.piece]}’s line. It cannot legally expose its king.`,squares:[m.to,blockers[0].s,king.square]});
   }
 }
 if(!out.length)out.push({kind:'fact',text:`${m.san} moves your ${names[m.piece]} from ${m.from} to ${m.to}. Explore the continuation to see how the opponent can respond.`});
 return out;
}
export function progressiveHint(fen:string,line:CandidateLine,level:number){const c=new Chess(fen),p=c.get(line.move.slice(0,2) as Square);if(level===1)return c.isCheck()?'Start by finding every legal way out of check.':'Look for checks, captures, and threats for both sides before choosing a move.';if(level===2)return `Examine your ${p?names[p.type]:'piece'} on ${line.move.slice(0,2)}. ${explainMove(fen,line.move)[0].text.replace(sanFor(fen,line.move),'The candidate move')}`;return `Try ${sanFor(fen,line.move)}. Play through the possible reply before deciding.`;}
