import { Chess } from 'chess.js';
import { newGame,replay,uciMove } from './chess';
import {defaultAppearance,normalizeAppearance} from './appearance';
import {validateStudy} from './exploration';
import type { AppData, GameSession, PracticeRecord, LearningMoment } from './types';
export const defaultCoach={enabled:false,threats:true,openings:true,plans:true,suggestions:false};
export function defaults():AppData {return {version:2,settings:{color:'w',difficulty:'Gentle',flipped:false,appearance:{...defaultAppearance},coach:{...defaultCoach}},current:newGame(),games:[],practice:[],explorations:[],activeExplorationId:null};}
// Keep the original database name and origin so the Chessmate rename retains existing progress.
function openDB(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('ltw-chess',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function loadData():Promise<AppData>{const db=await openDB();return new Promise((resolve,reject)=>{const t=db.transaction('state');const r=t.objectStore('state').get('app');r.onsuccess=()=>{try{resolve(r.result?validateBackup(r.result):defaults());}catch(e){reject(e);}};r.onerror=()=>reject(r.error);t.oncomplete=()=>db.close();});}
export async function saveData(data:AppData){const db=await openDB();return new Promise<void>((resolve,reject)=>{const t=db.transaction('state','readwrite');t.objectStore('state').put(data,'app');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>{db.close();reject(t.error);};});}
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
function validDate(v:unknown){return typeof v==='string'&&Number.isFinite(Date.parse(v));}
function validateMoment(m:LearningMoment){assert(m&&typeof m.id==='string'&&typeof m.explanation==='string'&&typeof m.loss==='number'&&Number.isFinite(m.loss)&&Array.isArray(m.pv),'Invalid saved learning moment.');const c=new Chess(m.fen);uciMove(new Chess(m.fen),m.played);uciMove(new Chess(m.fen),m.best);for(const move of m.pv)uciMove(c,move);}
export function validateBackup(input:unknown):AppData {
 const legacy=input as AppData & {version:number};assert(legacy&&[1,2].includes(legacy.version),'This is not a supported Chessmate backup (version 1 or 2).');
 const d:AppData=structuredClone({...legacy,version:2,settings:{...legacy.settings,coach:legacy.settings?.coach??{...defaultCoach}},explorations:legacy.explorations??[],activeExplorationId:legacy.activeExplorationId??null});
 assert(d.settings&&['w','b'].includes(d.settings.color)&&['Gentle','Steady','Challenging'].includes(d.settings.difficulty)&&typeof d.settings.flipped==='boolean','Invalid settings.');
 assert(Array.isArray(d.games)&&Array.isArray(d.practice)&&d.games.length<=10000&&d.practice.length<=50000,'Invalid backup records.');
 for(const g of [d.current,...d.games]){assert(g&&typeof g.id==='string'&&Array.isArray(g.moves)&&g.moves.length<=2000&&['w','b'].includes(g.player)&&['Gentle','Steady','Challenging'].includes(g.difficulty)&&typeof g.pending==='boolean'&&validDate(g.created)&&validDate(g.updated)&&Array.isArray(g.moments),'Invalid game record.');replay(g);g.moments.forEach(validateMoment);}
 for(const p of d.practice){assert(p&&typeof p.id==='string'&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=4&&validDate(p.due)&&typeof p.lastSession==='string'&&typeof p.missed==='boolean'&&Number.isInteger(p.attempts)&&p.attempts>=0,'Invalid practice record.');assert(typeof p.exerciseId==='string'||p.moment,'Practice item has no position.');if(p.moment)validateMoment(p.moment);}
 assert(d.settings.coach&&Object.keys(defaultCoach).every(k=>typeof d.settings.coach[k as keyof typeof defaultCoach]==='boolean'),'Invalid coach settings.');
 assert(Array.isArray(d.explorations)&&d.explorations.length<=1000,'Invalid explorations.');
 const ids=new Set<string>();for(const s of d.explorations){validateStudy(s);assert(!ids.has(s.id),'Duplicate exploration.');ids.add(s.id);}
 assert(d.activeExplorationId===null||ids.has(d.activeExplorationId),'Invalid active exploration.');
 return {...d,settings:{...d.settings,appearance:normalizeAppearance(d.settings.appearance)}};
}
export function schedule(record:PracticeRecord,correct:boolean,session:string,now=new Date()):PracticeRecord{
 const intervals=[1,3,7,14]; const days=correct?intervals[Math.min(record.stage,3)]:0;
 return {...record,stage:correct?Math.min(record.stage+1,4):0,due:new Date(now.getTime()+days*86400000).toISOString(),lastSession:session,missed:!correct,attempts:record.attempts+1};
}
export function isDue(r:PracticeRecord,session:string,now=new Date()){return new Date(r.due)<=now&&(!r.missed||r.lastSession!==session);}
export function importPgn(text:string):GameSession{if(text.length>2_000_000)throw new Error('Please import a PGN smaller than 2 MB.');const c=new Chess();c.loadPgn(text,{strict:true});const history=c.history({verbose:true});const g=newGame();return {...g,initialFen:history[0]?.before??c.fen(),moves:history.map(m=>m.lan),pending:false,archived:true};}
export function backupFile(data:AppData){return JSON.stringify(data,null,2);}
