import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { extraExercises, extraModules } from '../src/expandedLessons';

function exercise(id:string){const e=extraExercises.find(e=>e.id===id);if(!e)throw new Error(`Missing ${id}`);return e;}
function solution(id:string){const e=exercise(id),board=new Chess(e.fen);board.move(e.accepted[0]);return board;}

describe('expanded authored curriculum',()=>{
  it('has nine opening and six foundation modules, with four exercises each',()=>{
    expect(extraModules.filter(m=>m.category==='opening')).toHaveLength(9);
    expect(extraModules.filter(m=>m.category==='foundation')).toHaveLength(6);
    expect(extraExercises).toHaveLength(60);
    expect(new Set(extraExercises.map(e=>e.id)).size).toBe(60);
    for(const module of extraModules)expect(extraExercises.filter(e=>e.module===module.id)).toHaveLength(4);
  });
  for(const e of extraExercises)it(`${e.id}: all accepted moves and the authored line are legal`,()=>{
    for(const accepted of e.accepted){const board=new Chess(e.fen);expect(board.isGameOver()).toBe(false);expect(board.move(accepted)).toBeTruthy();}
    const board=new Chess(e.fen);for(const san of [e.accepted[0],...e.continuation])expect(board.move(san)).toBeTruthy();
  });
  it('the knight defender cannot legally recapture through an absolute pin',()=>{
    const board=solution('forks-pins-3');
    expect(board.moves()).not.toContain('Nxd5');
    expect(board.get('d5')).toEqual({type:'b',color:'w'});
  });
  it('the fork fixtures check the king for either color',()=>{
    expect(solution('forks-pins-1').isCheck()).toBe(true);
    expect(solution('forks-pins-2').isCheck()).toBe(true);
  });
  it('the early Sicilian e6 defense removes the bishop support for Qxf7',()=>{
    const board=solution('sicilian-4');board.move('Qxf7+');
    expect(board.moves()).toContain('Kxf7');
  });
  it('the London defense makes the knight-fork attacker answer check first',()=>{
    const board=solution('london-4');expect(board.isCheck()).toBe(true);
    expect(board.moves()).not.toContain('Nxc7+');
  });
  it('the protected pawn can recapture the greedy bishop',()=>{
    const board=new Chess(exercise('calculation-2').fen);board.move('Bxd5');
    expect(board.moves()).toContain('exd5');
  });
  it('the claimed mating captures and heavy-piece mates are checkmate',()=>{
    for(const id of ['calculation-4','endgames-1','endgames-2'])expect(solution(id).isCheckmate()).toBe(true);
  });
  it('queen promotion stalemates but rook promotion gives a forced two-move mate',()=>{
    const e=exercise('endgames-4'),queen=new Chess(e.fen);queen.move('c8=Q');expect(queen.isStalemate()).toBe(true);
    const rook=solution(e.id);expect(rook.isGameOver()).toBe(false);expect(rook.moves()).toEqual(['Ka6']);
    for(const san of e.continuation)rook.move(san);expect(rook.isCheckmate()).toBe(true);
  });
  it('the h-pawn flight square prevents the demonstrated back-rank mate',()=>{
    const board=solution('threats-4');board.move('Re8+');expect(board.moves()).toContain('Kh7');
    board.move('Kh7');expect(board.isCheck()).toBe(false);
  });
});
