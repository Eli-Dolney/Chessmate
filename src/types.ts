import type { Color } from 'chess.js';
import type { Appearance } from './appearance';
export type Difficulty = 'Gentle' | 'Steady' | 'Challenging';
export interface CoachPreferences { enabled:boolean; threats:boolean; openings:boolean; plans:boolean; suggestions:boolean }
export interface Settings { color: Color; difficulty: Difficulty; flipped: boolean; appearance:Appearance; coach:CoachPreferences }
export interface PositionHistory { initialFen:string; moves:string[] }
export interface ExplorationBranch { id:string; label:string; moves:string[] }
export interface Exploration { id:string; root:PositionHistory; branches:ExplorationBranch[]; branchId:string; step:number; label:string; source?:{gameId:string; prefix:string[]} }
export interface CandidateLine { move: string; pv: string[]; cp?: number; mate?: number; depth: number }
export interface Analysis { fen: string; lines: CandidateLine[]; bestmove?: string; elapsed: number }
export interface CoachingEvidence { kind: 'fact' | 'calculated' | 'principle'; text: string; squares?: string[] }
export interface LearningMoment { id: string; fen: string; played: string; best: string; loss: number; explanation: string; pv: string[] }
export interface GameSession { id: string; initialFen: string; moves: string[]; player: Color; difficulty: Difficulty; created: string; updated: string; moments: LearningMoment[]; pending: boolean; archived?: boolean }
export interface LessonExercise { id: string; module: string; title: string; fen: string; accepted: string[]; prompt: string; hint: string; explanation: string; continuation: string[]; theme: 'plan' | 'tactic' | 'defense' }
export interface OpeningModule { id: string; title: string; subtitle: string; color: Color; description: string; category?:'opening'|'foundation' }
export interface PracticeRecord { id: string; exerciseId?: string; moment?: LearningMoment; stage: number; due: string; lastSession: string; missed: boolean; attempts: number }
export interface AppData { version: 2; settings: Settings; current: GameSession; games: GameSession[]; practice: PracticeRecord[]; explorations:Exploration[]; activeExplorationId:string|null }
