import {describe,it,expect,vi} from 'vitest';
import {AmbientPlayer} from '../src/ambient';
import {defaultRoom} from '../src/appearance';

function fixture(){
 const sources:{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}[]=[],nodes:{disconnect:ReturnType<typeof vi.fn>}[]=[];
 const node=()=>{const n={connect:vi.fn(),disconnect:vi.fn()};nodes.push(n);return n;};
 const source=()=>{const s={...node(),start:vi.fn(),stop:vi.fn(),frequency:{value:0}};sources.push(s);return s;};
 const context={state:'suspended',sampleRate:10,destination:{},resume:vi.fn(async()=>{context.state='running';}),suspend:vi.fn(async()=>{context.state='suspended';}),close:vi.fn(async()=>{context.state='closed';}),createGain:()=>({...node(),gain:{value:0}}),createOscillator:source,createBufferSource:source,createBiquadFilter:()=>({...node(),frequency:{value:0}}),createBuffer:(_channels:number,length:number)=>({getChannelData:()=>new Float32Array(length)})};
 const factory=vi.fn(()=>context as unknown as AudioContext);
 return {sources,nodes,context,factory,player:new AmbientPlayer(factory)};
}
describe('optional local ambience lifecycle',()=>{
 it('does not create audio until explicit unlock and never starts an off sound',async()=>{const f=fixture();expect(f.player.play({...defaultRoom,ambient:'rain'})).toBe(false);expect(f.factory).not.toHaveBeenCalled();await f.player.unlock();expect(f.player.play(defaultRoom)).toBe(false);expect(f.sources).toHaveLength(0);f.player.dispose();});
 it('stops and disconnects the old sound before changing beds or pausing',async()=>{const f=fixture();await f.player.unlock();expect(f.player.play({...defaultRoom,ambient:'rain'})).toBe(true);const rain=f.sources[0],oldNodes=[...f.nodes];expect(f.player.play({...defaultRoom,ambient:'space'})).toBe(true);expect(rain.stop).toHaveBeenCalledOnce();expect(oldNodes.every(n=>n.disconnect.mock.calls.length===1)).toBe(true);expect(f.sources).toHaveLength(4);f.player.suspend();expect(f.sources.every(s=>s.stop.mock.calls.length===1)).toBe(true);expect(f.context.suspend).toHaveBeenCalledOnce();expect(f.player.play({...defaultRoom,ambient:'fire'})).toBe(false);await f.player.unlock();expect(f.player.play({...defaultRoom,ambient:'fire'})).toBe(true);f.player.dispose();expect(f.context.close).toHaveBeenCalledOnce();});
 it('zero volume releases sources and disposal is safe twice',async()=>{const f=fixture();await f.player.unlock();f.player.play({...defaultRoom,ambient:'fire'});expect(f.player.play({...defaultRoom,ambient:'fire',volume:0})).toBe(false);expect(f.sources[0].stop).toHaveBeenCalledOnce();f.player.dispose();f.player.dispose();expect(f.context.close).toHaveBeenCalledOnce();});
});
