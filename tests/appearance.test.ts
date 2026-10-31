import {describe,it,expect} from 'vitest';
import {Chess} from 'chess.js';
import {defaults,validateBackup} from '../src/storage';
import {normalizeAppearance,defaultAppearance} from '../src/appearance';
import {animationFor,squareCenter} from '../src/Board';
describe('appearance compatibility',()=>{
 it('upgrades old backups without changing games or practice',()=>{const legacy=defaults();legacy.current.moves=['e2e4','e7e5'];legacy.current.pending=true;legacy.practice=[{id:'italian-1',exerciseId:'italian-1',stage:1,due:'2026-11-01T12:00:00Z',lastSession:'original',missed:false,attempts:2}];delete (legacy.settings as Partial<typeof legacy.settings>).appearance;const restored=validateBackup(legacy);expect(restored.current).toEqual(legacy.current);expect(restored.practice).toEqual(legacy.practice);expect(restored.settings.appearance).toEqual(defaultAppearance);expect(legacy.settings.appearance).toBeUndefined();});
 it('retains mix-and-match appearance in backups',()=>{const d=defaults();d.settings.appearance={board:'aurora',pieces:'galaxy',animations:false,sounds:true};expect(validateBackup(JSON.parse(JSON.stringify(d)))).toEqual(d);});
 it('rejects corrupted preferences',()=>{expect(()=>normalizeAppearance({board:'bogus',pieces:'galaxy',animations:true,sounds:false})).toThrow();expect(()=>normalizeAppearance(null)).toThrow();});
});
describe('interactive board geometry',()=>{
 it('maps annotations correctly in both orientations',()=>{expect(squareCenter('a8',false)).toEqual({x:.5,y:.5});expect(squareCenter('a8',true)).toEqual({x:7.5,y:7.5});expect(squareCenter('h1',true)).toEqual({x:.5,y:.5});});
 it('animates only a verified move between two positions',()=>{const c=new Chess(),before=c.fen();c.move('e4');expect(animationFor(before,c.fen(),'e2e4')?.moves).toEqual([{from:'e2',to:'e4'}]);expect(animationFor(before,c.fen(),'d2d4')).toBeNull();expect(animationFor(c.fen(),before,'e2e4')).toBeNull();});
 it('moves both king and rook for castling',()=>{const c=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'),before=c.fen();c.move('O-O');expect(animationFor(before,c.fen(),'e1g1')?.moves).toEqual([{from:'e1',to:'g1'},{from:'h1',to:'f1'}]);});
});
