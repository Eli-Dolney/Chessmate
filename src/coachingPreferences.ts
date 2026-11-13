import type {CoachPreferences} from './types';

export type CoachingPreset='play'|'opening'|'full';
const values:Record<CoachingPreset,CoachPreferences>={
 play:{enabled:false,lineCommentary:false,pauseAfterMove:false,threats:false,openings:false,plans:false,suggestions:false,captures:false,detail:'brief'},
 opening:{enabled:true,lineCommentary:false,pauseAfterMove:false,threats:false,openings:true,plans:false,suggestions:false,captures:false,detail:'brief'},
 full:{enabled:true,lineCommentary:true,pauseAfterMove:true,threats:true,openings:true,plans:true,suggestions:false,captures:true,detail:'detailed'},
};

/** Optional fields keep the behavior of saves made before the play presets existed. */
function effective(prefs:CoachPreferences):CoachPreferences {
 return {...prefs,lineCommentary:prefs.lineCommentary??true,pauseAfterMove:prefs.pauseAfterMove??true,captures:prefs.captures??true,detail:prefs.detail??'detailed'};
}
export function coachPreset(prefs:CoachPreferences,mode:CoachingPreset):CoachPreferences {
 return {...prefs,...values[mode]};
}
export function coachingMode(prefs:CoachPreferences):CoachingPreset|'custom' {
 const current=effective(prefs);
 for(const mode of ['play','opening','full'] as const){
  const preset=values[mode];
  if((Object.keys(preset) as (keyof CoachPreferences)[]).every(key=>current[key]===preset[key]))return mode;
 }
 return 'custom';
}
/** Hidden assistance options may be retained while the master switch is off. */
export function isQuietPlay(prefs:CoachPreferences):boolean {
 return !prefs.enabled&&prefs.lineCommentary===false&&prefs.pauseAfterMove===false;
}
