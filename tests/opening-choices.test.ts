import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import data from '../src/data/opening-choices.json';
import {choicesForPosition,type OpeningChoice,type OpeningChoiceIndex} from '../src/openingChoices';
import {positionKey,replay,uciMove} from '../src/chess';
import type {PositionHistory} from '../src/types';
const index:OpeningChoiceIndex=data;
function position(san:string[]):PositionHistory{
 const board=new Chess();for(const move of san)board.move(move);
 return {initialFen:new Chess().fen(),moves:board.history({verbose:true}).map(move=>move.lan)};
}
function fixture(fen:string,choices:OpeningChoice[]):OpeningChoiceIndex{return {[positionKey(fen)]:choices};}
const choice=(move:string,line=[move]):OpeningChoice=>({move,line,name:'Reference position',eco:'A00'});

describe('local opening choices from the visible position',()=>{
 it('offers distinct legal defenses after e4 without replaying White’s first move',()=>{
  const choices=choicesForPosition(index,position(['e4']));
  for(const [move,name] of [['c7c6','Caro-Kann'],['e7e6','French'],['c7c5','Sicilian'],['d7d5','Scandinavian'],['e7e5','King']]){
   const row=choices.find(c=>c.move===move);expect(row).toBeDefined();expect(row!.name).toContain(name);expect(row!.line[0]).toBe(move);
  }
  expect(new Set(choices.map(c=>c.move)).size).toBe(choices.length);
 });
 it('offers both central and knight defenses against d4',()=>{
  const choices=choicesForPosition(index,position(['d4']));
  expect(choices.map(c=>c.move)).toEqual(expect.arrayContaining(['d7d5','g8f6','e7e6']));
 });
 it('follows the new position after a defense instead of retaining old candidates',()=>{
  const choices=choicesForPosition(index,position(['e4','c6']));
  expect(choices.map(c=>c.move)).toContain('d2d4');expect(choices.some(c=>c.move==='c7c5')).toBe(false);
 });
 it('recognizes transposed move orders by board state',()=>{
  const a=position(['d4','d5','Nf3','Nf6']),b=position(['Nf3','Nf6','d4','d5']);
  expect(positionKey(replay(a).fen())).toBe(positionKey(replay(b).fen()));
  const choices=choicesForPosition(index,a);expect(choices.length).toBeGreaterThan(0);expect(choicesForPosition(index,b)).toEqual(choices);
 });
 it('returns no named choices outside the indexed positions',()=>{
  expect(choicesForPosition(index,position(['a3','h6','h3','a6','Ra2','Ra7']))).toEqual([]);
 });
 it('retains castling rights in the lookup key',()=>{
  const fen='r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',catalog=fixture(fen,[choice('e1g1')]);
  expect(choicesForPosition(catalog,{initialFen:fen,moves:[]})).toHaveLength(1);
  expect(choicesForPosition(catalog,{initialFen:fen.replace('KQkq','kq'),moves:[]})).toEqual([]);
 });
 it('retains en passant availability in the lookup key',()=>{
  const fen='4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',catalog=fixture(fen,[choice('e5d6')]);
  expect(choicesForPosition(catalog,{initialFen:fen,moves:[]})).toHaveLength(1);
  expect(choicesForPosition(catalog,{initialFen:fen.replace('d6','-'),moves:[]})).toEqual([]);
 });
 it('uses complete game history to suppress repeated terminal positions',()=>{
  const repeated=position(['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8']);
  expect(index[positionKey(replay(repeated).fen())].length).toBeGreaterThan(0);
  expect(choicesForPosition(index,repeated)).toEqual([]);
 });
 it('stops for the fifty-move rule even when the board key is indexed',()=>{
  const initialFen=new Chess().fen().replace('0 1','100 51');
  expect(choicesForPosition(index,{initialFen,moves:[]})).toEqual([]);
 });
 it('suppresses terminal checkmate and stalemate entries',()=>{
  for(const fen of ['7k/6Q1/5K2/8/8/8/8/8 b - - 0 1','7k/5Q2/6K1/8/8/8/8/8 b - - 0 1']){
   expect(choicesForPosition(fixture(fen,[choice('h8g8')]),{initialFen:fen,moves:[]})).toEqual([]);
  }
 });
 it('rejects malformed or illegal routes and deduplicates legal choices',()=>{
  const root=position([]),fen=replay(root).fen();
  const catalog=fixture(fen,[choice('e2e8'),choice('e2e4',['d2d4']),choice('e2e4',['e2e4','e2e3']),choice('e2e4'),choice('e2e4',['e2e4','e7e5']),choice('d2d4')]);
  expect(choicesForPosition(catalog,root).map(c=>c.move)).toEqual(['e2e4','d2d4']);
  expect(choicesForPosition({[positionKey(fen)]:null} as unknown as OpeningChoiceIndex,root)).toEqual([]);
  expect(choicesForPosition(index,{initialFen:'not a FEN',moves:[]})).toEqual([]);
 });
 it('truncates a route when actual history reaches repetition sooner than the reference',()=>{
  const root=position(['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1']),fen=replay(root).fen();
  const catalog=fixture(fen,[choice('f6g8',['f6g8','e2e4'])]);
  expect(choicesForPosition(catalog,root)[0].line).toEqual(['f6g8']);
 });
 it('does not mutate the game or shared catalog when returning a choice',()=>{
  const root=position(['e4']),before=structuredClone(root),choices=choicesForPosition(index,root);
  const again=choicesForPosition(index,root);choices[0].line.push('a1a8');choices[0].name='Changed';
  expect(choicesForPosition(index,root)).toEqual(again);expect(root).toEqual(before);
 });
 it('stores only legal, deduplicated reference continuations throughout the bundled index',()=>{
  let total=0;
  for(const [fen,choices] of Object.entries(index)){
   expect(new Set(choices.map(c=>c.move)).size).toBe(choices.length);
   for(const row of choices){
    expect(row.line.length).toBeGreaterThan(0);expect(row.line.length).toBeLessThanOrEqual(20);expect(row.line[0]).toBe(row.move);
    const board=new Chess(`${fen} 0 1`);for(const move of row.line)expect(uciMove(board,move)).toBeTruthy();
    total++;
   }
  }
  expect(total).toBeGreaterThan(8000);
 },15000);
});
