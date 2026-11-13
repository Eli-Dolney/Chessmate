import {useEffect,useRef,useState} from 'react';
import {Chess,type Square,type PieceSymbol} from 'chess.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {Appearance} from './appearance';

type Arrow={move:string;kind:'original'|'alternative'|'reply'};
interface Props {fen:string;flipped:boolean;appearance:Appearance;selected:Square|null;targets:string[];marked:string[];last?:string;arrows:Arrow[];onSquare:(s:Square)=>void;onFallback:()=>void}
const palettes:Record<Appearance['board'],[number,number,number]>={nebula:[0x8888b2,0x302348,0x181227],aurora:[0x8ac5b9,0x254f4d,0x112e30],obsidian:[0x87909f,0x252932,0x15171f],classic:[0xe6dfbb,0x71845c,0x293c30],ember:[0xd7ac79,0x693e35,0x261d23],ocean:[0x91b9c7,0x214d66,0x112d40],walnut:[0xd0a77e,0x6b4029,0x38261d],neon:[0x8284ae,0x27203f,0x131326]};
function point(square:string,y=.13){return new T.Vector3(square.charCodeAt(0)-100.5,y,4.5-Number(square[1]));}
function dispose(group:T.Object3D){const materials=new Set<T.Material>(),textures=new Set<T.Texture>();group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);const map=(m as T.MeshStandardMaterial).map;if(map)textures.add(map);}}});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
function galaxy(white:boolean){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;const g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,white?'#d4fbff':'#261338');g.addColorStop(.45,white?'#789bcf':'#9256c0');g.addColorStop(.7,white?'#d9e7ff':'#382469');g.addColorStop(1,white?'#65c6cf':'#191c48');c.fillStyle=g;c.fillRect(0,0,256,256);for(let i=0;i<90;i++){c.fillStyle=i%3?'#ffffff80':'#fff';c.beginPath();c.arc((i*73)%256,(i*117+31)%256,i%7===0?1.7:.6,0,Math.PI*2);c.fill();}const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;}
function piece(type:PieceSymbol,white:boolean,appearance:Appearance){
 const g=new T.Group(),style=appearance.pieces,faceted=style==='crystal';
 const colors=style==='gilded'?[0xf0cb78,0x5b3b25]:style==='neon'?[0x75efff,0xcc66e3]:style==='classic'?[0xf4ebd1,0x244336]:[0xd7edf5,0x583876];
 const material=new T.MeshPhysicalMaterial({color:style==='galaxy'?0xffffff:colors[white?0:1],map:style==='galaxy'?galaxy(white):null,metalness:style==='gilded'?.72:.15,roughness:style==='porcelain'?.22:.3,clearcoat:1,clearcoatRoughness:.18,flatShading:faceted,emissive:style==='neon'?colors[white?0:1]:0,emissiveIntensity:.2});
 const mesh=(geometry:T.BufferGeometry,y=0,x=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const tall=type==='q'||type==='k',height=type==='p'?.5:tall?.91:.72;
 const profile=[[.01,0],[.31,0],[.34,.06],[.34,.12],[.28,.17],[.26,.22],[.17,.28],[.13,height-.12],[.23,height-.06],[.24,height],[.01,height]];
 mesh(new T.LatheGeometry(profile.map(([x,y])=>new T.Vector2(x,y)),faceted?10:28));
 if(type==='p')mesh(new T.SphereGeometry(.18,20,14),height+.15);
 if(type==='b'){const head=mesh(new T.SphereGeometry(.19,faceted?8:20,14),height+.2);head.scale.y=1.5;mesh(new T.SphereGeometry(.065,12,8),height+.49);const slit=new T.Mesh(new T.BoxGeometry(.03,.28,.36),new T.MeshStandardMaterial({color:0x15182a}));slit.position.y=height+.25;slit.rotation.z=-.4;g.add(slit);}
 if(type==='r'){mesh(new T.CylinderGeometry(.29,.24,.19,24),height+.08);for(let i=0;i<6;i++)mesh(new T.BoxGeometry(.15,.16,.15),height+.23,Math.cos(i*Math.PI/3)*.22,Math.sin(i*Math.PI/3)*.22);}
 if(type==='q'){mesh(new T.SphereGeometry(.16,20,14),height+.12);for(let i=0;i<5;i++){const x=Math.cos(i*Math.PI*.4)*.19,z=Math.sin(i*Math.PI*.4)*.19;mesh(new T.ConeGeometry(.075,.28,12),height+.25,x,z);mesh(new T.SphereGeometry(.055,10,8),height+.4,x,z);}}
 if(type==='k'){mesh(new T.SphereGeometry(.18,20,14),height+.12);mesh(new T.BoxGeometry(.09,.38,.09),height+.4);mesh(new T.BoxGeometry(.3,.09,.09),height+.46);}
 if(type==='n'){const shape=new T.Shape();shape.moveTo(-.23,0);shape.lineTo(.19,0);shape.lineTo(.12,.25);shape.lineTo(.36,.32);shape.lineTo(.34,.48);shape.lineTo(.16,.64);shape.lineTo(.11,.8);shape.lineTo(-.03,.65);shape.lineTo(-.17,.58);shape.lineTo(-.28,.3);shape.closePath();const head=mesh(new T.ExtrudeGeometry(shape,{depth:.23,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1}),.3,0,-.115);head.rotation.y=white?-Math.PI/2:Math.PI/2;}
 return g;
}
export default function BoardScene(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const api=useRef<{update:()=>void;reset:()=>void;orbit:(angle:number)=>void;zoom:(factor:number)=>void}|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  const container=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{setError('3D graphics are unavailable in this browser. Your flat board is still ready.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D chess board. Drag to orbit, scroll to zoom. Arrow keys rotate, plus and minus zoom, Home resets.');container.appendChild(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.1,80),controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=9;controls.maxDistance=24;controls.minPolarAngle=.08;controls.maxPolarAngle=1.35;
  const [light,dark,frame]=palettes[props.appearance.board];
  scene.add(new T.HemisphereLight(0xe4ebff,0x3a284c,2.6));const sun=new T.DirectionalLight(0xffeccf,4);sun.position.set(-3,10,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6});sun.shadow.bias=-.001;scene.add(sun);const rim=new T.DirectionalLight(0x9eaaff,2);rim.position.set(5,6,-7);scene.add(rim);
  const base=new T.Mesh(new T.BoxGeometry(8.7,.4,8.7),new T.MeshStandardMaterial({color:frame,roughness:.3,metalness:.35}));base.position.y=-.18;base.receiveShadow=true;scene.add(base);
  const table=new T.Mesh(new T.CylinderGeometry(7.7,8,.22,80),new T.MeshStandardMaterial({color:0x191d29,roughness:.85}));table.position.y=-.5;table.receiveShadow=true;scene.add(table);
  const tiles=new T.Group();scene.add(tiles);for(let rank=1;rank<=8;rank++)for(let file=0;file<8;file++){const square=String.fromCharCode(97+file)+rank,tile=new T.Mesh(new T.BoxGeometry(.995,.1,.995),new T.MeshPhysicalMaterial({color:(file+rank)%2===1?dark:light,roughness:.37,metalness:.12,clearcoat:.6}));tile.position.copy(point(square,.07));tile.userData.square=square;tile.receiveShadow=true;tiles.add(tile);}
  // Coordinates are original canvas textures, bundled implicitly in this code.
  const labelTextures:T.Texture[]=[];for(let i=0;i<8;i++)for(const [text,x,z] of [[String.fromCharCode(97+i),i-3.5,4.2],[String(i+1),-4.2,3.5-i]] as [string,number,number][]){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;ctx.font='36px sans-serif';ctx.fillStyle='#e5dfce';ctx.textAlign='center';ctx.fillText(text,32,45);const texture=new T.CanvasTexture(c);labelTextures.push(texture);const m=new T.Mesh(new T.PlaneGeometry(.25,.25),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.035,z);scene.add(m);}
  let pieces=new T.Group(),marks=new T.Group();scene.add(pieces,marks);let frameId=0;
  const render=()=>{cancelAnimationFrame(frameId);frameId=requestAnimationFrame(()=>{renderer.render(scene,camera);canvas.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');});};
  const reset=()=>{camera.position.set(latest.current.flipped?-8:8,12,latest.current.flipped?-13:13);controls.target.set(0,.1,0);controls.update();render();};
  const orbit=(angle:number)=>{const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();render();};
  const zoom=(factor:number)=>{const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()*factor,9,24));camera.position.copy(controls.target).add(offset);controls.update();render();};
  const update=()=>{
   scene.remove(pieces,marks);dispose(pieces);dispose(marks);pieces=new T.Group();marks=new T.Group();scene.add(pieces,marks);
   const p=latest.current,board=new Chess(p.fen);for(const row of board.board())for(const entry of row){if(!entry)continue;const model=piece(entry.type,entry.color==='w',p.appearance);model.position.copy(point(entry.square));model.traverse(o=>o.userData.square=entry.square);pieces.add(model);}
   const ring=(square:string,color:number,solid=false)=>{const m=new T.Mesh(solid?new T.CircleGeometry(.13,24):new T.RingGeometry(.36,.41,32),new T.MeshBasicMaterial({color,side:T.DoubleSide,depthTest:false,transparent:true,opacity:.92}));m.rotation.x=-Math.PI/2;m.position.copy(point(square,.14));m.renderOrder=2;marks.add(m);};
   if(p.last){ring(p.last.slice(0,2),0xe6ca80);ring(p.last.slice(2,4),0xe6ca80);}if(p.selected)ring(p.selected,0x63e6dc);p.targets.forEach(s=>ring(s,0x63e6dc,!board.get(s as Square)));p.marked.forEach(s=>ring(s,0xf3a0dc));
   for(const a of p.arrows){const from=point(a.move.slice(0,2),.2),to=point(a.move.slice(2,4),.2),direction=to.clone().sub(from),length=direction.length(),color=a.kind==='original'?0xffc777:a.kind==='alternative'?0x63e6dc:0xf3a0dc;direction.normalize();const material=new T.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.9});const shaft=new T.Mesh(new T.CylinderGeometry(.045,.045,Math.max(.01,length-.25),10),material);shaft.position.copy(from).addScaledVector(direction,(length-.25)/2);shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);shaft.renderOrder=5;const tip=new T.Mesh(new T.ConeGeometry(.17,.35,16),material);tip.position.copy(to).addScaledVector(direction,-.1);tip.quaternion.copy(shaft.quaternion);tip.renderOrder=5;marks.add(shaft,tip);}
   canvas.dataset.position=p.fen;canvas.dataset.pieces=String(pieces.children.length);canvas.dataset.arrows=String(p.arrows.length);render();
  };
  api.current={update,reset,orbit,zoom};controls.addEventListener('change',render);
  const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();});resize.observe(container);
  let down:{x:number;y:number}|null=null,moved=false;const pointerDown=(e:PointerEvent)=>{down=e.button===0?{x:e.clientX,y:e.clientY}:null;moved=false;};const pointerMove=(e:PointerEvent)=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;};
  const pointerUp=(e:PointerEvent)=>{if(!down||moved){down=null;return;}down=null;const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects([pieces,tiles],true).find(h=>h.object.userData.square);if(hit)latest.current.onSquare(hit.object.userData.square as Square);};
  const key=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();else if(e.key==='ArrowLeft'||e.key==='ArrowRight')orbit(e.key==='ArrowLeft'?.15:-.15);else if(e.key==='ArrowUp'||e.key==='ArrowDown'){const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.phi=T.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.1:.1),.08,1.35);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();render();}else zoom(e.key==='-'?1.1:.9);};
  const lost=(e:Event)=>{e.preventDefault();setError('The 3D graphics context was interrupted. Switch to the flat board, then try 3D again.');};
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',lost);reset();update();
  return()=>{api.current=null;resize.disconnect();controls.dispose();cancelAnimationFrame(frameId);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',lost);sun.shadow.dispose();dispose(scene);labelTextures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();};
 },[props.appearance.board,props.appearance.pieces]);
 useEffect(()=>{api.current?.update();},[props.fen,props.selected,props.targets.join(','),props.marked.join(','),props.last,JSON.stringify(props.arrows)]);
 useEffect(()=>{api.current?.reset();},[props.flipped]);
 return <div className="scene-shell"><div ref={host} className="board-scene"/>{error&&<div className="scene-error" role="alert"><p>{error}</p><button onClick={props.onFallback}>Use flat board</button></div>}<div className="scene-controls"><button aria-label="Rotate board left" onClick={()=>api.current?.orbit(.3)}>↶ Rotate</button><button aria-label="Rotate board right" onClick={()=>api.current?.orbit(-.3)}>Rotate ↷</button><button aria-label="Zoom in" onClick={()=>api.current?.zoom(.9)}>＋</button><button aria-label="Zoom out" onClick={()=>api.current?.zoom(1.1)}>−</button><button onClick={()=>api.current?.reset()}>Reset camera</button></div><p className="scene-help">Drag to look around · scroll or pinch to zoom · click a piece, then its destination. Switch to 2D for square-by-square keyboard play and drawing arrows.</p></div>;
}
