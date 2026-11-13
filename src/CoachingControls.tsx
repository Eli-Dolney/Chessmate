import {coachPreset,coachingMode,type CoachingPreset} from './coachingPreferences';
import type {CoachPreferences} from './types';

const modes:{id:CoachingPreset;label:string;summary:string}[]=[
 {id:'play',label:'Just play',summary:'The computer replies automatically. Add help whenever you want.'},
 {id:'opening',label:'Opening help',summary:'Opening names and ideas while play continues.'},
 {id:'full',label:'Full coaching',summary:'Move explanations, planning ideas, and a pause after your moves.'},
];
const options:[keyof Pick<CoachPreferences,'enabled'|'threats'|'openings'|'plans'|'suggestions'|'captures'|'lineCommentary'|'pauseAfterMove'>,string][]=[
 ['enabled','Show coach assistance'],['openings','Show opening help'],['threats','Show threat checks'],['plans','Show position plans'],['suggestions','Show suggested moves'],['captures','Show capture inspection'],['lineCommentary','Explain moves as they play'],['pauseAfterMove','Pause after my moves'],
];
export default function CoachingControls({prefs,onChange,exploring}:{prefs:CoachPreferences;onChange:(prefs:CoachPreferences)=>void;exploring:boolean}){
 const mode=coachingMode(prefs);
 const change=(key:typeof options[number][0],checked:boolean)=>{
  const assistanceOption=['threats','openings','plans','suggestions','captures'].includes(key);
  onChange({...prefs,[key]:checked,...(checked&&assistanceOption?{enabled:true}:{})});
 };
 return <section className="coaching-controls" aria-label="Play & coaching">
  <div className="coaching-controls-heading"><strong>Play & coaching</strong><span>Change at any point</span></div>
  <div className="coaching-presets" role="group" aria-label="Coaching presets">{modes.map(item=><button key={item.id} aria-pressed={mode===item.id} onClick={()=>onChange(coachPreset(prefs,item.id))}>{item.label}</button>)}</div>
  <p className="coaching-mode-summary">{modes.find(item=>item.id===mode)?.summary??`Custom help · ${prefs.pauseAfterMove===false?'computer replies automatically':'pause after your moves'}.`}</p>
  {exploring&&<p className="coaching-exploration-note">Your real game is paused while exploring. Use Return to game to resume it with these settings.</p>}
  <details className="coaching-customize"><summary>Customize help{mode==='custom'?' · custom settings':''}</summary>
   <label className="coaching-detail-choice">Explanation length<select aria-label="Explanation length" value={prefs.detail??'detailed'} onChange={e=>onChange({...prefs,detail:e.target.value as 'brief'|'detailed'})}><option value="brief">Short explanations</option><option value="detailed">Longer explanations</option></select></label>
   <div className="coaching-option-grid">{options.map(([key,label])=><label key={key}><input type="checkbox" checked={prefs[key]??true} onChange={e=>change(key,e.target.checked)}/><span>{label}</span></label>)}</div>
   <p>Turn on only the help you need. Suggested moves are optional; opening help can stay on without pausing play.</p>
  </details>
 </section>;
}
