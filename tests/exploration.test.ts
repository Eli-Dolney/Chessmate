import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {createStudy,playInStudy,branchOf,studyPosition,addStudyLine,applicableMove,validateStudy} from '../src/exploration';
import {defaults,validateBackup} from '../src/storage';
import {newGame,replay} from '../src/chess';
import {recognizeOpening} from '../src/openings';
import {positionPlans} from '../src/coach';
const root=()=>({initialFen:new Chess().fen(),moves:[] as string[]});
describe('independent exploration',()=>{
 it('branches after stepping backward without deleting the original',()=>{let s=createStudy(root(),'Test');s=playInStudy(s,'e2e4');s=playInStudy(s,'e7e5');const original=branchOf(s).id;s=playInStudy({...s,step:1},'c7c5');expect(s.branches).toHaveLength(2);expect(s.branches.find(b=>b.id===original)?.moves).toEqual(['e2e4','e7e5']);expect(branchOf(s).moves).toEqual(['e2e4','c7c5']);s=playInStudy({...s,step:1},'e7e5');expect(s.branchId).toBe(original);expect(s.branches).toHaveLength(2);});
 it('adds calculated continuations at the cursor and preserves existing lines',()=>{const s=createStudy(root(),'Test',['e2e4','e7e5']);const next=addStudyLine({...s,step:1},['c7c5','g1f3'],'Sicilian');expect(next.branches).toHaveLength(2);expect(next.step).toBe(1);expect(branchOf(next).moves).toEqual(['e2e4','c7c5','g1f3']);});
 it('only applies the first move at the current live decision',()=>{const g=newGame();g.moves=['e2e4'];g.pending=true;const s=createStudy(root(),'Retry',['d2d4','d7d5'],{gameId:g.id,prefix:[]});expect(applicableMove(s,g)).toBe('d2d4');expect(g.moves).toEqual(['e2e4']);expect(applicableMove(s,{...g,pending:false})).toBeUndefined();expect(applicableMove(s,{...g,id:'other'})).toBeUndefined();expect(applicableMove(s,{...g,archived:true})).toBeUndefined();});
 it('retains pre-exploration history for repetition',()=>{const r=root();r.moves=['g1f3','g8f6','f3g1','f6g8'];let s=createStudy(r,'Repeat');for(const m of ['g1f3','g8f6','f3g1','f6g8'])s=playInStudy(s,m);expect(replay(studyPosition(s)).isThreefoldRepetition()).toBe(true);expect(playInStudy(s,'e2e4')).toEqual(s);});
 for(const [name,fen,move,square,piece] of [
  ['castle','r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1','e1g1','f1','r'],
  ['en passant','4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1','e5d6','d6','p'],
  ['underpromotion','7k/P7/8/8/8/8/8/7K w - - 0 1','a7a8n','a8','n']
 ])it(`supports ${name} and exact cursor undo`,()=>{const s=createStudy({initialFen:fen,moves:[]},name),next=playInStudy(s,move);expect(replay(studyPosition(next)).get(square as 'a8')?.type).toBe(piece);expect(replay(studyPosition({...next,step:0})).fen()).toBe(fen);});
 it('migrates version 1 without changing games or appearance',()=>{const d=defaults();const legacy=JSON.parse(JSON.stringify(d));legacy.version=1;delete legacy.settings.coach;delete legacy.explorations;delete legacy.activeExplorationId;const result=validateBackup(legacy);expect(result.version).toBe(2);expect(result.current).toEqual(d.current);expect(result.settings.appearance).toEqual(d.settings.appearance);expect(result.settings.coach.suggestions).toBe(false);});
 it('round-trips saved alternatives and rejects illegal or corrupt cursors',()=>{const d=defaults(),s=createStudy(root(),'Saved',['e2e4','e7e5']);d.explorations=[s];d.activeExplorationId=s.id;expect(validateBackup(JSON.parse(JSON.stringify(d)))).toEqual(d);expect(()=>validateStudy({...s,step:3})).toThrow();expect(()=>validateStudy({...s,branchId:'missing'})).toThrow();s.branches[0].moves=['e2e8'];expect(()=>validateBackup(d)).toThrow();});
 it('recognizes a transposition by position and retains the last named opening',()=>{const c=new Chess();for(const m of ['d4','d5','Nf3','Nf6','Bf4'])c.move(m);const rows=[{eco:'D02',name:'London System',fen:c.fen(),moves:c.history({verbose:true}).map(m=>m.lan)}];const r=root();for(const m of ['g1f3','d7d5','d2d4','g8f6','c1f4'])r.moves.push(m);expect(recognizeOpening(rows,r).exact).toBe(true);r.moves.push('e7e6');expect(recognizeOpening(rows,r)).toEqual({entry:rows[0],exact:false});});
 it('labels strategic advice as conditional principles for either side',()=>{for(const color of ['w','b'] as const){const notes=positionPlans(new Chess().fen(),color);expect(notes.length).toBeGreaterThan(0);expect(notes.every(n=>n.kind==='principle')).toBe(true);}});
});
