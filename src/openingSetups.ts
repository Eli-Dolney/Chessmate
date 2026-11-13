import type {Chess,Color,Move,Square} from 'chess.js';
import {pieces} from './chess';
import type {CoachingEvidence} from './types';

const at=(board:Chess,square:Square,color:Color,type='p')=>{const piece=board.get(square);return piece?.color===color&&piece.type===type;};
const idea=(text:string,squares:string[]):CoachingEvidence=>({kind:'principle',text,squares});
function early(board:Chess){
 const all=pieces(board);
 return !board.isGameOver()&&Number(board.fen().split(' ')[5])<=15&&all.length>=24&&all.some(p=>p.color==='w'&&p.type==='q')&&all.some(p=>p.color==='b'&&p.type==='q');
}
const empty=(board:Chess,square:Square)=>!board.get(square);

/** Conditional setup ideas tied to the pawns actually present, not the last opening name. */
export function openingSetupFor(board:Chess,color:Color):CoachingEvidence|undefined{
 if(!early(board))return;
 const w=(square:Square)=>at(board,square,'w'),b=(square:Square)=>at(board,square,'b');
 if(b('c6')&&b('d7')&&w('e4')&&empty(board,'d5'))return color==='b'
  ?idea('Black’s c6 pawn supports the d5 square. Consider preparing …d5 to challenge White’s e4 pawn, while bringing pieces into play. Check the replies before committing to the break.',['c6','d7','d5','e4'])
  :idea('White has a pawn on e4; Black’s c6 pawn supports a possible …d5 challenge. Consider supporting the center and developing pieces so that a central exchange does not leave them inactive.',['e4','c6','d5']);
 if(b('e6')&&b('d7')&&w('e4')&&empty(board,'d5'))return color==='b'
  ?idea('Black’s e6 pawn supports the d5 square. A possible plan is …d5 to challenge e4, followed by development. The c8 bishop’s route needs attention as the pawn structure takes shape.',['e6','d7','d5','e4'])
  :idea('Black’s e6 pawn supports a possible …d5 challenge to e4. White can prepare central support and development; after …d5, compare advancing, exchanging, or defending the center.',['e4','e6','d5']);
 if(b('d5')&&w('d4')&&w('c4')&&(b('e6')||b('c6'))){
  const support=b('c6')?'c6':'e6';
  return color==='b'
   ?idea(`Black’s ${support} pawn supports d5, while White’s c4 pawn attacks d5. Consider completing development before deciding whether to maintain this tension or exchange on c4. A pawn capture needs calculation.`,[support,'d5','c4','d4'])
   :idea(`White’s c4 pawn challenges Black’s d5 pawn, which is supported by ${support}. Consider developing pieces to support the center and compare exchanging with keeping the tension. Neither pawn structure is automatically better.`,['c4','d4','d5',support]);
 }
 if(b('e6')&&b('d5')&&w('d4')&&w('e5')){
  const canPrepareC5=(b('c7')&&empty(board,'c6')&&empty(board,'c5'))||(b('c6')&&empty(board,'c5'));
  return color==='b'
   ?idea(`White’s d4 pawn supports e5, and Black’s e6 pawn supports d5. ${b('c5')?'Black’s c5 pawn attacks the base on d4; consider how central exchanges would affect development.':canPrepareC5?'Consider preparing …c5 to challenge the base on d4; check the exchanges before opening lines.':'Consider a piece improvement that increases pressure on White’s pawn chain before opening lines.'}`,['e6','d5','d4','e5',...(b('c5')?['c5']:[])])
   :idea('White’s d4 pawn supports the advanced pawn on e5. Consider developing pieces behind that space and protecting the base on d4, which Black may try to challenge. Space helps only when pieces can use it.',['d4','e5','d5','e6']);
 }
 if(b('c5')&&w('e4'))return color==='b'
  ?idea('Black’s c5 pawn attacks the d4 square, while White has a pawn on e4. Consider developing pieces to support central play and compare any exchange on d4 before choosing a kingside or queenside plan.',['c5','d4','e4'])
  :idea('White has a pawn on e4 and Black’s c5 pawn contests d4. Consider developing pieces before deciding whether to play or support d4; a central exchange can open lines for both sides.',['e4','d4','c5']);
 if(b('g6')&&(at(board,'f8','b','b')||at(board,'g7','b','b'))&&(at(board,'e8','b','k')||at(board,'g8','b','k'))&&w('d4')&&w('e4')){
  const developed=at(board,'g7','b','b');
  return color==='b'
   ?idea(`Black has prepared a kingside fianchetto with …g6${developed?' and a bishop on g7':'; the f8 bishop can aim for g7 when legal'}. Consider completing development before challenging White’s d4/e4 center. The bishop’s diagonal can still be blocked.`,['g6',developed?'g7':'f8','d4','e4'])
   :idea('White’s pawns occupy d4 and e4, while Black has a kingside fianchetto setup. Consider developing pieces to support that space and watch for a central pawn challenge. Avoid an attack that leaves the center unsupported.',['d4','e4','g6']);
 }
 if(color==='w'&&w('d4')&&w('e4'))return idea('White’s pawns occupy d4 and e4. Consider developing pieces that support this center and preparing king shelter; watch how Black can challenge the pawns before advancing them again.',['d4','e4']);
 if(w('e4')&&b('e5'))return color==='w'
  ?idea('White and Black have opposing e-pawns in the center. Consider developing knights and bishops and preparing king shelter before deciding when to challenge the center with d4.',['e4','e5'])
  :idea('Black’s pawn on e5 shares the center with White’s pawn on e4. Consider developing pieces and keeping e5 supported; a later …d5 challenge needs preparation and calculation.',['e5','e4']);
 return;
}

