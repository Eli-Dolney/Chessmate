import {test,expect,type Page} from '@playwright/test';
import {defaults} from '../../src/storage';
import {branchOf,createStudy,rememberOriginal,studyPosition} from '../../src/exploration';
import {replay} from '../../src/chess';
import type {AppData} from '../../src/types';

async function read(page:Page):Promise<AppData>{return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('ltw-chess',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('state'),q=t.objectStore('state').get('app');q.onsuccess=()=>resolve(q.result);t.oncomplete=()=>db.close();};r.onerror=()=>reject(r.error);}));}
async function active(page:Page){const d=await read(page);return d.explorations.find(s=>s.id===d.activeExplorationId)!;}
async function restore(page:Page,data:unknown){await page.getByRole('button',{name:'Restore a backup',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await expect(page.getByRole('status')).toContainText('Backup restored');}
async function pendingStudy(page:Page){const d=defaults();d.current.moves=['e2e4'];d.current.pending=true;await restore(page,d);await page.getByRole('button',{name:'Try a different move',exact:true}).click();await page.locator('[data-square=d2]').click();await page.locator('[data-square=d4]').click();await expect.poll(async()=>(await active(page)).branches.length).toBe(2);return d;}
const player=(page:Page)=>page.getByRole('region',{name:'Line playback',exact:true});
async function pauseGenerated(page:Page,plies:number){await expect(page.locator('.line-timeline button')).toHaveCount(plies+1,{timeout:40000});await player(page).getByRole('button',{name:'Pause line',exact:false}).click();await expect(player(page).getByRole('button',{name:'Play line',exact:false})).toBeVisible();}

test.beforeEach(async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:'Learn the idea behind the move.'})).toBeVisible();});

test('five-move original line preserves branches and supports pause, stepping, final position, and replay',async({page})=>{
 const d=await pendingStudy(page),before=await active(page);
 await page.getByRole('group',{name:'Original continuation',exact:true}).getByRole('button',{name:'Play out 5 moves',exact:true}).click();await pauseGenerated(page,10);
 const built=await active(page);expect(branchOf(built).moves[0]).toBe('e2e4');expect(branchOf(built).moves).toHaveLength(10);for(const b of before.branches)expect(built.branches.find(x=>x.id===b.id)).toEqual(b);expect((await read(page)).current).toEqual(d.current);
 const step=built.step;await player(page).getByRole('button',{name:'Next →',exact:true}).click();await expect.poll(async()=>(await active(page)).step).toBe(step+1);await player(page).getByRole('button',{name:'← Previous',exact:true}).click();await expect.poll(async()=>(await active(page)).step).toBe(step);
 await player(page).getByRole('button',{name:'See final position',exact:true}).click();await expect(player(page)).toContainText('10 / 10 half-moves');await player(page).getByRole('button',{name:'Replay line',exact:false}).click();await expect.poll(async()=>(await active(page)).step).toBeGreaterThan(0);await player(page).getByRole('button',{name:'Pause line',exact:false}).click();await player(page).getByRole('button',{name:'Reset position',exact:false}).click();await expect(player(page)).toContainText('0 / 10 half-moves');
 await player(page).getByLabel('Playback speed').selectOption('800');await page.getByRole('button',{name:'Keep my original move',exact:true}).click();await expect(page.locator('.explore-banner')).toHaveCount(0);expect((await read(page)).current).toEqual(d.current);
});

