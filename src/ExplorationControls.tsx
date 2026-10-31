import {useState} from 'react';
import {branchOf,studyPosition} from './exploration';
import {lineSan,replay,scoreLabel} from './chess';
import {explainMove} from './coach';
import type {Analysis,Exploration} from './types';

export default function ExplorationControls({study,onChange,onReply,onCompare,comparison,busy,onLine,onApply,onPractice,canApply,autoPlay,onAutoPlay}:{study:Exploration;onChange:(s:Exploration)=>void;onReply:()=>void;onCompare:(moves:string[])=>void;comparison:Analysis|null;busy:boolean;onLine:(pv:string[],label:string)=>void;onApply:()=>void;onPractice:()=>void;canApply:boolean;autoPlay:boolean;onAutoPlay:()=>void}){
 const branch=branchOf(study),root=replay(study.root),board=replay(studyPosition(study));
 const navigate=(step:number)=>onChange({...study,step});
 return <div className="exploration-player"><div className="line-controls"><button disabled={!study.step} onClick={()=>navigate(study.step-1)}>← Previous</button><button className="play-line" disabled={!branch.moves.length} onClick={onAutoPlay}>{autoPlay?'Ⅱ Pause line':'▷ Play line'}</button><button disabled={study.step===branch.moves.length} onClick={()=>navigate(study.step+1)}>Next →</button><button disabled={!study.step} onClick={()=>navigate(0)}>↶ Reset position</button></div>
 <div className="line-timeline" aria-label="Exploration timeline"><button aria-pressed={study.step===0} onClick={()=>navigate(0)}>Start</button>{lineSan(root.fen(),branch.moves,branch.moves.length).map((san,i)=><button key={i} aria-label={`Jump to ${san}, half-move ${i+1}`} aria-pressed={study.step===i+1} onClick={()=>navigate(i+1)}>{san}</button>)}</div>
 <label className="branch-picker">Saved alternatives<select aria-label="Saved alternatives" value={study.branchId} onChange={e=>onChange({...study,branchId:e.target.value,step:Math.min(study.step,study.branches.find(b=>b.id===e.target.value)!.moves.length)})}>{study.branches.map((b,i)=><option key={b.id} value={b.id}>{i+1}. {b.label} · {lineSan(root.fen(),b.moves,6).join(' ')||'No moves yet'}</option>)}</select></label>
 <div className="button-row"><button disabled={busy||board.isGameOver()} onClick={onReply}>Computer reply once</button><button disabled={busy||board.isGameOver()} onClick={onPractice}>Practice this position</button>{canApply&&<button className="primary" onClick={onApply}>Use this move</button>}</div>
 <p className="line-caption">{study.step} / {branch.moves.length} half-moves · Play either side. Step back and choose a different move to keep another alternative.</p>
 {board.isGameOver()?<p role="status">This exploration position has ended. Step back to try another line.</p>:<CompareChoices key={board.fen()} study={study} busy={busy} onCompare={onCompare}/>}
 {comparison&&comparison.fen===board.fen()&&<div className="exploration-comparisons"><p className="muted">Same position, full-strength coach. Possible lines, not predictions.</p>{comparison.lines.map(l=><div className="candidate" key={l.move}><div><strong>{lineSan(board.fen(),[l.move])[0]}</strong><span>{scoreLabel(l,board.turn())}</span></div><p>{explainMove(board.fen(),l.move)[0].text}</p><p>{lineSan(board.fen(),l.pv).join(' ')}</p><button onClick={()=>onLine(l.pv,'Compared line')}>Play through this line →</button><small>Depth {l.depth}</small></div>)}</div>}
 </div>;
}
function CompareChoices({study,busy,onCompare}:{study:Exploration;busy:boolean;onCompare:(moves:string[])=>void}){
 const board=replay(studyPosition(study)),prefix=branchOf(study).moves.slice(0,study.step);
 const saved=[...new Set(study.branches.filter(b=>prefix.every((m,i)=>b.moves[i]===m)).map(b=>b.moves[study.step]).filter((m):m is string=>!!m))];
 const [selected,setSelected]=useState<string[]>([...saved.slice(0,3),...Array(3).fill('')].slice(0,3));
 const legal=board.moves({verbose:true});
 return <details className="compare-picker"><summary>Compare alternatives from here</summary><p>Choose up to three moves. Saved continuations are selected first.</p>{selected.map((value,i)=><label key={i}>Option {i+1}<select aria-label={`Compare option ${i+1}`} value={value} onChange={e=>setSelected(s=>s.map((v,j)=>i===j?e.target.value:v))}><option value="">Choose a move</option>{legal.map(m=><option key={m.lan} value={m.lan}>{m.san}{saved.includes(m.lan)?' · saved alternative':''}</option>)}</select></label>)}<button disabled={busy||!selected.some(Boolean)} onClick={()=>onCompare([...new Set(selected.filter(Boolean))])}>Compare selected moves</button></details>;
}
