import {Chess} from 'chess.js';
import {replay,uciMove} from './chess';
import type {Exploration,GameSession,PositionHistory} from './types';

export function branchOf(study:Exploration){return study.branches.find(b=>b.id===study.branchId)!;}
export function studyPosition(study:Exploration):PositionHistory {
 return {initialFen:study.root.initialFen,moves:[...study.root.moves,...branchOf(study).moves.slice(0,study.step)]};
}
export function createStudy(root:PositionHistory,label:string,pv:string[]=[],source?:Exploration['source']):Exploration{
 const board=replay(root);for(const move of pv)uciMove(board,move);
 const id=crypto.randomUUID(),branchId=crypto.randomUUID();
 return {id,root:structuredClone(root),label,source,branches:[{id:branchId,label:pv.length?'Suggested line':'My line',moves:[...pv]}],branchId,step:0};
}
export function playInStudy(study:Exploration,move:string):Exploration {
 const board=replay(studyPosition(study));if(board.isGameOver())return study;uciMove(board,move);
 const branch=branchOf(study),prefix=branch.moves.slice(0,study.step),moves=[...prefix,move];
 if(branch.moves[study.step]===move)return {...study,step:study.step+1};
 // Reuse a saved continuation when the same prefix is played again.
 const existing=study.branches.find(b=>moves.every((m,i)=>b.moves[i]===m));
 if(existing)return {...study,branchId:existing.id,step:moves.length};
 if(study.step===branch.moves.length){return {...study,step:moves.length,branches:study.branches.map(b=>b.id===branch.id?{...b,moves}:b)};}
 if(study.branches.length>=200)throw new Error('This exploration has 200 alternatives. Start another exploration to keep experimenting.');
 const id=crypto.randomUUID();return {...study,branchId:id,step:moves.length,branches:[...study.branches,{id,label:`Alternative ${study.branches.length+1}`,moves}]};
}
export function addStudyLine(study:Exploration,pv:string[],label:string):Exploration{
 const board=replay(studyPosition(study));for(const move of pv)uciMove(board,move);
 const moves=[...branchOf(study).moves.slice(0,study.step),...pv];
 const existing=study.branches.find(b=>b.moves.join(' ')===moves.join(' '));
 if(existing)return {...study,branchId:existing.id};
 if(study.branches.length>=200)throw new Error('This exploration has 200 alternatives. Start another exploration to continue.');
 const id=crypto.randomUUID();return {...study,branchId:id,branches:[...study.branches,{id,label,moves}]};
}
export function applicableMove(study:Exploration,game:GameSession):string|undefined{
 const source=study.source,first=branchOf(study).moves[0];
 if(!source||!first||source.gameId!==game.id||game.archived)return;
 const count=game.moves.length-(game.pending?1:0),prefix=game.moves.slice(0,count);
 if(source.prefix.join(' ')!==prefix.join(' ')||study.root.initialFen!==game.initialFen||study.root.moves.join(' ')!==prefix.join(' '))return;
 const board=replay(study.root);if(board.turn()!==game.player||board.isGameOver())return;
 try{uciMove(board,first);return first;}catch{return;}
}
export function validateStudy(s:Exploration){
 if(!s||typeof s.id!=='string'||typeof s.label!=='string'||!s.root||!Array.isArray(s.root.moves)||s.root.moves.length>2000||!Array.isArray(s.branches)||!s.branches.length||s.branches.length>200)throw new Error('Invalid exploration.');
 const root=replay(s.root),ids=new Set<string>();
 if(s.originalMove!==undefined){if(typeof s.originalMove!=='string'||!s.branches.some(b=>b.moves?.[0]===s.originalMove))throw new Error('Invalid original move.');uciMove(replay(s.root),s.originalMove);}
 for(const b of s.branches){if(!b||typeof b.id!=='string'||ids.has(b.id)||typeof b.label!=='string'||!Array.isArray(b.moves)||b.moves.length>2000)throw new Error('Invalid exploration branch.');ids.add(b.id);const c=new Chess(root.fen());for(const m of b.moves)uciMove(c,m);}
 const branch=branchOf(s);if(!branch||!Number.isInteger(s.step)||s.step<0||s.step>branch.moves.length)throw new Error('Invalid exploration cursor.');
 if(s.source&&(typeof s.source.gameId!=='string'||!Array.isArray(s.source.prefix)||s.source.prefix.join(' ')!==s.root.moves.join(' ')))throw new Error('Invalid exploration origin.');
}

// Retain the actual pending move, even when entering a suggested continuation.
export function rememberOriginal(study:Exploration,move:string):Exploration {
 uciMove(replay(study.root),move);
 const existing=study.branches.find(b=>b.moves[0]===move);
 if(existing)return {...study,originalMove:move,branches:study.branches.map(b=>b.id===existing.id?{...b,label:'Original move'}:b)};
 const original={id:crypto.randomUUID(),label:'Original move',moves:[move]};
 const empty=study.branches.length===1&&!study.branches[0].moves.length;
 return {...study,originalMove:move,branches:empty?[original]:[original,...study.branches],branchId:empty?original.id:study.branchId};
}
export function decisionKey(study:Exploration){return JSON.stringify([study.id,study.root,study.originalMove]);}
