import * as T from 'three';
import type {RoomSettings} from './appearance';

/** Original deterministic textures. No image files or network requests are used. */
export function surfaceTexture(kind:'wood'|'marble'|'smoked',light:boolean){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d')!;
 ctx.fillStyle=kind==='wood'?(light?'#d5ae7d':'#51301e'):kind==='marble'?(light?'#e7e9eb':'#293442'):(light?'#acb7c6':'#28313e');ctx.fillRect(0,0,256,256);
 if(kind==='wood'){
  for(let y=0;y<256;y+=2){ctx.beginPath();ctx.strokeStyle=light?'#7b4e2530':'#efbd7730';ctx.lineWidth=y%7===0?1.5:.5;for(let x=0;x<=256;x+=8){const wave=Math.sin(x*.026+y*.14)*3+Math.sin(x*.012+y*.05)*5;if(!x)ctx.moveTo(x,y+wave);else ctx.lineTo(x,y+wave);}ctx.stroke();}
 }else if(kind==='marble'){
  for(let i=0;i<13;i++){ctx.beginPath();ctx.lineWidth=i%3===0?2:.6;ctx.strokeStyle=light?'#56667a60':'#bbcbe960';for(let y=0;y<=256;y+=4){const x=(i*63)%330-35+y*.35+Math.sin(y*.04+i)*17+Math.cos(y*.09+i)*5;if(!y)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
 }else{
  for(let i=0;i<9;i++){const x=(i*71)%256,y=(i*113)%256,g=ctx.createRadialGradient(x,y,4,x,y,80);g.addColorStop(0,light?'#ffffff33':'#c9d4eb1b');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);}
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;return texture;
}
export function tileMaterials(room:RoomSettings,light:number,dark:number){
 return [true,false].map(isLight=>{
  if(room.material==='palette')return new T.MeshPhysicalMaterial({color:isLight?light:dark,roughness:.37,metalness:.12,clearcoat:.6});
  if(room.material==='wood')return new T.MeshPhysicalMaterial({map:surfaceTexture('wood',isLight),roughness:.5,metalness:0,clearcoat:.35});
  if(room.material==='marble')return new T.MeshPhysicalMaterial({map:surfaceTexture('marble',isLight),roughness:.19,metalness:.08,clearcoat:1});
  if(room.material==='smoked')return new T.MeshPhysicalMaterial({map:surfaceTexture('smoked',isLight),roughness:.12,metalness:.4,clearcoat:1,clearcoatRoughness:.05});
  return new T.MeshPhysicalMaterial({color:isLight?0xa8e4ed:0x26326a,roughness:.18,metalness:.25,clearcoat:1,emissive:isLight?0x88dfe8:0x463fa4,emissiveIntensity:room.effects?.14:0});
 });
}

/** Room dressing never receives square userData and is excluded from move raycasts. */
export function makeRoom(room:RoomSettings){
 const group=new T.Group();group.name=`room-${room.environment}`;
 const matte=(color:number)=>new T.MeshStandardMaterial({color,roughness:.8});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:T.Material)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;group.add(mesh);return mesh;};
 const cylinder=(top:number,bottom:number,height:number,x:number,y:number,z:number,material:T.Material)=>{const mesh=new T.Mesh(new T.CylinderGeometry(top,bottom,height,32),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;group.add(mesh);return mesh;};
 const glow=(color:number,intensity=.5)=>new T.MeshStandardMaterial({color,roughness:.4,emissive:color,emissiveIntensity:room.effects?intensity:0});
 if(room.environment==='studio')return group;
 if(room.environment==='space'){
  const platform=new T.Mesh(new T.CylinderGeometry(8.6,8.8,.5,64),new T.MeshStandardMaterial({color:0x182b40,metalness:.6,roughness:.35}));platform.position.y=-.9;group.add(platform);
  const rim=new T.Mesh(new T.TorusGeometry(8.4,.08,8,80),glow(0x65d8e7,1));rim.rotation.x=Math.PI/2;rim.position.y=-.65;group.add(rim);
  const planet=new T.Mesh(new T.SphereGeometry(3,40,28),new T.MeshStandardMaterial({color:0x53628f,roughness:1}));planet.position.set(-14.5,-3.8,-10.3);group.add(planet);
  const band=new T.Mesh(new T.RingGeometry(3.8,4.8,64),new T.MeshBasicMaterial({color:0x9c82b2,side:T.DoubleSide,transparent:true,opacity:.45}));band.position.copy(planet.position);band.rotation.set(.9,.2,.1);group.add(band);
  if(room.effects){const vertices:number[]=[];for(let i=0;i<600;i++){const angle=i*2.39996,r=36+(i%7)*.6,y=1-2*(i+.5)/600,ring=Math.sqrt(1-y*y);vertices.push(Math.cos(angle)*ring*r,y*r,Math.sin(angle)*ring*r);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));group.add(new T.Points(geometry,new T.PointsMaterial({color:0xc9d8ff,size:.085,sizeAttenuation:true})));}
  return group;
 }
 const study=room.environment==='study',rain=room.environment==='rain';
 const floorMaterial=study?new T.MeshStandardMaterial({map:surfaceTexture('wood',false),roughness:.8}):matte(rain?0x263844:0x747e83);
 box(42,.2,42,0,-3,0,floorMaterial);
 const leg=matte(study?0x4b2d1a:0x19232d);for(const x of [-5,5])for(const z of [-5,5])cylinder(.2,.3,2.3,x,-1.75,z,leg);
 if(study){
  box(27,15,.3,0,4.3,-11,matte(0x273d34));
  const wood=matte(0x623d25),back=matte(0x30251e),colors=[0x6d3b31,0x35514b,0x80724f,0x2a3e60,0x8d6847].map(matte);
  for(const x of [-7,7]){
   box(4,8,.5,x,1,-9.8,back);for(const dx of [-2,2])box(.2,8,1,x+dx,1,-9.3,wood);
   for(let shelf=0;shelf<4;shelf++){const y=-2.7+shelf*1.9;box(4.2,.15,1.2,x,y,-9.3,wood);for(let i=0;i<9;i++){const h=1.15+(i%3)*.15;box(.27,h,.7,x-1.65+i*.39,y+h/2+.1,-9.3,colors[(i+shelf)%colors.length]);}}
  }
  cylinder(.6,.75,.2,6,-2.7,-5,wood);cylinder(.09,.09,5.2,6,0,-5,matte(0x927d4c));
  const shade=new T.Mesh(new T.ConeGeometry(1.2,1.5,32,1,true),new T.MeshStandardMaterial({color:0xe8c388,side:T.DoubleSide,emissive:0x9d6a29,emissiveIntensity:room.effects?.25:0}));shade.position.set(6,2.5,-5);group.add(shade);
  if(room.effects){const lamp=new T.PointLight(0xffbd72,14,10,2);lamp.position.set(6,1.8,-5);group.add(lamp);}
 }else if(rain){
  const glass=new T.MeshBasicMaterial({color:0x506c85,transparent:true,opacity:.6}),frame=matte(0x233743);
  box(22,13,.15,0,3.5,-11,glass);for(const x of [-11,0,11])box(.25,13,.3,x,3.5,-10.8,frame);for(const y of [-3,3.5,10])box(22,.25,.3,0,y,-10.8,frame);
  const skyline=matte(0x142131);for(let i=0;i<17;i++){const h=2+(i*7%11)*.38;box(1.3,h,1,-15+i*1.8,h/2-3,-14,skyline);}
  if(room.effects){const drops=new T.BufferGeometry(),points:number[]=[];for(let i=0;i<130;i++){const x=-10.6+(i*73%211)/10,y=-2.7+(i*47%122)/10;points.push(x,y,-10.65,x-.035,y-.18-(i%4)*.08,-10.65);}drops.setAttribute('position',new T.Float32BufferAttribute(points,3));group.add(new T.LineSegments(drops,new T.LineBasicMaterial({color:0xb7d9ec,transparent:true,opacity:.42})));}
 }else{
  const stripe=matte(0x51646b),white=matte(0xd4d7d3),dark=matte(0x24353e);
  for(let i=-3;i<=3;i++)box(28,.015,.08,0,-2.88,i*4,stripe);
  for(const x of [-10,10])for(const z of [-8,0,8]){cylinder(.14,.24,3.4,x,-1.1,z,dark);box(.16,.12,8,x,.45,z,white);}
  box(22,.2,1,0,7,-10,glow(0xe0eced,.4));box(22,7,.3,0,.5,-16,matte(0x6b7b7d));
 }
 return group;
}
