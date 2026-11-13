import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {defaults,validateBackup} from '../src/storage';
import {buildFocusedTraining,focusedExercises,focusGroups} from '../src/training';
import {modules} from '../src/lessons';
import {situationExercises} from '../src/situations';
describe('focused practice',()=>{
 it('offers a bounded session for every opening without mixing repertoires',()=>{for(const m of modules.filter(m=>(m.category??'opening')==='opening')){const d=defaults(),s=buildFocusedTraining(d,`opening:${m.id}`);expect(s.items.length).toBeGreaterThanOrEqual(4);expect(s.items.length).toBeLessThanOrEqual(6);expect(s.items.every(i=>i.record.exerciseId?.startsWith(m.id+'-'))).toBe(true);expect(s.label).toBe(m.title);expect(d.training).toBeNull();}});
 it('every situation has unique playable exercises',()=>{for(const g of focusGroups){const s=buildFocusedTraining(defaults(),`situation:${g.id}`);expect(new Set(s.items.map(i=>i.record.id)).size).toBe(s.items.length);expect(s.items.length).toBeGreaterThanOrEqual(4);expect(focusedExercises(`situation:${g.id}`).length).toBeGreaterThanOrEqual(s.items.length);}});
 it('prioritizes due mistakes then less-practiced positions, preserving the game',()=>{const d=defaults(),game=structuredClone(d.current);d.practice=[{id:'italian-8',exerciseId:'italian-8',stage:0,due:'2020-01-01',missed:true,lastSession:'previous',attempts:4}];d.training=buildFocusedTraining(d,'opening:italian');expect(d.training.items[0].record.id).toBe('italian-8');expect(d.training.items[1].record.attempts).toBe(0);expect(d.current).toEqual(game);expect(validateBackup(JSON.parse(JSON.stringify(d)))).toEqual(d);});
 it('does not manufacture exercises for an unknown focus',()=>{expect(()=>buildFocusedTraining(defaults(),'opening:unknown')).toThrow();});
 for(const e of situationExercises)it(`verifies the concrete claim in ${e.id}`,()=>{const c=new Chess(e.fen);const enemyKing=c.board().flat().find(p=>p?.type==='k'&&p.color!==c.turn())!;expect(c.isAttacked(enemyKing.square,c.turn())).toBe(false);if(e.module==='check-responses')expect(c.isCheck()).toBe(true);if(e.module==='promotion-lab'&&e.accepted[0].includes('=R')){const q=new Chess(e.fen);q.move(e.accepted[0].replace('=R','=Q'));expect(q.isStalemate()).toBe(true);}c.move(e.accepted[0]);if(e.module==='mate-one')expect(c.isCheckmate()).toBe(true);if(e.module==='check-responses')expect(c.isCheck()).toBe(false);for(const move of e.continuation)c.move(move);if(e.continuation.at(-1)?.endsWith('#'))expect(c.isCheckmate()).toBe(true);});
});
