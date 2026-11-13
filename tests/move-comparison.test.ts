import {describe,it,expect} from 'vitest';
import {defaults,validateBackup} from '../src/storage';
import {createStudy,rememberOriginal,playInStudy,branchOf,validateStudy} from '../src/exploration';
import {comparisonArrows,comparisonVerdict} from '../src/MoveComparison';
import type {Analysis} from '../src/types';
describe('remembered decisions',()=>{
 it('keeps the original alongside new branches, including in backups',()=>{const d=defaults();let s=rememberOriginal(createStudy({initialFen:d.current.initialFen,moves:[]},'Retry'),'e2e4');s=playInStudy(s,'d2d4');expect(s.branches.map(b=>b.moves[0])).toEqual(['e2e4','d2d4']);d.explorations=[s];d.activeExplorationId=s.id;expect(validateBackup(JSON.parse(JSON.stringify(d))).explorations[0]).toEqual(s);expect(()=>validateStudy({...s,originalMove:'e2e5'})).toThrow();});
 it('retains the original when entering an engine alternative',()=>{const d=defaults(),s=rememberOriginal(createStudy({initialFen:d.current.initialFen,moves:[]},'Candidate',['d2d4','d7d5']),'e2e4');expect(branchOf(s).moves[0]).toBe('d2d4');expect(s.branches[0].label).toBe('Original move');});
 it('shows only arrows that apply to the selected position and line',()=>{const d=defaults();let s=rememberOriginal(createStudy({initialFen:d.current.initialFen,moves:[]},'Candidate',['d2d4','d7d5']),'e2e4');const a:Analysis={fen:d.current.initialFen,elapsed:2000,lines:[{move:'e2e4',pv:['e2e4','e7e5'],cp:20,depth:15},{move:'d2d4',pv:['d2d4','d7d5'],cp:30,depth:15}]};expect(comparisonArrows(s,a)).toHaveLength(2);s={...s,step:1};expect(comparisonArrows(s,a)).toEqual([{move:'d7d5',kind:'reply'}]);s=playInStudy(s,'g8f6');expect(comparisonArrows(s,a)).toEqual([]);});
 it('compares side-to-move values without claiming every alternative is better',()=>{const a:Analysis={fen:'',elapsed:0,lines:[{move:'',pv:[],cp:-200,depth:16},{move:'',pv:[],cp:-20,depth:16}]};expect(comparisonVerdict(a)).toContain('1.80 pawns better');a.lines.reverse();expect(comparisonVerdict(a)).toContain('original scores');a.lines[0].cp=-201;expect(comparisonVerdict(a)).toContain('no clear improvement');});
 it('migrates legacy appearance and preserves the optional 3D choice',()=>{const d=defaults();expect(validateBackup(d).settings.appearance.view).toBeUndefined();d.settings.appearance.view='3d';expect(validateBackup(d).settings.appearance.view).toBe('3d');expect(()=>validateBackup({...d,settings:{...d.settings,appearance:{...d.settings.appearance,view:'bad'}}})).toThrow();});
});

