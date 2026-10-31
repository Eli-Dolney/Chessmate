import {createContext} from 'react';
export type BoardStyle='nebula'|'aurora'|'obsidian'|'classic';
export type PieceStyle='galaxy'|'crystal'|'classic';
export interface Appearance {board:BoardStyle;pieces:PieceStyle;animations:boolean;sounds:boolean}
export const defaultAppearance:Appearance={board:'nebula',pieces:'galaxy',animations:true,sounds:false};
export const AppearanceContext=createContext<Appearance>(defaultAppearance);
export const presets:{id:BoardStyle;name:string;subtitle:string;pieces:PieceStyle}[]=[
 {id:'nebula',name:'Nebula Glass',subtitle:'Starlight, violet mist & frosted glass',pieces:'galaxy'},
 {id:'aurora',name:'Aurora Glass',subtitle:'Northern lights & luminous jade',pieces:'crystal'},
 {id:'obsidian',name:'Obsidian',subtitle:'Smoked glass & silver reflections',pieces:'crystal'},
 {id:'classic',name:'Classic',subtitle:'Warm ivory & a familiar green board',pieces:'classic'}
];
export function normalizeAppearance(value:unknown):Appearance{
 if(value===undefined)return {...defaultAppearance};
 if(!value||typeof value!=='object')throw new Error('Invalid appearance settings.');
 const a=value as Appearance;
 if(!presets.some(p=>p.id===a.board)||!['galaxy','crystal','classic'].includes(a.pieces)||typeof a.animations!=='boolean'||typeof a.sounds!=='boolean')throw new Error('Invalid appearance settings.');
 return {board:a.board,pieces:a.pieces,animations:a.animations,sounds:a.sounds};
}
