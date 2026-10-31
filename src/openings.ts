import {useEffect,useState} from 'react';
import {Chess} from 'chess.js';
import {positionKey,uciMove} from './chess';
import type {PositionHistory} from './types';
export interface OpeningEntry {eco:string;name:string;fen:string;moves:string[]}
let loaded:Promise<OpeningEntry[]>|undefined;
export function loadOpenings(){return loaded??=import('./data/openings.json').then(m=>m.default);}
export function useOpenings(enabled=true){const [rows,setRows]=useState<OpeningEntry[]>([]),[error,setError]=useState('');useEffect(()=>{if(!enabled)return;let alive=true;loadOpenings().then(r=>{if(alive)setRows(r);}).catch(()=>{if(alive)setError('Opening catalog could not load. Reload the app to retry.');});return()=>{alive=false;};},[enabled]);return {rows,error};}
const indexes=new WeakMap<OpeningEntry[],Map<string,OpeningEntry[]>>();
export function recognizeOpening(rows:OpeningEntry[],position:PositionHistory){
 let index=indexes.get(rows);if(!index){index=new Map();for(const row of rows){const key=positionKey(row.fen);index.set(key,[...(index.get(key)??[]),row]);}indexes.set(rows,index);}
 const c=new Chess(position.initialFen);let found=index.get(positionKey(c.fen()))?.[0],exact=!!found;
 for(const m of position.moves){uciMove(c,m);const hit=index.get(positionKey(c.fen()))?.[0];exact=!!hit;if(hit)found=hit;}
 return {entry:found,exact};
}
export const openingPlans:[RegExp,string,string][]=[
 [/Italian|Giuoco|Two Knights/i,'italian','White develops toward f7 and prepares central play. Black develops, protects e5, and looks for a well-timed …d5.'],
 [/Caro-Kann/i,'caro','Black challenges e4 with …d5 and often develops the light-squared bishop before …e6. White can gain space or exchange centrally; Black must attack the pawn center rather than remain passive.'],
 [/Queen.s Gambit Declined|Semi-Slav/i,'qgd','Black supports d5 with …e6 and develops before challenging with …c5 or …e5. White uses central space and pressure on d5; the exact pawn structure determines the plan.'],
 [/Ruy Lopez|Spanish/i,'ruy','White pressures the defender of e5 and prepares c3 and d4. Black develops, safeguards e5, and seeks …d5 when prepared. The e5 pawn is not automatically free.'],
 [/Scotch/i,'scotch','White opens the center with d4 and gains active piece play. Black develops rapidly and contests the open lines; count attackers before taking central pawns.'],
 [/Sicilian/i,'sicilian','Black exchanges a flank pawn for central influence and often works on the c-file. White develops quickly and can attack with more central space; king safety matters before pawn storms.'],
 [/French/i,'french','Black challenges the center with …d5 and often …c5. White gains space with e5 or simplifies with exchanges; both sides should attack the base of a pawn chain.'],
 [/Scandinavian/i,'scandinavian','Black challenges e4 immediately, then develops after the center opens. White can gain time against an exposed queen; Black must choose safe squares and complete development.'],
 [/London/i,'london','White develops Bf4 before e3 and supports a central setup. Black contests d4 with …c5 and can pressure b2; White should adjust to threats rather than repeat moves automatically.'],
 [/Queen.s Gambit Accepted/i,'qga','Black temporarily gives up d5 by taking on c4 and develops toward a later central challenge. White builds the center and recovers the pawn; Black need not cling to it.'],
 [/Slav/i,'slav','Black supports d5 with …c6 and keeps the light-squared bishop available. White pressures the center and seeks useful breaks; Black should choose when to develop the bishop or exchange on c4.'],
 [/King.s Indian/i,'kingsindian','Black develops a fianchetto and later challenges White’s broad center with …e5 or …c5. White uses space while watching those breaks; neither side should start an attack without preparation.']
];
export function planForOpening(name:string){return openingPlans.find(([pattern])=>pattern.test(name));}
