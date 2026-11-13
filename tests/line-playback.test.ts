import {describe,it,expect,vi} from 'vitest';
import {Chess} from 'chess.js';
import {buildContinuation} from '../src/linePlayback';
import {replay} from '../src/chess';
import type {Analysis,PositionHistory} from '../src/types';

const opening=['e2e4','e7e5','g1f3','b8c6','f1b5','a7a6','b5a4','g8f6','e1g1','f8e7','f1e1','b7b5','a4b3','d7d6','c2c3','e8g8','h2h3','c6b8','d2d4','b8d7','b1d2','c7c5','d4d5','c5c4'];
const root=():PositionHistory=>({initialFen:new Chess().fen(),moves:[]});
const result=(p:PositionHistory,pv:string[]):Analysis=>({fen:replay(p).fen(),elapsed:1000,lines:pv.length?[{move:pv[0],pv,depth:15,cp:0}]:[]});
describe('long possible continuations',()=>{
 for(const limit of [10,20] as const)it(`extends short engine lines to exactly ${limit} plies, preserving full history`,async()=>{
  const position=root();position.moves=opening.slice(0,3);const seed=opening.slice(3,4),before=structuredClone({position,seed}),progress:number[]=[];
  const analyze=vi.fn(async(p:PositionHistory)=>result(p,opening.slice(p.moves.length,p.moves.length+2)));
  const moves=await buildContinuation(position,seed,limit,analyze,()=>true,n=>progress.push(n));
  expect(moves).toEqual(opening.slice(3,3+limit));expect(progress).toEqual(Array.from({length:limit},(_,i)=>i+1));
  for(const [p] of analyze.mock.calls){expect(p.initialFen).toBe(position.initialFen);expect(p.moves).toEqual(opening.slice(0,p.moves.length));}
  expect({position,seed}).toEqual(before);expect(()=>replay({initialFen:position.initialFen,moves:[...position.moves,...moves]})).not.toThrow();
 });
 it('bounds an overlong seed without another search',async()=>{
  const analyze=vi.fn();expect(await buildContinuation(root(),opening,10,analyze,()=>true,()=>{})).toEqual(opening.slice(0,10));expect(analyze).not.toHaveBeenCalled();
 });
 it('stops at mate rather than consuming a longer engine line',async()=>{
  const position=root();position.moves=['f2f3','e7e5','g2g4'];const analyze=vi.fn(async(p:PositionHistory)=>result(p,['d8h4','a2a3']));
  expect(await buildContinuation(position,[],20,analyze,()=>true,()=>{})).toEqual(['d8h4']);expect(analyze).toHaveBeenCalledTimes(1);
 });
 for(const [name,fen] of [
  ['stalemate','7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'],
  ['insufficient material','7k/8/8/8/8/8/8/K7 w - - 0 1'],
 ])it(`does not search an already ended ${name} position`,async()=>{
  const analyze=vi.fn();expect(await buildContinuation({initialFen:fen,moves:[]},[],10,analyze,()=>true,()=>{})).toEqual([]);expect(analyze).not.toHaveBeenCalled();
 });
 it('uses the root history to stop on threefold repetition',async()=>{
  const cycle=['g1f3','g8f6','f3g1','f6g8'],position=root();position.moves=[...cycle];
  const analyze=vi.fn(async(p:PositionHistory)=>result(p,[...cycle,'e2e4']));
  const moves=await buildContinuation(position,[],20,analyze,()=>true,()=>{});expect(moves).toEqual(cycle);expect(replay({...position,moves:[...position.moves,...moves]}).isThreefoldRepetition()).toBe(true);expect(analyze).toHaveBeenCalledTimes(1);
 });
 it('honors promotion and stops at the resulting insufficient material',async()=>{
  const analyze=vi.fn();expect(await buildContinuation({initialFen:'7k/P7/8/8/8/8/8/7K w - - 0 1',moves:[]},['a7a8n'],20,analyze,()=>true,()=>{})).toEqual(['a7a8n']);expect(analyze).not.toHaveBeenCalled();
 });
 it('rejects cancellation both before starting and after an asynchronous search',async()=>{
  const analyze=vi.fn();await expect(buildContinuation(root(),[],10,analyze,()=>false,()=>{})).rejects.toMatchObject({name:'AbortError'});expect(analyze).not.toHaveBeenCalled();
  let current=true;const progress=vi.fn();await expect(buildContinuation(root(),[],10,async p=>{current=false;return result(p,opening);},()=>current,progress)).rejects.toMatchObject({name:'AbortError'});expect(progress).not.toHaveBeenCalled();
 });
 it('rejects stale state even when it changes during the last progress callback',async()=>{
  let current=true;await expect(buildContinuation(root(),opening,10,vi.fn(),()=>current,n=>{if(n===10)current=false;})).rejects.toMatchObject({name:'AbortError'});
 });
 it('rejects illegal selected and engine moves without mutating input',async()=>{
  const position=root(),seed=['e2e5'];await expect(buildContinuation(position,seed,10,vi.fn(),()=>true,()=>{})).rejects.toThrow('selected line contains an illegal move');expect(position.moves).toEqual([]);expect(seed).toEqual(['e2e5']);
  await expect(buildContinuation(position,[],10,async p=>result(p,['e2e5']),()=>true,()=>{})).rejects.toThrow('calculated line contains an illegal move');
 });
 it('fails clearly on empty or mismatched analysis instead of looping',async()=>{
  const empty=vi.fn(async(p:PositionHistory)=>result(p,[]));await expect(buildContinuation(root(),[],10,empty,()=>true,()=>{})).rejects.toThrow('no continuation');expect(empty).toHaveBeenCalledTimes(1);
  await expect(buildContinuation(root(),[],10,async p=>({...result(p,opening),fen:'different'}),()=>true,()=>{})).rejects.toThrow('different position');
 });
 it('can extend with a lone bestmove when the engine omits its PV',async()=>{
  const analyze=vi.fn(async(p:PositionHistory)=>({...result(p,[]),bestmove:opening[p.moves.length]}));expect(await buildContinuation(root(),[],10,analyze,()=>true,()=>{})).toEqual(opening.slice(0,10));expect(analyze).toHaveBeenCalledTimes(10);
 });
});