/** Explain the move actually played; forcing moves keep the generic tactical explanation. */
export function openingMovePurpose(before:Chess,after:Chess,move:Move):CoachingEvidence|undefined{
 if(!early(after)||move.before!==before.fen()||move.after!==after.fen()||move.captured||move.promotion||after.isCheck())return;
 const w=(square:Square)=>at(after,square,'w'),b=(square:Square)=>at(after,square,'b');
 if(move.color==='b'&&move.piece==='p'){
  if(move.from==='c7'&&move.to==='c6'&&w('e4')&&(b('d7')||b('d5')))return idea(`…c6 places a pawn behind the d5 square. ${b('d5')?'A possible purpose is to reinforce Black’s central pawn on d5.':'A possible purpose is to prepare …d5 against White’s e4 pawn.'} White can respond by supporting the center or developing.`,['c6','d5','e4']);
  if(move.from==='e7'&&move.to==='e6'&&(b('d7')||b('d5'))&&(w('e4')||w('d4')))return idea(`…e6 adds pawn support to ${b('d5')?'Black’s pawn on d5':'a possible pawn advance to d5'}. ${at(after,'f8','b','b')?'It also clears a diagonal for the f8 bishop. ':''}A possible aim is to build a supported center, then develop the pieces.`,['e6','d5',...(at(after,'f8','b','b')?['f8']:[])]);
  if(move.from==='c7'&&move.to==='c5'&&(w('e4')||w('d4')))return idea('…c5 brings a flank pawn into the central struggle: the pawn now attacks d4. A possible aim is to challenge White’s center; compare the exchanges before assuming the open lines favor Black.',['c5','d4']);
  if(move.from==='d7'&&move.to==='d5'&&(w('e4')||w('d4')))return idea('…d5 places a pawn in the center and attacks the e4 and c4 squares. A possible purpose is to contest White’s central space. White can compare maintaining the tension with a legal advance or exchange.',['d5','e4','c4']);
  if(move.from==='g7'&&move.to==='g6'&&at(after,'f8','b','b')&&w('d4')&&w('e4'))return idea('…g6 clears g7 for the f8 bishop. A possible plan is to fianchetto that bishop and develop before challenging White’s broad center; the setup alone does not make the king safe.',['g6','g7','f8','d4','e4']);
 }
 if(move.color==='b'&&move.piece==='b'&&move.from==='f8'&&move.to==='g7'&&b('g6')&&w('d4')&&w('e4'))return idea('…Bg7 places the bishop on a long diagonal toward the center. A possible purpose is to coordinate with a later central pawn challenge; intervening pawns and pieces still limit the bishop’s reach.',['g7','d4','e4']);
 if(move.color==='w'&&move.piece==='p'){
  if(move.from==='d2'&&move.to==='d4'&&w('e4'))return idea('d4 builds a central pawn pair with e4. White may be seeking space for the pieces, but Black can challenge this center; develop support before advancing the pawns again.',['d4','e4']);
  if(move.from==='e4'&&move.to==='e5'&&b('d5')&&b('e6')&&w('d4'))return idea('e5 gains central space with support from the pawn on d4. A possible plan is to develop behind the pawn chain; its base on d4 may become a target for Black’s counterplay.',['e5','d4','d5','e6']);
  if(move.from==='c2'&&move.to==='c4'&&w('d4')&&b('d5'))return idea('c4 attacks Black’s pawn on d5. White may be trying to challenge the center or open lines for pieces; calculate captures rather than assuming a gambit pawn can always be recovered.',['c4','d4','d5']);
 }
 return;
}
