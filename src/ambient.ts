import {useEffect,useRef,useState} from 'react';
import type {RoomSettings} from './appearance';

export type AmbientState='off'|'ready'|'playing'|'unavailable';
/** Original, synthesized sound beds. No recordings, network requests, or automatic unlock. */
export class AmbientPlayer {
 private context:AudioContext|undefined;
 private sources:(AudioBufferSourceNode|OscillatorNode)[]=[];
 private nodes:AudioNode[]=[];
 constructor(private factory:()=>AudioContext=()=>new AudioContext()){}
 async unlock(){this.context??=this.factory();await this.context.resume();return this.context.state==='running';}
 stop(){for(const source of this.sources){try{source.stop();}catch{/* Already stopped. */}}this.sources=[];for(const node of this.nodes)node.disconnect();this.nodes=[];}
 play(room:RoomSettings){
  this.stop();const context=this.context;if(!context||context.state!=='running'||room.ambient==='off'||room.volume===0)return false;
  const master=context.createGain();master.gain.value=room.volume*.2;master.connect(context.destination);this.nodes.push(master);
  if(room.ambient==='space'){
   for(const frequency of [55,82.4,110]){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=.22;oscillator.connect(gain);gain.connect(master);oscillator.start();this.sources.push(oscillator);this.nodes.push(oscillator,gain);}
  }else{
   const buffer=context.createBuffer(1,context.sampleRate*6,context.sampleRate),samples=buffer.getChannelData(0);let seed=1741,previous=0;
   for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;previous=.93*previous+.07*noise;samples[i]=room.ambient==='rain'?noise*.65:previous*3+(i%15013<24?noise*.22:0);}
   const source=context.createBufferSource(),filter=context.createBiquadFilter();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=room.ambient==='rain'?2400:750;source.connect(filter);filter.connect(master);source.start();this.sources.push(source);this.nodes.push(source,filter);
  }
  return true;
 }
 suspend(){this.stop();void this.context?.suspend().catch(()=>{});}
 dispose(){this.stop();void this.context?.close().catch(()=>{});this.context=undefined;}
}

export function useAmbient(room:RoomSettings):AmbientState {
 const player=useRef<AmbientPlayer|null>(null),allowed=useRef(false),latest=useRef(room),serial=useRef(0);
 latest.current=room;
 const [state,setState]=useState<AmbientState>(room.ambient==='off'?'off':'ready');
 useEffect(()=>{
  const audio=new AmbientPlayer();player.current=audio;let alive=true;
  const start=async()=>{allowed.current=true;const token=++serial.current;try{const unlocked=await audio.unlock();if(!alive||token!==serial.current||!allowed.current)return;if(document.hidden){audio.suspend();setState(latest.current.ambient==='off'?'off':'ready');return;}setState(audio.play(latest.current)&&unlocked?'playing':latest.current.ambient==='off'?'off':'ready');}catch{if(alive&&token===serial.current)setState('unavailable');}};
  const pause=()=>{allowed.current=false;serial.current++;audio.suspend();setState(latest.current.ambient==='off'?'off':'ready');};
  const visibility=()=>{if(document.hidden){serial.current++;audio.suspend();setState(latest.current.ambient==='off'?'off':'ready');}else if(allowed.current&&latest.current.ambient!=='off')void start();};
  window.addEventListener('chessmate-ambient-start',start);window.addEventListener('chessmate-ambient-pause',pause);document.addEventListener('visibilitychange',visibility);
  return()=>{alive=false;allowed.current=false;serial.current++;window.removeEventListener('chessmate-ambient-start',start);window.removeEventListener('chessmate-ambient-pause',pause);document.removeEventListener('visibilitychange',visibility);audio.dispose();player.current=null;};
 },[]);
 useEffect(()=>{
  if(room.ambient==='off'){allowed.current=false;serial.current++;player.current?.suspend();setState('off');return;}
  if(!allowed.current||document.hidden){player.current?.stop();setState('ready');return;}
  setState(player.current?.play(room)?'playing':'ready');
 },[room.ambient,room.volume]);
 return state;
}
