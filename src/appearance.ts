import {createContext} from 'react';
export type BoardStyle='nebula'|'aurora'|'obsidian'|'classic'|'ember'|'ocean'|'walnut'|'neon';
export type PieceStyle='galaxy'|'crystal'|'classic'|'porcelain'|'gilded'|'neon';
export interface Appearance {board:BoardStyle;pieces:PieceStyle;animations:boolean;sounds:boolean}
export const defaultAppearance:Appearance={board:'nebula',pieces:'galaxy',animations:true,sounds:false};
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
export const pieceStyles:{id:PieceStyle;name:string;description:string}[]=[{id:'galaxy',name:'Galaxy',description:'Starlit violet & ice'},{id:'crystal',name:'Crystal',description:'Faceted glass'},{id:'porcelain',name:'Porcelain',description:'Ivory & ink • sculpted forms'},{id:'gilded',name:'Gilded',description:'Brushed gold & dark bronze'},{id:'neon',name:'Neon',description:'Cyan & magenta outlines'},{id:'classic',name:'Classic',description:'Traditional ivory & green'}];
export function normalizeAppearance(value:unknown):Appearance{
 if(value===undefined)return {...defaultAppearance};
 if(!value||typeof value!=='object')throw new Error('Invalid appearance settings.');
 const a=value as Appearance;
 if(!presets.some(p=>p.id===a.board)||!pieceStyles.some(p=>p.id===a.pieces)||typeof a.animations!=='boolean'||typeof a.sounds!=='boolean')throw new Error('Invalid appearance settings.');
 return {board:a.board,pieces:a.pieces,animations:a.animations,sounds:a.sounds};
}
