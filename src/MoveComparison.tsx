import {branchOf} from './exploration';
import {replay,sanFor,lineSan,score,scoreLabel,uciMove} from './chess';
import {explainMove} from './coach';
import type {Analysis,Exploration} from './types';

export function comparisonArrows(study:Exploration,analysis:Analysis|null){
 const original=study.originalMove,branch=branchOf(study);if(!original)return [];
 const alternative=branch.moves[0]!==original?branch.moves[0]:analysis?.lines[1]?.move;
 if(study.step===0)return [{move:original,kind:'original' as const},...(alternative?[{move:alternative,kind:'alternative' as const}]:[])];
 const line=analysis?.lines.find(l=>branch.moves.slice(0,study.step).every((m,i)=>l.pv[i]===m));
 const next=line?.pv[study.step];return next?[{move:next,kind:study.step%2?'reply' as const:line.move===original?'original' as const:'alternative' as const}]:[];
}
export function comparisonVerdict(analysis:Analysis){
 const [original,alternative]=analysis.lines;if(!original||!alternative)return '';
 const gap=score(alternative)-score(original);
 if(original.mate!==undefined||alternative.mate!==undefined)return gap>0?'The calculated mating outcomes favor the alternative. Follow both lines to inspect the difference.':gap<0?'The calculated mating outcomes favor your original move. Follow both lines before deciding.':'Both searches show a similar mating outcome. Compare the defenses in the lines.';
 return Math.abs(gap)<30?'These searches are close. There is no clear improvement at this depth.':gap>0?`The alternative scores about ${(gap/100).toFixed(2)} pawns better for the moving side in this search.`:`Your original scores about ${(-gap/100).toFixed(2)} pawns better for the moving side in this search.`;
}
export default function MoveComparison({study,analysis,busy,onAnalyze,onStart,onLine,onApply,onOriginal,canApply}:{study:Exploration;analysis:Analysis|null;busy:boolean;onAnalyze:()=>void;onStart:()=>void;onLine:(pv:string[],step:number)=>void;onApply:()=>void;onOriginal:()=>void;canApply:boolean}){
 const root=replay(study.root),fen=root.fen(),first=branchOf(study).moves[0],different=!!first&&first!==study.originalMove;
 return <section className="move-comparison" aria-label="Original move comparison">
  <span className="tag calculated">Your move is remembered</span><h3>Keep it, or try a new idea.</h3>
  <p><strong>Original: {sanFor(fen,study.originalMove!)}</strong>{different&&<> · Testing: <strong>{sanFor(fen,first)}</strong></>}. Your live game stays paused.</p>
  <div className="comparison-legend"><span>● Gold · original</span><span>◆ Aqua · alternative</span><span>↗ Pink · possible reply</span></div>
  <div className="button-row"><button onClick={onStart}>Show both move arrows</button><button disabled={busy||!different} onClick={onAnalyze}>{busy?'Analysis in progress…':'Explain the difference'}</button></div>
  {!different&&!analysis&&<p>Play another move from this starting position, then compare it with your original.</p>}
  {analysis&&<><p className="comparison-verdict">{comparisonVerdict(analysis)}</p><p className="muted">Calculated possibilities, not predictions. Scores below favor White when positive. Select a move in either line to see its position and the next reply arrow.</p>
  <div className="comparison-cards">{analysis.lines.map((line,i)=>{const after=replay(study.root);uciMove(after,line.move);const reply=line.pv[1];return <article key={line.move} className={i?'alternative-choice':'original-choice'}>
   <strong>{i?'Alternative':'Original'} · {sanFor(fen,line.move)}</strong><p>{scoreLabel(line,root.turn())} · depth {line.depth}</p>
   <span className="tag fact">Board fact</span><p>{explainMove(fen,line.move).find(e=>e.kind==='fact')?.text??'This is a legal move. Inspect the continuation to understand its consequences.'}</p>
   {reply&&<><span className="tag calculated">Possible reply</span><p>{sanFor(after.fen(),reply)}: {explainMove(after.fen(),reply).find(e=>e.kind==='fact')?.text??'This reply appears in the calculated line; it is not forced.'}</p></>}
   <div className="comparison-line">{lineSan(fen,line.pv,10).map((san,j)=><button key={j} aria-label={`${i?'Alternative':'Original'} line through ${san}, half-move ${j+1}`} onClick={()=>onLine(line.pv,j+1)}>{san}</button>)}</div>
  </article>;})}</div></>}
  <div className="button-row comparison-decision">{canApply&&different&&<button className="primary" onClick={onApply}>Play this alternative</button>}<button onClick={onOriginal}>{canApply?'Keep my original move':'Close comparison'}</button></div>
  <small>Playing the alternative applies only its first move. Imagined replies stay in exploration; normal coaching resumes before the computer replies.</small>
 </section>;
}
