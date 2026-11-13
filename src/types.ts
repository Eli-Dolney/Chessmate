import type { Color } from 'chess.js';
import type { Appearance } from './appearance';
export type Difficulty = 'Gentle' | 'Steady' | 'Challenging';
export interface CoachPreferences { detail?:'brief'|'detailed'; pauseAfterMove?:boolean; captures?:boolean; lineCommentary?:boolean; enabled:boolean; threats:boolean; openings:boolean; plans:boolean; suggestions:boolean }
export interface Settings { color: Color; difficulty: Difficulty; flipped: boolean; appearance:Appearance; coach:CoachPreferences }
export interface PositionHistory { initialFen:string; moves:string[] }
export interface ExplorationBranch { id:string; label:string; moves:string[] }
export interface Exploration { kind?:'opening'; originalMove?:string; id:string; root:PositionHistory; branches:ExplorationBranch[]; branchId:string; step:number; label:string; source?:{gameId:string; prefix:string[]} }
export interface CandidateLine { move: string; pv: string[]; cp?: number; mate?: number; depth: number }
export interface Analysis { fen: string; lines: CandidateLine[]; bestmove?: string; elapsed: number }
export interface CoachingEvidence { kind: 'fact' | 'calculated' | 'principle'; text: string; squares?: string[]; annotations?: {role:'attacker'|'target'|'defender';square:string}[] }
export interface LearningMoment { id: string; fen: string; played: string; best: string; loss: number; explanation: string; pv: string[]; playedLine?:CandidateLine; bestLine?:CandidateLine; position?:PositionHistory }
export interface GameSession { id: string; initialFen: string; moves: string[]; player: Color; difficulty: Difficulty; created: string; updated: string; moments: LearningMoment[]; pending: boolean; archived?: boolean; imported?:boolean }
export interface LessonExercise { id: string; module: string; title: string; fen: string; accepted: string[]; prompt: string; hint: string; explanation: string; continuation: string[]; theme: 'plan' | 'tactic' | 'defense' }
export interface OpeningModule { id: string; title: string; subtitle: string; color: Color; description: string; category?:'opening'|'foundation' }
export interface PracticeRecord { id: string; exerciseId?: string; moment?: LearningMoment; stage: number; due: string; lastSession: string; missed: boolean; attempts: number }
export type LearningTopic='opening'|'tactics'|'strategy'|'endgame';
export interface TrainingItem { record:PracticeRecord; topic:LearningTopic; result:'pending'|'solved'|'assisted'|'skipped'; missed:boolean; revealed:boolean; hint:number; answer?:string }
export interface TrainingSession { label?:string; id:string; items:TrainingItem[]; cursor:number; created:string; study?:Exploration }
export interface ReviewEntry { ply:number; moment:LearningMoment }
export interface GameReview { id:string; gameId:string; position:PositionHistory; color:Color; entries:ReviewEntry[]; search:{time:number;skill:20}; selected:number; study?:Exploration }
export interface AppData { version: 3; settings: Settings; current: GameSession; games: GameSession[]; practice: PracticeRecord[]; explorations:Exploration[]; activeExplorationId:string|null; training:TrainingSession|null; trainingRound:number; reviews:GameReview[] }
