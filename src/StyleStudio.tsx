import {useEffect,useRef} from 'react';
import {Piece} from './Board';
import {presets,type Appearance,type PieceStyle} from './appearance';
import {enableSounds} from './sound';
export default function StyleStudio({value,onChange,onClose}:{value:Appearance;onChange:(value:Appearance)=>void;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
 return <dialog ref={ref} className="style-studio" onCancel={onClose} aria-labelledby="studio-title">
 <div className="studio-heading"><div><span className="eyebrow">MAKE IT YOUR SPACE</span><h2 id="studio-title">A different kind of chess night.</h2><p>Pick a mood. Mix your pieces. Make yourself at home.</p></div><button className="studio-close" aria-label="Close style studio" onClick={onClose}>×</button></div>
 <div className="style-grid">{presets.map(p=><button key={p.id} className={`style-card ${p.id===value.board?'chosen':''}`} aria-label={p.name} aria-pressed={value.board===p.id} onClick={()=>onChange({...value,board:p.id,pieces:p.pieces})}>
 <div className={`mini-scene scene-${p.id}`}><div className="mini-board">{Array.from({length:16},(_,i)=><span key={i} className={(Math.floor(i/4)+i%4)%2?'mini-dark':'mini-light'}>{i===5?<Piece type="n" color="b" style={p.pieces}/>:i===10?<Piece type="q" color="w" style={p.pieces}/>:null}</span>)}</div><span className="selected-style">{value.board===p.id?'✓':'↗'}</span></div>
 <strong>{p.name}</strong><small>{p.subtitle}</small></button>)}</div>
 <div className="studio-options"><section><h3>Your pieces</h3><p>Mix any piece finish with any board.</p><div className="piece-options">{(['galaxy','crystal','classic'] as PieceStyle[]).map(style=><button key={style} aria-label={`${style} pieces`} aria-pressed={value.pieces===style} className={value.pieces===style?'chosen':''} onClick={()=>onChange({...value,pieces:style})}><div><Piece type="n" color="w" style={style}/><Piece type="n" color="b" style={style}/></div><span>{style}</span></button>)}</div></section>
 <section className="feel-options"><h3>The little details</h3><label><span><strong>Smooth moves</strong><small>Let the pieces glide into place.</small></span><input type="checkbox" checked={value.animations} onChange={e=>onChange({...value,animations:e.target.checked})}/></label><label><span><strong>Move sounds</strong><small>Soft, locally generated tones. Off by default.</small></span><input type="checkbox" checked={value.sounds} onChange={e=>{if(e.target.checked)enableSounds();onChange({...value,sounds:e.target.checked});}}/></label><p className="muted">Your device’s reduced-motion preference is always respected.</p></section></div>
 <div className="studio-footer"><span><span className="local-dot"/> Saved automatically · works offline</span><button className="primary" onClick={onClose}>Back to the board →</button></div>
 </dialog>;
}
