let context:AudioContext|undefined;
export function enableSounds(){try{context??=new AudioContext();void context.resume().catch(()=>{});}catch{/* Sound is optional. */}}
export function playMoveTone(capture=false){
 if(!context||context.state!=='running')return;
 const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
 osc.type='sine';osc.frequency.setValueAtTime(capture?430:720,now);osc.frequency.exponentialRampToValueAtTime(capture?190:390,now+.09);
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.07,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);
 osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.13);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
