import {useEffect,useState} from 'react';
import {positionKey,replay,uciMove} from './chess';
import type {PositionHistory} from './types';

/** A catalog route toward a named opening, not a ranking or a forced sequence. */
export interface OpeningChoice {move:string;name:string;eco:string;line:string[]}
export type OpeningChoiceIndex=Record<string,OpeningChoice[]>;
let loaded:Promise<OpeningChoiceIndex>|undefined;
export function loadOpeningChoices():Promise<OpeningChoiceIndex>{
 return loaded??=import('./data/opening-choices.json').then(m=>m.default);
}
export function useOpeningChoices(enabled:boolean){
 const [index,setIndex]=useState<OpeningChoiceIndex>({}),[error,setError]=useState('');
 useEffect(()=>{
  if(!enabled)return;let alive=true;
  loadOpeningChoices().then(value=>{if(alive)setIndex(value);}).catch(()=>{if(alive)setError('Opening choices could not load. Reload the app to retry.');});
  return()=>{alive=false;};
 },[enabled]);
 return {index,error};
}

/** Preserve real history for draw detection; never replay the catalog's opening prefix. */
export function choicesForPosition(index:OpeningChoiceIndex,position:PositionHistory):OpeningChoice[]{
 try{
  const board=replay(position);if(board.isGameOver())return [];
  const entries=index[positionKey(board.fen())];if(!Array.isArray(entries))return [];
  const legal=new Set(board.moves({verbose:true}).map(move=>move.lan)),seen=new Set<string>();
  const result:OpeningChoice[]=[];
  for(const entry of entries){
   if(!entry||!legal.has(entry.move)||seen.has(entry.move)||typeof entry.name!=='string'||typeof entry.eco!=='string'||!Array.isArray(entry.line)||entry.line[0]!==entry.move||entry.line.length>20)continue;
   try{
    const continuation=replay(position),line:string[]=[];
    for(const move of entry.line){
     if(continuation.isGameOver())break;
     if(typeof move!=='string'||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move))throw new Error('Invalid catalog move.');
     uciMove(continuation,move);line.push(move);
    }
    if(line.length){result.push({move:entry.move,name:entry.name,eco:entry.eco,line});seen.add(entry.move);}
   }catch{/* A corrupt route is omitted; free legal exploration stays available. */}
  }
  return result;
 }catch{return [];}
}
