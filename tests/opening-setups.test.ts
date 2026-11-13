import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {openingMovePurpose,openingSetupFor} from '../src/openingSetups';
function board(moves:string[]){const c=new Chess();for(const move of moves)c.move(move);return c;}
function purpose(prefix:string[],san:string){const before=board(prefix),after=new Chess(before.fen()),move=after.move(san);return openingMovePurpose(before,after,move);}

describe('opening setup explanations grounded in the current board',()=>{
 it('explains both sides of the c6 and e6 preparations against e4',()=>{
  for(const defense of ['c6','e6']){
   const c=board(['e4',defense]);
   const black=openingSetupFor(c,'b')!,white=openingSetupFor(c,'w')!;
   expect(black.kind).toBe('principle');expect(black.text).toContain('d5');expect(black.squares).toContain(defense);
   expect(white.text).toContain('challenge');expect(white.squares).toContain('e4');
  }
 });
 it('describes the d4 target for both sides after c5 and does not promise a gain',()=>{
  const c=board(['e4','c5']);
  for(const color of ['w','b'] as const){const idea=openingSetupFor(c,color)!;expect(idea.text).toContain('d4');expect(idea.text).toContain('Consider');expect(idea.squares).toEqual(expect.arrayContaining(['c5','e4']));}
 });
 it('describes the actual e6 or c6 support in queen-pawn structures',()=>{
  for(const defense of ['e6','c6']){
   const c=board(['d4','d5','c4',defense]);
   for(const color of ['w','b'] as const){const idea=openingSetupFor(c,color)!;expect(idea.text).toContain(defense);expect(idea.squares).toEqual(expect.arrayContaining(['d5','c4']));}
  }
 });
 it('connects a closed center to its d4 base and suppresses obsolete preparation',()=>{
  const c=board(['e4','e6','d4','d5','e5']);
  expect(openingSetupFor(c,'b')?.text).toContain('…c5');expect(openingSetupFor(c,'w')?.text).toContain('base on d4');
  c.move('c5');expect(openingSetupFor(c,'b')?.text).toContain('c5 pawn attacks');expect(openingSetupFor(c,'b')?.text).not.toContain('preparing …c5');
 });
 it('explains both sides of a fianchetto against a broad center',()=>{
  const c=board(['d4','Nf6','c4','g6','e4','Bg7']);
  expect(openingSetupFor(c,'b')?.text).toContain('bishop on g7');expect(openingSetupFor(c,'w')?.text).toContain('fianchetto');
  expect(openingSetupFor(c,'b')?.squares).toContain('g7');
  const note=purpose(['d4','Nf6','c4','g6','e4'],'Bg7');expect(note?.text).toContain('intervening');
 });
 it('does not keep an obsolete named setup after pawn exchanges or advances',()=>{
  expect(openingSetupFor(board(['d4','d5','c4','e6','cxd5','exd5']),'b')).toBeUndefined();
  expect(openingSetupFor(board(['e4','c6','d4','d5','e5','c5']),'b')).toBeUndefined();
  expect(openingSetupFor(board(['e4','c6','d4','d5','e5','c5']),'w')).toBeUndefined();
 });
 it('limits setup advice to early, substantially occupied positions with queens',()=>{
  const c=board(['e4','c6']);
  expect(openingSetupFor(new Chess(c.fen().replace(/\d+$/,'16')),'b')).toBeUndefined();
  c.remove('d8');expect(openingSetupFor(c,'b')).toBeUndefined();
  const sparse=new Chess('3qk3/3p4/2p5/8/4P3/8/8/3QK3 w - - 0 2');expect(openingSetupFor(sparse,'b')).toBeUndefined();
  expect(openingSetupFor(board(['f3','e5','g4','Qh4#']),'w')).toBeUndefined();
 });
 it('explains the specific preparation or central challenge actually played',()=>{
  for(const [prefix,san,phrase] of [
   [['e4'],'c6','prepare …d5'],[['e4'],'e6','possible pawn advance to d5'],[['e4'],'c5','attacks d4'],[['e4'],'d5','e4 and c4'],
   [['d4','Nf6','e4'],'g6','clears g7'],[['e4','e6'],'d4','central pawn pair'],[['e4','e6','d4','d5'],'e5','base on d4'],[['d4','d5'],'c4','attacks Black’s pawn on d5']
  ] as [string[],string,string][]){const note=purpose(prefix,san);expect(note?.kind).toBe('principle');expect(note?.text).toContain(phrase);}
 });
 it('requires matching move states and leaves captures and unknown moves to generic coaching',()=>{
  const before=board(['e4']),after=new Chess(before.fen()),move=after.move('c6');
  expect(openingMovePurpose(new Chess(),after,move)).toBeUndefined();
  expect(openingMovePurpose(before,new Chess(),move)).toBeUndefined();
  expect(purpose(['e4','d5'],'exd5')).toBeUndefined();
  expect(purpose(['e4'],'a6')).toBeUndefined();
  expect(purpose(['e4','e5','Nf3','Nc6'],'Bc4')).toBeUndefined();
 });
 it('returns fresh evidence without modifying the inspected boards',()=>{
  const before=board(['e4']),after=new Chess(before.fen()),move=after.move('c6'),original=[before.fen(),after.fen()];
  const idea=openingSetupFor(after,'b')!;idea.squares!.push('a8');
  expect(openingSetupFor(after,'b')?.squares).not.toContain('a8');openingMovePurpose(before,after,move);
  expect([before.fen(),after.fen()]).toEqual(original);
 });
});
