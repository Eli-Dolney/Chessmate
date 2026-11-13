import {Chess} from 'chess.js';
import {exercises} from './lessons';
import {lineSan,positionKey,sanFor} from './chess';
import {isDue,schedule} from './storage';
import type {AppData,LearningMoment,LearningTopic,LessonExercise,PracticeRecord,TrainingSession} from './types';

export const moduleTopics:Record<string,LearningTopic>={italian:'opening',caro:'opening',qgd:'opening',ruy:'opening',scotch:'opening',sicilian:'opening',french:'opening',scandinavian:'opening',london:'opening',qga:'opening',slav:'opening',kingsindian:'opening',threats:'tactics','forks-pins':'tactics',calculation:'tactics',activity:'strategy','pawn-king':'strategy',endgames:'endgame'};
export const practiceKey=(r:PracticeRecord)=>r.exerciseId?`lesson:${r.exerciseId}`:`position:${positionKey(r.moment!.fen)}:${r.moment!.best}`;
export function momentRecord(moment:LearningMoment):PracticeRecord{return {id:`moment:${moment.id}`,moment,stage:0,due:new Date().toISOString(),lastSession:'',missed:false,attempts:0};}
export function addPractice(records:PracticeRecord[],record:PracticeRecord){return records.some(r=>practiceKey(r)===practiceKey(record))?records:[...records,record];}
export function exerciseFor(record:PracticeRecord):LessonExercise|undefined{
 if(record.exerciseId)return exercises.find(e=>e.id===record.exerciseId);
 const m=record.moment;if(!m)return;
 return {id:record.id,module:'review',title:'An idea from your game',fen:m.fen,accepted:[sanFor(m.fen,m.best)],prompt:'Find the saved candidate, then examine how the opponent can respond.',hint:'Check forcing moves and the safety of your pieces before choosing.',explanation:m.explanation,continuation:lineSan(m.fen,m.pv).slice(1),theme:'tactic'};
}
export function buildTraining(data:AppData,now=new Date()):TrainingSession{
 const id=crypto.randomUUID(),chosen:PracticeRecord[]=[],seen=new Set<string>();
 const add=(r:PracticeRecord)=>{if(chosen.length>=6||!exerciseFor(r)||seen.has(practiceKey(r)))return false;seen.add(practiceKey(r));chosen.push(structuredClone(r));return true;};
 const take=(rs:PracticeRecord[],n:number)=>{let count=0;for(const r of rs)if(add(r)&&++count>=n)break;};
 const due=data.practice.filter(r=>isDue(r,id,now)).sort((a,b)=>a.due.localeCompare(b.due));take(due,2);
 const own=[...data.practice.filter(r=>r.moment),...[data.current,...data.games].flatMap(g=>g.moments).sort((a,b)=>b.loss-a.loss).map(momentRecord)];take(own,2);
 const topics:LearningTopic[]=['opening','tactics','strategy','endgame'];
 const lessons:PracticeRecord[]=[];
 const buckets=topics.map(t=>exercises.filter(e=>(moduleTopics[e.module]??'opening')===t).sort((a,b)=>{
  const ar=data.practice.find(r=>r.exerciseId===a.id),br=data.practice.find(r=>r.exerciseId===b.id);return (ar?.attempts??0)-(br?.attempts??0);
 }));
 for(let i=0;i<84;i++)for(let t=0;t<4;t++){const e=buckets[(t+data.trainingRound)%4][i];if(e)lessons.push(data.practice.find(r=>r.exerciseId===e.id)??{id:e.id,exerciseId:e.id,stage:0,due:now.toISOString(),lastSession:'',missed:false,attempts:0});}
 take(lessons.filter(r=>!r.attempts),2);take(due,6);take(lessons.filter(r=>!r.attempts),6);take(lessons,6);
 return {id,created:now.toISOString(),cursor:0,items:chosen.map(record=>({record,topic:moduleTopics[exerciseFor(record)!.module]??'tactics',result:'pending',missed:false,revealed:false,hint:0}))};
}
export function answerTraining(data:AppData,uci:string):AppData{
 const s=data.training;if(!s||s.study||s.cursor>=s.items.length)return data;
 const item=s.items[s.cursor],e=exerciseFor(item.record);if(!e||item.answer)return data;
 const san=new Chess(e.fen).move(uci).san,correct=e.accepted.includes(san);
 const next={...item,answer:uci,missed:item.missed||!correct,result:correct?(item.missed||item.revealed?'assisted':'solved') as 'assisted'|'solved':'pending' as const};
 const existing=data.practice.find(r=>practiceKey(r)===practiceKey(item.record))??item.record;
 const record=schedule(existing,correct&&!next.missed&&!next.revealed,s.id);
 return {...data,practice:[...data.practice.filter(r=>practiceKey(r)!==practiceKey(record)),record],training:{...s,items:s.items.map((x,i)=>i===s.cursor?{...next,record}:x)}};
}
export function hintTraining(data:AppData):AppData{
 const s=data.training;if(!s||s.cursor>=s.items.length)return data;
 const item=s.items[s.cursor],hint=Math.min(3,item.hint+1),revealed=item.revealed||hint===3;
 let practice=data.practice,record=item.record;
 if(hint===3&&!item.revealed){const existing=practice.find(r=>practiceKey(r)===practiceKey(record))??record;record=schedule(existing,false,s.id);practice=[...practice.filter(r=>practiceKey(r)!==practiceKey(record)),record];}
 return {...data,practice,training:{...s,items:s.items.map((x,i)=>i===s.cursor?{...item,record,hint,revealed,result:revealed&&item.result==='solved'?'assisted':item.result}:x)}};
}
