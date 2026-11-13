import {createContext} from 'react';
export type BoardStyle='nebula'|'aurora'|'obsidian'|'classic'|'ember'|'ocean'|'walnut'|'neon';
export type PieceStyle='galaxy'|'crystal'|'classic'|'porcelain'|'gilded'|'neon'|'wood'|'frosted'|'metal'|'future';
export interface RoomSettings {environment:'studio'|'study'|'space'|'rain'|'tournament';material:'palette'|'smoked'|'marble'|'wood'|'crystal';lightColor:string;brightness:number;shadows:boolean;effects:boolean;ambient:'off'|'rain'|'fire'|'space';volume:number}
export const defaultRoom:RoomSettings={environment:'studio',material:'palette',lightColor:'#ffe6c2',brightness:1,shadows:true,effects:true,ambient:'off',volume:.12};
export interface Appearance {room?:RoomSettings;view?:'2d'|'3d';board:BoardStyle;pieces:PieceStyle;animations:boolean;sounds:boolean}
export const defaultAppearance:Appearance={board:'nebula',pieces:'galaxy',animations:true,sounds:false};
export const BoardViewContext=createContext<(view:'2d'|'3d')=>void>(()=>{});
export const AppearanceContext=createContext<Appearance>(defaultAppearance);
export const presets:{id:BoardStyle;name:string;subtitle:string;pieces:PieceStyle}[]=[
 {id:'nebula',name:'Nebula Glass',subtitle:'Starlight, violet mist & frosted glass',pieces:'galaxy'},
 {id:'aurora',name:'Aurora Glass',subtitle:'Northern lights & luminous jade',pieces:'crystal'},
 {id:'obsidian',name:'Obsidian',subtitle:'Smoked glass & silver reflections',pieces:'crystal'},
 {id:'ember',name:'Ember',subtitle:'Copper, amber & a fireside glow',pieces:'gilded'},
 {id:'ocean',name:'Deep Sea',subtitle:'Sapphire glass & pale sea foam',pieces:'porcelain'},
 {id:'walnut',name:'Walnut',subtitle:'Warm wood grain & brass details',pieces:'gilded'},
 {id:'neon',name:'Neon',subtitle:'Electric cyan & midnight violet',pieces:'neon'},
 {id:'classic',name:'Classic',subtitle:'Warm ivory & a familiar green board',pieces:'classic'}
];
export const pieceStyles:{id:PieceStyle;name:string;description:string}[]=[{id:'galaxy',name:'Galaxy',description:'Starlit violet & ice'},{id:'crystal',name:'Crystal',description:'Faceted glass'},{id:'porcelain',name:'Porcelain',description:'Ivory & ink • sculpted forms'},{id:'gilded',name:'Gilded',description:'Brushed gold & dark bronze'},{id:'neon',name:'Neon',description:'Cyan & magenta outlines'},{id:'classic',name:'Classic',description:'Traditional ivory & green'},{id:'wood',name:'Carved wood',description:'Maple & dark walnut'},{id:'frosted',name:'Frosted glass',description:'Icy white & deep blue'},{id:'metal',name:'Metallic',description:'Silver & brushed copper'},{id:'future',name:'Futuristic',description:'Angular forms & luminous accents'}];
export function normalizeAppearance(value:unknown):Appearance{
 if(value===undefined)return {...defaultAppearance};
 if(!value||typeof value!=='object')throw new Error('Invalid appearance settings.');
 const a=value as Appearance;
 if(a.view!==undefined&&!['2d','3d'].includes(a.view))throw new Error('Invalid board view.');
 if(!presets.some(p=>p.id===a.board)||!pieceStyles.some(p=>p.id===a.pieces)||typeof a.animations!=='boolean'||typeof a.sounds!=='boolean')throw new Error('Invalid appearance settings.');
 return {...(a.view?{view:a.view}:{}),board:a.board,pieces:a.pieces,animations:a.animations,sounds:a.sounds,...(a.room===undefined?{}:{room:normalizeRoom(a.room)})};
}


export function roomFor(appearance:Appearance):RoomSettings{return {...defaultRoom,...appearance.room};}
function normalizeRoom(value:unknown):RoomSettings{
 if(!value||typeof value!=='object')throw new Error('Invalid room settings.');
 const r=value as RoomSettings;
 if(!['studio','study','space','rain','tournament'].includes(r.environment)||!['palette','smoked','marble','wood','crystal'].includes(r.material)||!['off','rain','fire','space'].includes(r.ambient)||typeof r.lightColor!=='string'||!/^#[0-9a-f]{6}$/i.test(r.lightColor)||typeof r.shadows!=='boolean'||typeof r.effects!=='boolean'||!Number.isFinite(r.brightness)||r.brightness<.5||r.brightness>1.8||!Number.isFinite(r.volume)||r.volume<0||r.volume>.3)throw new Error('Invalid room settings.');
 return {environment:r.environment,material:r.material,lightColor:r.lightColor,brightness:r.brightness,shadows:r.shadows,effects:r.effects,ambient:r.ambient,volume:r.volume};
}
export interface SavedStylePreset {id:string;name:string;appearance:Appearance}
function presetName(value:unknown){
 if(typeof value!=='string'||!value.trim()||value.trim().length>40)throw new Error('Name your look using 1–40 characters.');
 return value.trim();
}
export function normalizeStylePresets(value:unknown):SavedStylePreset[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>12)throw new Error('Keep up to 12 saved looks.');
 const ids=new Set<string>(),names=new Set<string>();
 return value.map(entry=>{
  if(!entry||typeof entry!=='object'||typeof entry.id!=='string'||!entry.id.trim()||entry.id.length>128||ids.has(entry.id))throw new Error('Invalid saved look.');
  const name=presetName(entry.name),key=name.toLocaleLowerCase('en');
  if(names.has(key))throw new Error('Each saved look needs a different name.');
  if(entry.appearance===undefined)throw new Error('Saved look is missing its appearance.');
  ids.add(entry.id);names.add(key);
  return {id:entry.id,name,appearance:normalizeAppearance(entry.appearance)};
 });
}
export function saveStylePreset(list:SavedStylePreset[],value:Appearance,name:string):SavedStylePreset[]{
 const current=normalizeStylePresets(list),cleanName=presetName(name);
 if(current.length>=12)throw new Error('You have 12 saved looks. Delete one to make room.');
 if(current.some(p=>p.name.toLocaleLowerCase('en')===cleanName.toLocaleLowerCase('en')))throw new Error('That name is already saved. Choose another name.');
 return [...current,{id:crypto.randomUUID(),name:cleanName,appearance:normalizeAppearance(value)}];
}
