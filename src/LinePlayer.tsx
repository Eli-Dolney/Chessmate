import {branchOf,studyPosition} from './exploration';
import {replay,sanFor,resultLabel} from './chess';
import {explainMove} from './coach';
import type {Exploration} from './types';

export default function LinePlayer({study,playing,speed,busy,progress,onChange,onPlay,onSpeed,onGenerate,onCancel}:{study:Exploration;playing:boolean;speed:number;busy:boolean;progress:{done:number;total:number}|null;onChange:(s:Exploration)=>void;onPlay:()=>void;onSpeed:(ms:number)=>void;onGenerate:(moves:5|10)=>void;onCancel:()=>void}){
 const branch=branchOf(study),board=replay(studyPosition(study)),next=branch.moves[study.step],last=branch.moves[study.step-1];
 const before=last?replay(studyPosition({...study,step:study.step-1})).fen():null;
 const fact=before&&last?explainMove(before,last).find(e=>e.kind==='fact')?.text:null;
 return <section className="line-player-panel" aria-label="Line playback">
  <div className="line-player-heading"><strong>Watch this line unfold · {branch.label}</strong><span>{study.step} / {branch.moves.length} half-moves</span></div>
  <div className="line-controls"><button disabled={!study.step} onClick={()=>onChange({...study,step:study.step-1})}>← Previous</button><button className="play-line" disabled={busy||!branch.moves.length} onClick={onPlay}>{playing?'Ⅱ Pause line':study.step===branch.moves.length?'▷ Replay line':'▷ Play line'}</button><button disabled={study.step===branch.moves.length} onClick={()=>onChange({...study,step:study.step+1})}>Next →</button><button disabled={!study.step} onClick={()=>onChange({...study,step:0})}>↶ Reset position</button><button disabled={!branch.moves.length||study.step===branch.moves.length} onClick={()=>onChange({...study,step:branch.moves.length})}>See final position</button></div>
  <div className="line-generation"><button disabled={busy} onClick={()=>onGenerate(5)}>Play out 5 moves</button><button disabled={busy} onClick={()=>onGenerate(10)}>Play out 10 moves</button><label>Playback speed<select aria-label="Playback speed" value={speed} onChange={e=>onSpeed(Number(e.target.value))}><option value={800}>Quick · 0.8s</option><option value={1500}>Normal · 1.5s</option><option value={2500}>Thoughtful · 2.5s</option><option value={6000}>Coach pace · 6s</option></select></label></div>
  {progress?<div className="line-generation-progress" role="status"><span>Building a possible line… {progress.done} / {progress.total} half-moves</span><progress max={progress.total} value={progress.done}/><button onClick={onCancel}>Cancel line generation</button></div>:<p className="line-player-description">5 or 10 moves for each side, including the starting move. Existing moves are kept; the local engine extends short lines. Play can end sooner.</p>}
  <div className="line-position-note" aria-live="polite">{last&&before?<><strong>{sanFor(before,last)}</strong>{fact?` · ${fact}`:' · Follow the next reply to see what changes.'}</>:'Start position. Play the line or step through it at your own pace.'}{board.isGameOver()?<span>{resultLabel(board)}</span>:next?<span>Next in this saved line: {sanFor(board.fen(),next)}</span>:branch.moves.length>0?<span>End of this saved line. Try your own continuation or request a longer line.</span>:null}</div>
 </section>;
}