test('ten-move alternative works offline in 3D and survives reload and backup restoration',async({page})=>{
 const remote:string[]=[];page.on('request',r=>{if(new URL(r.url()).hostname!=='127.0.0.1')remote.push(r.url());});await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const d=await pendingStudy(page);await page.getByRole('button',{name:'3D · Table view',exact:true}).click();await expect(page.locator('.board-scene canvas')).toHaveAttribute('data-pieces','32');
 await page.getByRole('group',{name:'Alternative continuation',exact:true}).getByRole('button',{name:'Play out 10 moves',exact:true}).click();await pauseGenerated(page,20);await player(page).getByRole('button',{name:'See final position',exact:true}).click();
 const built=await active(page);expect(branchOf(built).moves[0]).toBe('d2d4');await expect(page.locator('.board-scene canvas')).toHaveAttribute('data-position',replay(studyPosition(built)).fen());expect((await read(page)).current).toEqual(d.current);
 await page.reload();await expect(player(page)).toContainText('20 / 20 half-moves');expect(await active(page)).toEqual(built);
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Back up your progress',exact:false}).click();const path=await(await downloaded).path();await page.getByRole('button',{name:'Return to game',exact:false}).click();await page.getByRole('button',{name:'Restore a backup',exact:true}).click();await page.locator('input[type=file]').setInputFiles(path!);await expect(player(page)).toContainText('20 / 20 half-moves');expect(await active(page)).toEqual(built);expect((await read(page)).current).toEqual(d.current);expect(remote).toEqual([]);
 await page.screenshot({path:'test-results/chessmate-long-lines.png',fullPage:true,animations:'disabled'});
});

test('cancelling a delayed search and returning prevents late branches or opponent moves',async({page})=>{
 const d=await pendingStudy(page),before=await active(page);let release!:()=>void,requested=false;const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/engine/*.js',async route=>{requested=true;await gate;await route.continue().catch(()=>{});});
 await page.getByRole('group',{name:'Alternative continuation',exact:true}).getByRole('button',{name:'Play out 10 moves',exact:true}).click();await expect.poll(()=>requested).toBe(true);await expect(player(page).getByRole('button',{name:'Cancel line generation',exact:true})).toBeVisible();await player(page).getByRole('button',{name:'Cancel line generation',exact:true}).click();
 expect(await active(page)).toEqual(before);await page.getByRole('button',{name:'Keep my original move',exact:true}).click();release();await page.unroute('**/engine/*.js');
 // A fresh real search confirms the cancelled worker cannot inject an old result.
 await page.getByRole('button',{name:'Try a different move',exact:true}).click();await page.getByRole('group',{name:'Original continuation',exact:true}).getByRole('button',{name:'Play out 5 moves',exact:true}).click();await pauseGenerated(page,10);expect((await read(page)).current).toEqual(d.current);expect((await read(page)).explorations.find(s=>s.id===before.id)).toEqual(before);
});

test('a mating continuation ends early and a generated alternative still applies only the first move',async({page})=>{
 const d=defaults();d.current.moves=['f2f3','e7e5','g2g4','d8h4'];d.current.player='b';d.current.pending=true;
 const root={initialFen:d.current.initialFen,moves:d.current.moves.slice(0,-1)},study=rememberOriginal(createStudy(root,'Mate line',[],{gameId:d.current.id,prefix:root.moves}),'d8h4');d.explorations=[study];d.activeExplorationId=study.id;await restore(page,d);
 await page.getByRole('group',{name:'Original continuation',exact:true}).getByRole('button',{name:'Play out 10 moves',exact:true}).click();await expect(player(page)).toContainText('1 / 1 half-moves',{timeout:10000});await expect(player(page)).toContainText('Black wins by checkmate');await expect(page.locator('.line-timeline button')).toHaveCount(2);expect((await read(page)).current.moves).toEqual(d.current.moves);
 await pendingStudy(page);await page.getByRole('group',{name:'Alternative continuation',exact:true}).getByRole('button',{name:'Play out 5 moves',exact:true}).click();await pauseGenerated(page,10);await player(page).getByRole('button',{name:'See final position',exact:true}).click();await page.getByRole('button',{name:'Play this alternative',exact:true}).click();await expect(page.locator('.explore-banner')).toHaveCount(0);await expect(page.getByRole('button',{name:'Let the computer reply',exact:false})).toBeEnabled({timeout:30000});expect((await read(page)).current.moves).toEqual(['d2d4']);expect((await read(page)).current.pending).toBe(true);
});
