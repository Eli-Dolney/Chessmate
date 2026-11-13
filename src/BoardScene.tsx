import {useEffect,useRef,useState} from 'react';
import {Chess,type Square,type PieceSymbol} from 'chess.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {roomFor,type Appearance} from './appearance';
import {makeRoom,surfaceTexture,tileMaterials} from './sceneRoom';

type Arrow={move:string;kind:'original'|'alternative'|'reply'};
interface Props {fen:string;flipped:boolean;appearance:Appearance;selected:Square|null;targets:string[];marked:string[];last?:string;arrows:Arrow[];onSquare:(s:Square)=>void;onFallback:()=>void}
const palettes:Record<Appearance['board'],[number,number,number]>={nebula:[0x8888b2,0x302348,0x181227],aurora:[0x8ac5b9,0x254f4d,0x112e30],obsidian:[0x87909f,0x252932,0x15171f],classic:[0xe6dfbb,0x71845c,0x293c30],ember:[0xd7ac79,0x693e35,0x261d23],ocean:[0x91b9c7,0x214d66,0x112d40],walnut:[0xd0a77e,0x6b4029,0x38261d],neon:[0x8284ae,0x27203f,0x131326]};
function point(square:string,y=.13){return new T.Vector3(square.charCodeAt(0)-100.5,y,4.5-Number(square[1]));}
function dispose(group:T.Object3D){
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Points||o instanceof T.Line){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);}}if(o instanceof T.Light&&(o as T.DirectionalLight).shadow)(o as T.DirectionalLight).shadow.dispose();});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
function galaxy(white:boolean){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;const g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,white?'#d4fbff':'#261338');g.addColorStop(.45,white?'#789bcf':'#9256c0');g.addColorStop(.7,white?'#d9e7ff':'#382469');g.addColorStop(1,white?'#65c6cf':'#191c48');c.fillStyle=g;c.fillRect(0,0,256,256);for(let i=0;i<90;i++){c.fillStyle=i%3?'#ffffff80':'#fff';c.beginPath();c.arc((i*73)%256,(i*117+31)%256,i%7===0?1.7:.6,0,Math.PI*2);c.fill();}const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;}
// A tiny, original studio reflection gives metal readable highlights even without a room texture.
function metalReflection(){
 const faces=Array.from({length:6},(_,side)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d')!,g=c.createLinearGradient(0,0,64,64);g.addColorStop(0,side===2?'#f7f0de':'#7e8b9d');g.addColorStop(.4,'#354352');g.addColorStop(.48,'#d3dce1');g.addColorStop(.6,'#5c6a7b');g.addColorStop(1,side===3?'#2e3440':'#8795aa');c.fillStyle=g;c.fillRect(0,0,64,64);return canvas;});
 const texture=new T.CubeTexture(faces);texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
function pieceMaterial(white:boolean,appearance:Appearance,reflection:T.CubeTexture|null){
 const style=appearance.pieces,room=roomFor(appearance),faceted=style==='crystal'||style==='future';
 const colors=style==='gilded'?[0xe9c373,0x78513a]:style==='neon'||style==='future'?[0x9ff6ff,0x50385f]:style==='metal'?[0xcbd7e0,0x705747]:style==='frosted'?[0xe4f6fc,0x405a86]:style==='porcelain'?[0xe7e5dc,0x283848]:style==='classic'?[0xe8ddc1,0x244336]:[0xd7edf5,0x583876];
 return new T.MeshPhysicalMaterial({color:style==='galaxy'||style==='wood'?0xffffff:colors[white?0:1],map:style==='galaxy'?galaxy(white):style==='wood'?surfaceTexture('wood',white):null,envMap:reflection,envMapIntensity:reflection?.65:0,metalness:style==='metal'?.7:style==='gilded'?.65:style==='future'?.55:style==='wood'||style==='frosted'?0:.15,roughness:style==='frosted'?.72:style==='wood'?.5:style==='porcelain'?.22:.3,clearcoat:style==='frosted'?.2:1,clearcoatRoughness:.18,flatShading:faceted,emissive:style==='neon'||style==='future'?colors[white?0:1]:0,emissiveIntensity:room.effects?.2:0});
}
function piece(type:PieceSymbol,white:boolean,appearance:Appearance,material:T.MeshPhysicalMaterial,eyeMaterial:T.Material,grooveMaterial:T.Material){
 const g=new T.Group(),style=appearance.pieces,faceted=style==='crystal'||style==='future';
 const mesh=(geometry:T.BufferGeometry,y=0,x=0,z=0,finish:T.Material=material,parent:T.Group=g)=>{const m=new T.Mesh(geometry,finish);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const height=type==='p'?.48:type==='q'?.85:type==='k'?.94:type==='r'?.64:.68;
 const profile=type==='n'
  ?[[.01,0],[.3,0],[.34,.05],[.34,.12],[.28,.18],[.25,.22],[.24,.29],[.01,.29]]
  :[[.01,0],[.3,0],[.34,.05],[.34,.12],[.28,.18],[.25,.23],[.17,.3],[.13,height-.12],[.22,height-.06],[.24,height],[.01,height]];
 mesh(new T.LatheGeometry(profile.map(([x,y])=>new T.Vector2(x,y)),style==='future'?6:faceted?10:32));
 if(style==='future'){for(const y of [.16,.24]){const ring=mesh(new T.TorusGeometry(.27,.018,6,12),y);ring.rotation.x=Math.PI/2;}}
 if(type==='p')mesh(new T.SphereGeometry(.18,faceted?12:24,16),height+.15);
 if(type==='b'){
  const head=mesh(new T.SphereGeometry(.19,faceted?10:28,20),height+.2);head.scale.y=1.5;
  mesh(new T.SphereGeometry(.05,14,10),height+.5);
  // Shallow contrasting seams follow the mitre's surface on both faces, rather than a box through its center.
  for(const sign of [-1,1]){const points=[];for(let i=0;i<=16;i++){const t=i/16,x=-.09+.17*t,y=-.06+.27*t,z=Math.sqrt(Math.max(.001,.19*.19-x*x-(y/1.5)**2))+.003;points.push(new T.Vector3(x,height+.2+y,sign*z));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),20,.013,6,false),0,0,0,grooveMaterial);}
 }
 if(type==='r'){
  mesh(new T.CylinderGeometry(.28,.23,.18,faceted?12:32),height+.08);
  const inset=mesh(new T.CircleGeometry(.17,24),height+.175,0,0,grooveMaterial);inset.rotation.x=-Math.PI/2;
  for(let i=0;i<4;i++){const angle=i*Math.PI/2,crenel=mesh(new T.BoxGeometry(.17,.16,.19),height+.22,Math.cos(angle)*.225,Math.sin(angle)*.225);crenel.rotation.y=-angle;}
 }
 if(type==='q'){
  mesh(new T.SphereGeometry(.14,20,14),height+.1);
  const crown=mesh(new T.TorusGeometry(.2,.035,8,24),height+.1);crown.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){const x=Math.cos(i*Math.PI*.4)*.19,z=Math.sin(i*Math.PI*.4)*.19;mesh(new T.ConeGeometry(.065,.26,faceted?6:12),height+.24,x,z);mesh(new T.SphereGeometry(.05,12,8),height+.38,x,z);}
 }
 if(type==='k'){
  mesh(new T.SphereGeometry(.17,24,16),height+.11);
  mesh(new T.BoxGeometry(.115,.43,.115),height+.43);
  mesh(new T.BoxGeometry(.35,.11,.115),height+.5);
 }
 if(type==='n'){
  // A low plinth supports one continuous horse neck. Its muzzle points toward the opponent.
  const horse=new T.Group();horse.position.y=.27;horse.rotation.y=white?Math.PI/3:-2*Math.PI/3;g.add(horse);
  const shape=new T.Shape();shape.moveTo(-.24,0);shape.bezierCurveTo(-.29,.18,-.27,.4,-.19,.59);shape.quadraticCurveTo(-.14,.72,.025,.7);shape.bezierCurveTo(.15,.64,.26,.56,.36,.49);shape.lineTo(.36,.37);shape.lineTo(.22,.34);shape.lineTo(.095,.41);shape.bezierCurveTo(.035,.29,.075,.12,.22,0);shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth:.22,curveSegments:faceted?4:16,bevelEnabled:true,bevelThickness:.055,bevelSize:.045,bevelSegments:faceted?1:5,steps:1});geometry.translate(0,0,-.11);mesh(geometry,0,0,0,material,horse);
  const cheek=mesh(new T.SphereGeometry(.15,faceted?10:24,16),.48,.08,0,material,horse);cheek.scale.set(.85,1.05,1.25);
  const muzzle=mesh(new T.SphereGeometry(.12,faceted?10:24,16),.425,.285,0,material,horse);muzzle.scale.set(1.05,.65,1.38);
  for(const sign of [-1,1]){
   const ear=mesh(new T.ConeGeometry(.058,.25,faceted?5:12),.77,-.055,sign*.10,material,horse);ear.rotation.z=.16;ear.rotation.x=sign*.12;ear.scale.z=.75;
   const eye=mesh(new T.SphereGeometry(.027,12,8),.57,.135,sign*.18,eyeMaterial,horse);eye.scale.z=.4;
   const nostril=mesh(new T.SphereGeometry(.014,10,6),.435,.325,sign*.155,grooveMaterial,horse);nostril.scale.z=.35;
   const mane=new T.CatmullRomCurve3([new T.Vector3(-.18,.1,sign*.172),new T.Vector3(-.16,.28,sign*.172),new T.Vector3(-.10,.47,sign*.172),new T.Vector3(-.055,.62,sign*.172)]);mesh(new T.TubeGeometry(mane,12,.009,5,false),0,0,0,grooveMaterial,horse);
  }
 }
 return g;
}
export default function BoardScene(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const cameraPose=useRef<{position:number[];target:number[];flipped:boolean}|null>(null);
 const room=roomFor(props.appearance);
 const api=useRef<{update:()=>void;reset:()=>void;orbit:(angle:number)=>void;zoom:(factor:number)=>void;lighting:()=>void}|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  const container=host.current!;setError('');let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{setError('3D graphics are unavailable in this browser. Your flat board is still ready.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=room.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D chess board. Drag to orbit, scroll to zoom. Arrow keys rotate, plus and minus zoom, Home resets.');container.appendChild(canvas);
  canvas.dataset.environment=room.environment;canvas.dataset.material=room.material;canvas.dataset.light=room.lightColor;canvas.dataset.brightness=String(room.brightness);canvas.dataset.shadows=String(room.shadows);canvas.dataset.effects=String(room.effects);canvas.dataset.pieceStyle=props.appearance.pieces;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.1,80),controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=9;controls.maxDistance=24;controls.minPolarAngle=.08;controls.maxPolarAngle=1.35;
  const [light,dark,frame]=palettes[props.appearance.board];
  scene.add(makeRoom(room));if(room.environment!=='studio')scene.background=new T.Color(room.environment==='space'?0x090e21:room.environment==='study'?0x25352e:room.environment==='rain'?0x263b4d:0x6c7b83);
  const ambientLight=new T.HemisphereLight(0xe4ebff,0x3a284c,2.6*room.brightness);scene.add(ambientLight);const sun=new T.DirectionalLight(room.lightColor,4*room.brightness);sun.position.set(-3,10,5);sun.castShadow=room.shadows;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6});sun.shadow.bias=-.001;scene.add(sun);const rim=new T.DirectionalLight(0x9eaaff,2*room.brightness);rim.position.set(5,6,-7);scene.add(rim);
  const base=new T.Mesh(new T.BoxGeometry(8.7,.4,8.7),new T.MeshStandardMaterial({color:frame,roughness:.3,metalness:.35}));base.position.y=-.18;base.receiveShadow=true;scene.add(base);
  const table=new T.Mesh(new T.CylinderGeometry(7.7,8,.22,80),new T.MeshStandardMaterial({color:room.environment==='study'?0xffffff:room.environment==='tournament'?0xbfc7c8:0x191d29,map:room.environment==='study'?surfaceTexture('wood',false):null,roughness:.85}));table.position.y=-.5;table.receiveShadow=true;scene.add(table);
  const tileFinishes=tileMaterials(room,light,dark);
  const tiles=new T.Group();scene.add(tiles);for(let rank=1;rank<=8;rank++)for(let file=0;file<8;file++){const square=String.fromCharCode(97+file)+rank,tile=new T.Mesh(new T.BoxGeometry(.995,.1,.995),tileFinishes[(file+rank)%2===1?1:0]);tile.position.copy(point(square,.07));tile.userData.square=square;tile.receiveShadow=true;tiles.add(tile);}
  // Coordinates are original canvas textures, bundled implicitly in this code.
  for(let i=0;i<8;i++)for(const [text,x,z] of [[String.fromCharCode(97+i),i-3.5,4.2],[String(i+1),-4.2,3.5-i]] as [string,number,number][]){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;ctx.font='36px sans-serif';ctx.fillStyle='#e5dfce';ctx.textAlign='center';ctx.fillText(text,32,45);const texture=new T.CanvasTexture(c);const m=new T.Mesh(new T.PlaneGeometry(.25,.25),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.035,z);scene.add(m);}
  let pieces=new T.Group(),marks=new T.Group();scene.add(pieces,marks);let frameId=0;
  const render=()=>{cancelAnimationFrame(frameId);frameId=requestAnimationFrame(()=>{renderer.render(scene,camera);canvas.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');});};
  const reset=()=>{camera.position.set(latest.current.flipped?-8:8,12,latest.current.flipped?-13:13);controls.target.set(0,.1,0);controls.update();render();};
  const orbit=(angle:number)=>{const offset=camera.position.clone().sub(controls.target).applyAxisAngle(new T.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();render();};
  const zoom=(factor:number)=>{const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()*factor,9,24));camera.position.copy(controls.target).add(offset);controls.update();render();};
  const update=()=>{
   scene.remove(pieces,marks);dispose(pieces);dispose(marks);pieces=new T.Group();marks=new T.Group();scene.add(pieces,marks);
   const p=latest.current,board=new Chess(p.fen),reflection=['metal','gilded'].includes(p.appearance.pieces)?metalReflection():null,pieceFinishes=[pieceMaterial(true,p.appearance,reflection),pieceMaterial(false,p.appearance,reflection)],eyes=[new T.MeshStandardMaterial({color:0x172737,roughness:.4}),new T.MeshStandardMaterial({color:0xdfded0,roughness:.4})],groove=new T.MeshStandardMaterial({color:0x15202b,roughness:.85});for(const row of board.board())for(const entry of row){if(!entry)continue;const model=piece(entry.type,entry.color==='w',p.appearance,pieceFinishes[entry.color==='w'?0:1],eyes[entry.color==='w'?0:1],groove);model.position.copy(point(entry.square));model.traverse(o=>o.userData.square=entry.square);pieces.add(model);}
   const ring=(square:string,color:number,solid=false)=>{const m=new T.Mesh(solid?new T.CircleGeometry(.13,24):new T.RingGeometry(.36,.41,32),new T.MeshBasicMaterial({color,side:T.DoubleSide,depthTest:false,transparent:true,opacity:.92}));m.rotation.x=-Math.PI/2;m.position.copy(point(square,.14));m.renderOrder=2;marks.add(m);};
   if(p.last){ring(p.last.slice(0,2),0xe6ca80);ring(p.last.slice(2,4),0xe6ca80);}if(p.selected)ring(p.selected,0x63e6dc);p.targets.forEach(s=>ring(s,0x63e6dc,!board.get(s as Square)));p.marked.forEach(s=>ring(s,0xf3a0dc));
   for(const a of p.arrows){const from=point(a.move.slice(0,2),.2),to=point(a.move.slice(2,4),.2),direction=to.clone().sub(from),length=direction.length(),color=a.kind==='original'?0xffc777:a.kind==='alternative'?0x63e6dc:0xf3a0dc;direction.normalize();const material=new T.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.9});const shaft=new T.Mesh(new T.CylinderGeometry(.045,.045,Math.max(.01,length-.25),10),material);shaft.position.copy(from).addScaledVector(direction,(length-.25)/2);shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);shaft.renderOrder=5;const tip=new T.Mesh(new T.ConeGeometry(.17,.35,16),material);tip.position.copy(to).addScaledVector(direction,-.1);tip.quaternion.copy(shaft.quaternion);tip.renderOrder=5;marks.add(shaft,tip);}
   for(const finish of [...eyes,groove]){let used=false;pieces.traverse(o=>{if(o instanceof T.Mesh&&o.material===finish)used=true;});if(!used)finish.dispose();}
   canvas.dataset.position=p.fen;canvas.dataset.pieces=String(pieces.children.length);canvas.dataset.arrows=String(p.arrows.length);render();
  };
  const lighting=()=>{const settings=roomFor(latest.current.appearance);renderer.shadowMap.enabled=settings.shadows;sun.castShadow=settings.shadows;sun.color.set(settings.lightColor);sun.intensity=4*settings.brightness;ambientLight.intensity=2.6*settings.brightness;rim.intensity=2*settings.brightness;canvas.dataset.light=settings.lightColor;canvas.dataset.brightness=String(settings.brightness);canvas.dataset.shadows=String(settings.shadows);render();};
  api.current={update,reset,orbit,zoom,lighting};controls.addEventListener('change',render);
  const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();});resize.observe(container);
  let down:{x:number;y:number}|null=null,moved=false;const pointerDown=(e:PointerEvent)=>{down=e.button===0?{x:e.clientX,y:e.clientY}:null;moved=false;};const pointerMove=(e:PointerEvent)=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;};
  const pointerUp=(e:PointerEvent)=>{if(!down||moved){down=null;return;}down=null;const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects([pieces,tiles],true).find(h=>h.object.userData.square);if(hit)latest.current.onSquare(hit.object.userData.square as Square);};
  const key=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();else if(e.key==='ArrowLeft'||e.key==='ArrowRight')orbit(e.key==='ArrowLeft'?.15:-.15);else if(e.key==='ArrowUp'||e.key==='ArrowDown'){const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.phi=T.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.1:.1),.08,1.35);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();render();}else zoom(e.key==='-'?1.1:.9);};
  const lost=(e:Event)=>{e.preventDefault();setError('The 3D graphics context was interrupted. Switch to the flat board, then try 3D again.');};
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',lost);
  const pose=cameraPose.current;if(pose&&pose.flipped===props.flipped){camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);controls.update();render();}else reset();update();
  return()=>{cameraPose.current={position:camera.position.toArray(),target:controls.target.toArray(),flipped:latest.current.flipped};api.current=null;resize.disconnect();controls.dispose();cancelAnimationFrame(frameId);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',lost);dispose(scene);renderer.dispose();renderer.forceContextLoss();canvas.remove();};
 },[props.appearance.board,props.appearance.pieces,room.environment,room.material,room.effects]);
 useEffect(()=>{api.current?.update();},[props.fen,props.selected,props.targets.join(','),props.marked.join(','),props.last,JSON.stringify(props.arrows)]);
 useEffect(()=>{api.current?.reset();},[props.flipped]);
 useEffect(()=>{api.current?.lighting();},[room.lightColor,room.brightness,room.shadows]);
 return <div className="scene-shell"><div ref={host} className="board-scene"/>{error&&<div className="scene-error" role="alert"><p>{error}</p><button onClick={props.onFallback}>Use flat board</button></div>}<div className="scene-controls"><button aria-label="Rotate board left" onClick={()=>api.current?.orbit(.3)}>↶ Rotate</button><button aria-label="Rotate board right" onClick={()=>api.current?.orbit(-.3)}>Rotate ↷</button><button aria-label="Zoom in" onClick={()=>api.current?.zoom(.9)}>＋</button><button aria-label="Zoom out" onClick={()=>api.current?.zoom(1.1)}>−</button><button onClick={()=>api.current?.reset()}>Reset camera</button></div><p className="scene-help">Drag to look around · scroll or pinch to zoom · click a piece, then its destination. Switch to 2D for square-by-square keyboard play and drawing arrows.</p></div>;
}
