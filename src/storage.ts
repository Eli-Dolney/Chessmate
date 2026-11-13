import { Chess } from 'chess.js';
import { newGame,replay,uciMove } from './chess';
import {defaultAppearance,normalizeAppearance} from './appearance';
import {validateStudy} from './exploration';
import {exercises} from './lessons';
import type { AppData, GameSession, PracticeRecord, LearningMoment } from './types';
export const defaultCoach={enabled:false,threats:true,openings:true,plans:true,suggestions:false};
export function defaults():AppData {return {version:3,settings:{color:'w',difficulty:'Gentle',flipped:false,appearance:{...defaultAppearance},coach:{...defaultCoach}},current:newGame(),games:[],practice:[],explorations:[],activeExplorationId:null,training:null,trainingRound:0,reviews:[]};}
// Keep the original database name and origin so the Chessmate rename retains existing progress.
function openDB(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('ltw-chess',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function loadData():Promise<AppData>{const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction('state');const r=t.objectStore('state').get('app');r.onsuccess=()=>{try{resolve(r.result?validateBackup(r.result):defaults());}catch(e){reject(e);}};r.onerror=()=>reject(r.error);t.oncomplete=()=>db.close();});}
export async function saveData(data:AppData){const db=await openDB();return new Promise<void>((resolve,reject)=>{const t=db.transaction('state','readwrite');t.objectStore('state').put(data,'app');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>{db.close();reject(t.error);};});}
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
function validDate(v:unknown){return typeof v==='string'&&Number.isFinite(Date.parse(v));}
function validateMoment(m:LearningMoment){assert(m&&typeof m.id==='string'&&typeof m.explanation==='string'&&typeof m.loss==='number'&&Number.isFinite(m.loss)&&m.loss>=0&&Array.isArray(m.pv)&&m.pv.length<=2000,'Invalid saved learning moment.');const c=new Chess(m.fen);uciMove(new Chess(m.fen),m.played);uciMove(new Chess(m.fen),m.best);for(const move of m.pv)uciMove(c,move);
 if(m.position){assert(Array.isArray(m.position.moves)&&m.position.moves.length<=2000&&replay(m.position).fen()===m.fen,'Invalid moment history.');}
 for(const [line,move] of [[m.playedLine,m.played],[m.bestLine,m.best]] as const)if(line){assert(line.move===move&&Number.isInteger(line.depth)&&line.depth>=0&&Array.isArray(line.pv)&&line.pv.length<=2000&&line.pv[0]===move&&(Number.isFinite(line.cp)||Number.isFinite(line.mate)),'Invalid analysis line.');const b=new Chess(m.fen);line.pv.forEach(u=>uciMove(b,u));}
}
function validatePractice(p:PracticeRecord){assert(p&&typeof p.id==='string'&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=4&&validDate(p.due)&&typeof p.lastSession==='string'&&typeof p.missed==='boolean'&&Number.isInteger(p.attempts)&&p.attempts>=0,'Invalid practice record.');assert(typeof p.exerciseId==='string'||p.moment,'Practice item has no position.');if(p.moment)validateMoment(p.moment);}
export function validateBackup(input:unknown):AppData {
 const legacy=input as AppData & {version:number};assert(legacy&&[1,2,3].includes(legacy.version),'This is not a supported Chessmate backup (version 1, 2, or 3).');
 const d:AppData=structuredClone({...legacy,version:3,settings:{...legacy.settings,coach:legacy.settings?.coach??{...defaultCoach}},explorations:legacy.explorations??[],activeExplorationId:legacy.activeExplorationId??null,training:legacy.training??null,trainingRound:legacy.trainingRound??0,reviews:legacy.reviews??[]});
 assert(d.settings&&['w','b'].includes(d.settings.color)&&['Gentle','Steady','Challenging'].includes(d.settings.difficulty)&&typeof d.settings.flipped==='boolean','Invalid settings.');
 assert(Array.isArray(d.games)&&Array.isArray(d.practice)&&d.games.length<=10000&&d.practice.length<=50000,'Invalid backup records.');
 for(const g of [d.current,...d.games]){assert(g&&typeof g.id==='string'&&Array.isArray(g.moves)&&g.moves.length<=2000&&['w','b'].includes(g.player)&&['Gentle','Steady','Challenging'].includes(g.difficulty)&&typeof g.pending==='boolean'&&validDate(g.created)&&validDate(g.updated)&&Array.isArray(g.moments),'Invalid game record.');replay(g);g.moments.forEach(validateMoment);}
 d.practice.forEach(validatePractice);
 assert(d.settings.coach&&Object.keys(defaultCoach).every(k=>typeof d.settings.coach[k as keyof typeof defaultCoach]==='boolean'),'Invalid coach settings.');
 assert(d.settings.coach.detail===undefined||['brief','detailed'].includes(d.settings.coach.detail),'Invalid explanation length.');
 for(const key of ['pauseAfterMove','captures'] as const)assert(d.settings.coach[key]===undefined||typeof d.settings.coach[key]==='boolean','Invalid coaching option.');
 assert(d.settings.coach.lineCommentary===undefined||typeof d.settings.coach.lineCommentary==='boolean','Invalid line coach setting.');
 assert(Array.isArray(d.explorations)&&d.explorations.length<=1000,'Invalid explorations.');
 const ids=new Set<string>();for(const s of d.explorations){validateStudy(s);assert(!ids.has(s.id),'Duplicate exploration.');ids.add(s.id);}
 assert(d.activeExplorationId===null||ids.has(d.activeExplorationId),'Invalid active exploration.');
 assert(Number.isInteger(d.trainingRound)&&d.trainingRound>=0,'Invalid training rotation.');
 if(d.training){const s=d.training;assert(s.label===undefined||(typeof s.label==='string'&&s.label.length<=120),'Invalid practice label.');assert(typeof s.id==='string'&&validDate(s.created)&&Array.isArray(s.items)&&s.items.length>0&&s.items.length<=6&&Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<=s.items.length,'Invalid training session.');const keys=new Set<string>();for(const item of s.items){validatePractice(item.record);const key=item.record.exerciseId??item.record.moment!.fen+'|'+item.record.moment!.best;assert(!keys.has(key),'Duplicate training item.');keys.add(key);assert(['opening','tactics','strategy','endgame'].includes(item.topic)&&['pending','solved','assisted','skipped'].includes(item.result)&&typeof item.missed==='boolean'&&typeof item.revealed==='boolean'&&Number.isInteger(item.hint)&&item.hint>=0&&item.hint<=3,'Invalid training result.');const fen=item.record.exerciseId?exercises.find(e=>e.id===item.record.exerciseId)?.fen:item.record.moment?.fen;assert(fen,'Unknown training exercise.');if(item.answer)uciMove(new Chess(fen),item.answer);}if(s.study)validateStudy(s.study);}
 assert(Array.isArray(d.reviews)&&d.reviews.length<=10000,'Invalid reviews.');const reviewIds=new Set<string>();for(const r of d.reviews){assert(r&&typeof r.id==='string'&&!reviewIds.has(r.id)&&typeof r.gameId==='string'&&['w','b'].includes(r.color)&&Array.isArray(r.position?.moves)&&r.position.moves.length<=2000&&Array.isArray(r.entries)&&r.entries.length<=2000&&r.search?.time===1000&&r.search.skill===20&&Number.isInteger(r.selected)&&r.selected>=0&&r.selected<=2,'Invalid review.');reviewIds.add(r.id);replay(r.position);const plies=new Set<number>();for(const e of r.entries){assert(Number.isInteger(e.ply)&&e.ply>=0&&e.ply<r.position.moves.length&&!plies.has(e.ply),'Invalid review position.');plies.add(e.ply);validateMoment(e.moment);const b=replay({initialFen:r.position.initialFen,moves:r.position.moves.slice(0,e.ply)});assert(b.turn()===r.color&&e.moment.fen===b.fen()&&e.moment.played===r.position.moves[e.ply]&&!!e.moment.bestLine&&!!e.moment.playedLine,'Mismatched review analysis.');}if(r.study)validateStudy(r.study);}
 return {...d,settings:{...d.settings,appearance:normalizeAppearance(d.settings.appearance)}};
}
export function schedule(record:PracticeRecord,correct:boolean,session:string,now=new Date()):PracticeRecord{
 const intervals=[1,3,7,14]; const days=correct?intervals[Math.min(record.stage,3)]:0;
 return {...record,stage:correct?Math.min(record.stage+1,4):0,due:new Date(now.getTime()+days*86400000).toISOString(),lastSession:session,missed:!correct,attempts:record.attempts+1};
}
export function isDue(r:PracticeRecord,session:string,now=new Date()){return new Date(r.due)<=now&&(!r.missed||r.lastSession!==session);}
export function importPgn(text:string):GameSession{if(text.length>2_000_000)throw new Error('Please import a PGN smaller than 2 MB.');const c=new Chess();c.loadPgn(text,{strict:true});const history=c.history({verbose:true});const g=newGame();return {...g,initialFen:history[0]?.before??c.fen(),moves:history.map(m=>m.lan),pending:false,archived:true,imported:true};}
export function backupFile(data:AppData){return JSON.stringify(data,null,2);}
