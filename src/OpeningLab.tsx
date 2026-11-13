import {useEffect,useMemo,useState} from 'react';
import {choicesForPosition,useOpeningChoices,type OpeningChoice} from './openingChoices';
import {planForOpening} from './openings';
import {lineSan,replay,resultLabel,sanFor,scoreLabel} from './chess';
import type {Analysis,PositionHistory} from './types';

interface Props {
 position:PositionHistory;
 atStart:boolean;
 onChoose:(line:string[],label:string)=>void;
 onReset:()=>void;
 onAnalyze:()=>void;
 analysis:Analysis|null;
 busy:boolean;
}

export default function OpeningLab({position,atStart,onChoose,onReset,onAnalyze,analysis,busy}:Props){
 const key=position.initialFen+'|'+position.moves.join(' ');
 const board=useMemo(()=>replay(position),[key]),fen=board.fen(),terminal=board.isGameOver();
 const {index,error}=useOpeningChoices(true);
 const choices=useMemo(()=>choicesForPosition(index,position),[index,key]);
 const loaded=useMemo(()=>Object.keys(index).length>0,[index]);
 const [query,setQuery]=useState(''),[selected,setSelected]=useState('');
 useEffect(()=>{setQuery('');setSelected('');},[key]);
 const legal=terminal?[]:board.moves({verbose:true});
 const selectedMove=legal.find(move=>move.lan===selected);
 const matching=choices.filter(choice=>`${choice.name} ${choice.eco} ${sanFor(fen,choice.move)}`.toLowerCase().includes(query.trim().toLowerCase()));
 const lines=analysis?.fen===fen&&!terminal?analysis.lines.filter(line=>legal.some(move=>move.lan===line.move)).slice(0,3):[];
 const side=board.turn()==='w'?'White':'Black';
 const reference=(choice:OpeningChoice)=>{
  const san=sanFor(fen,choice.move),plan=planForOpening(choice.name)?.[2];
  return <article className="opening-choice" key={choice.move}>
   <div className="opening-choice-heading"><strong>{san}</strong><span className="tag principle">{choice.eco} · Reference line</span></div>
   <p className="opening-choice-name">Leads toward <strong>{choice.name}</strong></p>
   <button onClick={()=>onChoose(choice.line,choice.name)}>Try {san} · {choice.name}</button>
   <details><summary>Reference idea and moves</summary><p>{plan??'Compare the center, development, and king safety as this reference line unfolds. The move coach explains facts and possible plans for the current board.'}</p><p className="opening-reference-moves">{lineSan(fen,choice.line,20).join(' ')}</p><small>This reference is a possible route, not a forced sequence or a claim that this move is best.</small></details>
  </article>;
 };
 return <section className="opening-lab" aria-label="Opening defense lab">
  <div className="opening-lab-heading"><div><span className="small-label">FROM THE POSITION ON YOUR BOARD</span><h2>Try a defense or setup</h2></div><button disabled={atStart} onClick={onReset}>Back to starting position</button></div>
  <div className="opening-lab-body">
   <p>{terminal?resultLabel(board):`${side} to move. Choose a continuation, then play either side or follow the saved line.`} Your alternatives stay saved and your real game stays paused.</p>
   {terminal?<p className="opening-lab-status" role="status">This position has ended. Step back to explore another defense.</p>:<>
    <label className="opening-filter">Filter defenses and setups<input type="search" aria-label="Filter defenses and setups" placeholder="Try Caro-Kann, French, or a move" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    {error?<p role="alert">{error} You can still try any legal move below.</p>:!loaded?<p role="status">Loading the local opening references…</p>:!choices.length?<p className="opening-lab-status">No catalog continuation matches this exact position. An unfamiliar move is not automatically bad. Try a legal move below or ask the local engine for possibilities.</p>:!matching.length?<p>No reference matches this filter. Try a broader name or clear the search.</p>:<>
     <details key={key} className="opening-reference-browser" open={atStart||!!query.trim()}><summary>Browse reference continuations · {matching.length} choices</summary><div className="opening-choice-grid">{matching.slice(0,8).map(reference)}</div></details>
     {matching.length>8&&<p className="muted">Showing 8 of {matching.length} next moves. Filter by name, ECO code, or move to narrow the choices.</p>}
    </>}
    <div className="opening-custom-move"><label>Try your own move<select aria-label="Move to try" value={selectedMove?.lan??''} onChange={event=>setSelected(event.target.value)}><option value="">Choose any legal move</option>{legal.map(move=><option key={move.lan} value={move.lan}>{move.san}</option>)}</select></label><button disabled={!selectedMove} onClick={()=>selectedMove&&onChoose([selectedMove.lan],`My idea · ${selectedMove.san}`)}>Try selected move</button></div>
    <div className="opening-engine"><button disabled={busy} onClick={onAnalyze}>Find engine alternatives</button><p className="muted">{busy?'Local analysis is running. You can keep exploring.':'Ask explicitly for up to three calculated options. Reference choices above are not engine rankings.'}</p>
     {!!lines.length&&<div className="opening-choice-grid" aria-label="Calculated opening alternatives">{lines.map(line=><article className="opening-choice" key={line.move}><div className="opening-choice-heading"><strong>{sanFor(fen,line.move)}</strong><span className="tag calculated">Calculated line</span></div><p>{scoreLabel(line,board.turn())}</p><p className="opening-reference-moves">{lineSan(fen,line.pv,20).join(' ')}</p><button onClick={()=>onChoose(line.pv,`Engine option · ${sanFor(fen,line.move)}`)}>Try engine {sanFor(fen,line.move)}</button><small>Depth {line.depth} · a possible continuation, not a prediction.</small></article>)}</div>}
    </div>
   </>}
   <p className="opening-lab-footnote">Use Next or Play line to watch a reference unfold, or make your own legal replies. The move coach follows your branch and separates board facts from possible plans for both sides.</p>
  </div>
 </section>;
}
