import type {ReactNode} from 'react';
import type {PieceSymbol} from 'chess.js';

const futuristic:Record<PieceSymbol,ReactNode>={
 p:<><path d="M22.5 5l6 6-6 6-6-6zM19 19h7l-1 9 6 6H14l6-6zM12 36h21v4H12z"/></>,
 r:<><path d="M10 7h7v7h4V7h4v7h4V7h6v13l-6 5 2 9H14l2-9-6-5zM11 36h24v4H11z"/></>,
 n:<><path d="M12 34l3-11 9-7-8 2-6-4 10-10 10 6 5 12-3 12zM11 36h24v4H11z"/><path d="M22 12h5" fill="none"/></>,
 b:<><path d="M22.5 4l9 13-9 8-9-8zM20 26h5l5 8H15zM12 36h21v4H12z"/><path d="M25 11l-5 9" fill="none"/></>,
 q:<><path d="M9 9l9 12 4.5-17L27 21 36 9l-6 24H15zM11 36h23v4H11z"/></>,
 k:<><path d="M22.5 2v12M17 7h11" fill="none" strokeWidth="2.7"/><path d="M14 15h17l4 7-8 11h-9l-8-11zM12 36h21v4H12z"/></>
};
export default function RoomPiece({type,white,finish,id,shape}:{type:PieceSymbol;white:boolean;finish:'wood'|'frosted'|'metal'|'future';id:string;shape:ReactNode}){
 const colors=finish==='wood'?(white?['#ffe1a6','#b97736','#eabf7e']:['#ad7144','#352018','#754526']):finish==='metal'?(white?['#fff','#8191a0','#e4ecf3']:['#b8a58a','#292e35','#777062']):finish==='frosted'?(white?['#ffffff','#b3e7f2','#e6faff']:['#729eae','#173c51','#4a7487']):(white?['#d5fff2','#5bcdbd','#effffb']:['#cebcff','#30204e','#7461ab']);
 const stroke=white?(finish==='frosted'?'#547889':'#503b2c'):(finish==='wood'?'#e0ad73':'#c9dce9');
 return <svg viewBox="0 0 45 45" aria-hidden="true" className={`piece ${white?'w':'b'} finish-${finish}`}>
  <defs><linearGradient id={`${id}-finish`} x1="0" y1="0" x2="1" y2=".3"><stop stopColor={colors[0]}/><stop offset=".48" stopColor={colors[1]}/><stop offset=".7" stopColor={colors[2]}/><stop offset="1" stopColor={colors[1]}/></linearGradient><pattern id={`${id}-grain`} width="45" height="45" patternUnits="userSpaceOnUse"><rect width="45" height="45" fill={`url(#${id}-finish)`}/>{finish==='wood'&&<g fill="none" stroke={white?'#7d452b':'#efbd6f'} strokeWidth=".5" opacity=".38">{[8,14,20,26,32,38].map(x=><path key={x} d={`M${x} 0q-5 10 0 20t0 25`}/>)}</g>}</pattern></defs>
  <g fill={`url(#${id}-grain)`} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">{finish==='future'?futuristic[type]:shape}</g>
  <path d="M15 37h15" stroke={white?'#fff':'#e5ceff'} opacity=".8" strokeWidth=".8"/>
 </svg>;
}
