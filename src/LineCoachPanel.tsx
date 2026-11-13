import {useMemo} from 'react';
import {branchOf} from './exploration';
import {buildLineCommentary} from './lineCoach';
import type {CoachingEvidence,Exploration} from './types';

export default function LineCoach({study,enabled,playing,speed,onToggle,onPause,onPace,onShow,onClear,live=false,detail='detailed',onDetail}:{live?:boolean;detail?:'brief'|'detailed';onDetail?:(detail:'brief'|'detailed')=>void;study:Exploration;enabled:boolean;playing:boolean;speed:number;onToggle:(enabled:boolean)=>void;onPause:()=>void;onPace:()=>void;onShow:(fen:string,squares:string[])=>void;onClear:()=>void}){
 const branch=branchOf(study),long=detail==='detailed';
 const notes=useMemo(()=>enabled?buildLineCommentary(study):null,[enabled,study.root.initialFen,study.root.moves.join(' '),branch.moves.join(' '),study.step]);
 const show=(squares?:string[])=>{if(notes&&squares?.length){onPause();onShow(notes.currentFen,squares);}};
 const evidence=(entry:CoachingEvidence,key:string)=><div key={key} className="line-coach-evidence"><p>{entry.text}</p>{!!entry.squares?.length&&<button onClick={()=>show(entry.squares)}>Show {key} on board</button>}</div>;
 return <section className="line-coach-card" aria-label="Move-by-move coach">
  <div className="line-coach-header"><strong>✦ {live?'Your move coach':'Your line coach'}</strong><label><input type="checkbox" checked={enabled} onChange={e=>onToggle(e.target.checked)}/>Explain each move</label>{onDetail&&<label><input type="checkbox" checked={long} onChange={e=>onDetail(e.target.checked?'detailed':'brief')}/>Longer explanations</label>}</div>
  {notes&&<div className="line-coach-body" data-fen={notes.currentFen}>
   <div className="line-coach-now"><span className="tag calculated">{live?'Current game':'Following the board'} · {study.step} / {branch.moves.length}</span><h3 aria-live="polite">{notes.heading}</h3><div className="button-row">{!live&&<><button disabled={!playing} onClick={onPause}>Pause to read</button><button aria-pressed={speed===6000} onClick={onPace}>Coach pace · 6s</button></>}<button onClick={onClear}>Clear coach markings</button></div></div>
   <section><h4>What changed</h4><span className="tag fact">Board facts</span>{notes.facts.slice(0,long?3:1).map((fact,i)=>evidence(fact,`change ${i+1}`))}</section>
   {!notes.terminal&&<section><h4>Why consider this move?</h4><span className="tag principle">Possible purpose</span>{evidence(notes.purpose,'the idea')}</section>}
   {notes.terminal?<p className="line-coach-result">{notes.terminal}</p>:<>
    {long&&<div className="line-coach-plans">{notes.plans.map(plan=><section key={plan.color} aria-label={`${plan.color==='w'?'White':'Black'} plan`}><h4>{plan.color==='w'?'White':'Black'}’s possible plan</h4><span className="tag principle">Planning idea</span>{evidence(plan.evidence,`${plan.color==='w'?'White':'Black'}’s plan`)}{plan.continuation&&<details className="line-coach-continuation"><summary>In this saved line · {plan.continuation.san}</summary><p>{plan.continuation.text}</p></details>}</section>)}</div>}
    {long&&notes.next&&<section className="line-coach-reply"><h4>Watch the reply: {notes.next.san}</h4><span className="tag calculated">Saved continuation</span><p>{notes.next.text}</p>{!!notes.next.squares.length&&<button onClick={()=>show(notes.next!.squares)}>Show the next move’s squares</button>}</section>}
    {long&&<p className="line-coach-limit">Plans are possibilities, not known intentions.{!live&&' A saved reply can be an engine suggestion or your own move; it is not a forced prediction.'}</p>}
   </>}
  </div>}
 </section>;
}
