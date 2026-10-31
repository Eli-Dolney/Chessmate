import {describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {Chess} from 'chess.js';
import {exercises,modules,recognizedLessons} from '../src/lessons';
import {newGame,replay,uciMove,positionKey,resultLabel} from '../src/chess';
import {explainMove,inspectPosition} from '../src/coach';
import {defaults,saveData,loadData,validateBackup,schedule,isDue,importPgn} from '../src/storage';
import type {PracticeRecord} from '../src/types';
describe('opening curriculum',()=>{
 it('preserves original lessons and adds the balanced curriculum',()=>{expect(modules).toHaveLength(18);expect(new Set(exercises.map(e=>e.id)).size).toBe(84);for(const m of modules)expect(exercises.filter(e=>e.module===m.id)).toHaveLength(['italian','caro','qgd'].includes(m.id)?8:4);});
 for(const e of exercises)it(`${e.id}: solution and continuation are legal`,()=>{for(const answer of e.accepted){const c=new Chess(e.fen);expect(c.move(answer)).toBeTruthy();for(const move of e.continuation)expect(c.move(move)).toBeTruthy();}expect(recognizedLessons(e.fen).some(x=>x.id===e.id)).toBe(true);});
 it('recognizes a transposed board independent of move clocks',()=>{const a=new Chess();for(const s of ['Nf3','d5','d4','Nf6','c4','e6','Nc3','Be7','Bg5','O-O','e3'])a.move(s);expect(recognizedLessons(a.fen()).some(e=>e.id==='qgd-5')).toBe(true);});
});
describe('rules and history',()=>{
 it('castles and can undo exactly',()=>{const c=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');const before=c.fen();uciMove(c,'e1g1');expect(c.get('f1')?.type).toBe('r');c.undo();expect(c.fen()).toBe(before);});
 it('handles en passant',()=>{const c=new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');uciMove(c,'e5d6');expect(c.get('d5')).toBeUndefined();expect(c.get('d6')?.color).toBe('w');});
 it('underpromotes',()=>{const c=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');uciMove(c,'a7a8n');expect(c.get('a8')?.type).toBe('n');});
 it('detects mate and stalemate',()=>{expect(resultLabel(new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1'))).toContain('checkmate');expect(resultLabel(new Chess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1'))).toContain('stalemate');});
 it('preserves repetition through saved move history',()=>{const g=newGame();g.moves=['g1f3','g8f6','f3g1','f6g8','g1f3','g8f6','f3g1','f6g8'];expect(replay(g).isThreefoldRepetition()).toBe(true);});
});
describe('honest coaching',()=>{
 it('does not count an absolutely pinned defender as a legal recapture',()=>{const fen='4k3/4n3/8/3N4/8/8/8/4R1K1 b - - 0 1';const notes=inspectPosition(fen,'w');expect(notes.some(n=>n.text.includes('knight on e7'))).toBe(false);});
 it('describes poisoned captures without declaring free material',()=>{const c=new Chess();for(const s of ['e4','e5','Nf3','Nc6','Bc4','Nd4'])c.move(s);const notes=explainMove(c.fen(),'f3e5');expect(notes.some(n=>n.text.includes('Whether the exchange works depends on the replies'))).toBe(true);expect(notes.every(n=>!n.text.includes('wins a pawn'))).toBe(true);});
 it('identifies an absolute pin with concrete squares',()=>{const fen='4k3/8/2n5/8/B7/8/8/4K3 w - - 0 1';const notes=explainMove(fen,'a4b5');expect(notes.some(n=>n.text.includes('pinned to its king')&&n.squares?.includes('c6'))).toBe(true);});
 it('identifies forks for both colors without promising a win',()=>{const white='r3r1k1/8/8/3N4/8/8/8/6K1 w - - 0 1';const black='6k1/8/8/8/3n4/8/8/R3R1K1 b - - 0 1';for(const [fen,move] of [[white,'d5c7'],[black,'d4c2']])expect(explainMove(fen,move).some(n=>n.text.includes('fork pattern')&&n.text.includes('check whether it wins'))).toBe(true);});
 it('teaches a sound defense to the Shilling trap',()=>{const e=exercises.find(e=>e.id==='italian-7')!;expect(e.accepted).toContain('Nxd4');expect(e.explanation).toContain('Qg5');});
});
describe('persistence and scheduling',()=>{
 it('round-trips all data through IndexedDB',async()=>{const d=defaults();d.current.moves=['e2e4','e7e5'];await saveData(d);expect(await loadData()).toEqual(d);});
 it('rejects malformed backups and illegal histories',()=>{expect(()=>validateBackup({version:9})).toThrow();const d=defaults();d.current.moves=['e2e8'];expect(()=>validateBackup(d)).toThrow();});
 it('supports 1, 3, 7, 14 day spacing and next-session misses',()=>{const now=new Date('2026-10-30T12:00:00Z');let p:PracticeRecord={id:'x',exerciseId:'italian-1',stage:0,due:now.toISOString(),lastSession:'',missed:false,attempts:0};for(const days of [1,3,7,14,14]){p=schedule(p,true,'a',now);expect(Date.parse(p.due)-Number(now)).toBe(days*86400000);}p=schedule(p,false,'a',now);expect(isDue(p,'a',now)).toBe(false);expect(isDue(p,'b',now)).toBe(true);});
 it('imports PGN including setup positions and rejects invalid moves',()=>{const g=importPgn('1. e4 e5 2. Nf3 *');expect(g.moves).toEqual(['e2e4','e7e5','g1f3']);const custom=importPgn('[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]\n\n1. a8=N *');expect(replay(custom).get('a8')?.type).toBe('n');expect(()=>importPgn('1. e5')).toThrow();});
});
