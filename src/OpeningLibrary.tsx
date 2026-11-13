import {useMemo,useState} from 'react';
import {Chess} from 'chess.js';
import {useOpenings,planForOpening} from './openings';
import {lineSan} from './chess';
import type {PositionHistory} from './types';
export default function OpeningLibrary({onExplore}:{onExplore:(root:PositionHistory,pv:string[],label:string)=>void}){
 const {rows,error}=useOpenings(),[query,setQuery]=useState(''),[selected,setSelected]=useState<number|null>(null);
 const results=useMemo(()=>rows.map((r,id)=>({...r,id})).filter(r=>`${r.name} ${r.eco}`.toLowerCase().includes(query.toLowerCase())).slice(0,40),[rows,query]);
 const entry=selected===null?undefined:rows[selected];
 const search=(value:string)=>{setQuery(value);setSelected(null);};
 return <section className="opening-catalog"><div className="section-title"><h2>Opening explorer</h2><span className="small-label">{rows.length.toLocaleString()} LOCAL LINES</span></div><div className="catalog-content"><p>Find a name, play through its moves, then try your own replies. These are reference lines, not forced moves or a ranking.</p><label>Search opening name or ECO code<input type="search" value={query} onChange={e=>search(e.target.value)} placeholder="Try Sicilian, London, or B12"/></label>{error&&<p role="alert">{error}</p>}<div className="catalog-layout"><div className="catalog-results" aria-label="Opening search results">{results.map(r=><button key={r.id} aria-pressed={selected===r.id} onClick={()=>setSelected(r.id)}><span className="tag principle">{r.eco}</span>{r.name}</button>)}{!results.length&&<p>{rows.length?'No matching opening. Try a broader name.':'Loading local catalog…'}</p>}</div><div className="catalog-preview">{entry?<><h3>{entry.name}</h3><p>{planForOpening(entry.name)?.[2]??'Study development, the central pawn structure, and king safety. Use the local coach to check concrete moves in this line.'}</p><p className="notation">{lineSan(new Chess().fen(),entry.moves,entry.moves.length).join(' ')}</p><button className="primary" onClick={()=>onExplore({initialFen:new Chess().fen(),moves:[]},entry.moves,entry.name)}>Explore this opening</button></>:<p>Select an opening to see its moves and enter an interactive board.</p>}</div></div><p className="muted">Opening names: Lichess chess-openings · CC0 · bundled offline. No game-frequency or win-rate statistics.</p></div></section>;
}
