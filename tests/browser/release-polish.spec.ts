import {test,expect,type Page} from '@playwright/test';
import {Chess} from 'chess.js';
import {defaults,importPgn} from '../../src/storage';
import {buildTraining,exerciseFor} from '../../src/training';
import type {AppData} from '../../src/types';

async function read(page:Page):Promise<AppData>{return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('ltw-chess',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('state'),q=t.objectStore('state').get('app');q.onsuccess=()=>resolve(q.result);t.oncomplete=()=>db.close();};r.onerror=()=>reject(r.error);}));}
async function restore(page:Page,data:unknown){await page.getByRole('button',{name:'Restore a backup',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await expect(page.getByRole('status')).toContainText('Backup restored');}
test.beforeEach(async({page})=>{await page.goto('/');});

test('new-game and review dialogs focus controls, contain tab navigation, and cancel with Escape',async({page})=>{
 const d=defaults();d.current.moves=['e2e4'];d.current.pending=true;d.games=[importPgn('1. e4 e5 *')];d.settings.color='b';d.settings.difficulty='Steady';await restore(page,d);
 const opener=page.getByRole('button',{name:'New game',exact:false});await opener.click();const dialog=page.getByRole('dialog',{name:'New practice game'});
 await expect(dialog.getByLabel('Play as')).toBeFocused();await expect(dialog.getByLabel('Play as')).toHaveValue('b');await expect(dialog.getByLabel('Practice partner')).toHaveValue('Steady');await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Start practicing',exact:false})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();expect((await read(page)).current).toEqual(d.current);
 await page.getByRole('button',{name:'Your library',exact:true}).click();const review=page.getByRole('button',{name:'Review →',exact:true});await review.click();const choose=page.getByRole('dialog',{name:'Choose review color'});await expect(choose.getByRole('button',{name:'Review White'})).toBeFocused();await page.keyboard.press('Escape');await expect(choose).toHaveCount(0);await expect(review).toBeFocused();
});

test('promotion can be cancelled and selected entirely by keyboard',async({page})=>{
 const d=defaults();d.current.initialFen='7k/P7/8/8/8/8/8/7K w - - 0 1';await restore(page,d);await page.getByRole('button',{name:'Try moves',exact:false}).click();
 const promote=async()=>{await page.locator('[data-square=a7]').focus();await page.keyboard.press('Enter');await page.locator('[data-square=a8]').focus();await page.keyboard.press('Enter');};
 await promote();const dialog=page.getByRole('dialog',{name:'Choose promotion'});await expect(dialog.getByRole('button',{name:'Promote to queen'})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.locator('[data-square=a7]')).toHaveAttribute('aria-label','a7 White pawn');
 await promote();await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Promote to knight'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('[data-square=a8]')).toHaveAttribute('aria-label','a8 White knight');expect((await read(page)).current).toEqual(d.current);
});

test('invalid imports have an appropriate dismiss action and a successful import clears the error',async({page})=>{
 const d=defaults();d.current.moves=['d2d4'];d.current.pending=true;await restore(page,d);await page.getByRole('button',{name:'Your library',exact:true}).click();await page.getByLabel('PGN text').fill('not a chess game');await page.getByRole('button',{name:'Import pasted PGN'}).click();
 const alert=page.getByRole('alert');await expect(alert.getByRole('button',{name:'Dismiss import error'})).toBeVisible();await expect(alert.getByRole('button',{name:'Restart engine'})).toHaveCount(0);expect((await read(page)).current).toEqual(d.current);
 await page.getByLabel('PGN text').fill('1. e4 e5 *');await page.getByRole('button',{name:'Import pasted PGN'}).click();await expect(alert).toHaveCount(0);await expect.poll(async()=>(await read(page)).games.length).toBe(1);expect((await read(page)).current).toEqual(d.current);
});

test('studying a solved guided answer preserves its earned schedule across reopening',async({page})=>{
 const d=defaults();d.current.moves=['e2e4'];d.current.pending=true;d.training=buildTraining(d);await restore(page,d);await page.getByRole('button',{name:'Opening practice',exact:false}).click();await page.getByRole('button',{name:'Resume guided practice'}).click();
 const exercise=exerciseFor(d.training.items[0].record)!,move=new Chess(exercise.fen).move(exercise.accepted[0]);await page.locator(`[data-square=${move.from}]`).click();await page.locator(`[data-square=${move.to}]`).click();if(move.promotion)await page.getByRole('button',{name:'Promote to queen'}).click();
 await expect.poll(async()=>(await read(page)).training?.items[0].result).toBe('solved');const solved=(await read(page)).practice;await page.getByRole('button',{name:'Explore the lesson line',exact:true}).click();await expect(page.getByRole('button',{name:'Return to practice'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Opening practice',exact:false}).click();await page.getByRole('button',{name:'Resume guided practice'}).click();await page.getByRole('button',{name:'Return to practice'}).click();const saved=await read(page);expect(saved.practice).toEqual(solved);expect(saved.training?.items[0].result).toBe('solved');expect(saved.current).toEqual(d.current);
});

test('unreadable saved data stays intact through navigation and can be recovered from backup',async({page})=>{
 await expect.poll(async()=>!!(await read(page))).toBe(true);
 await page.evaluate(()=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('ltw-chess',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('state','readwrite');t.objectStore('state').put({version:999,keep:'original'},'app');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};}));
 await page.reload();await expect(page.getByRole('alert')).toContainText('Saved data could not be opened');await expect(page.getByRole('alert').getByRole('button',{name:'Restart engine'})).toHaveCount(0);await page.getByRole('button',{name:'Your library',exact:true}).click();await expect(page.getByRole('alert')).toContainText('existing storage has not been overwritten');expect(await read(page)).toEqual({version:999,keep:'original'});await page.getByLabel('PGN text').fill('1. e4 *');await expect(page.getByRole('button',{name:'Import pasted PGN'})).toBeDisabled();await expect(page.getByRole('button',{name:'Choose PGN file'})).toBeDisabled();await page.getByRole('button',{name:'Restore a backup',exact:true}).click();await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});await expect(page.getByRole('alert')).toContainText('Saved data could not be opened');await expect(page.getByRole('alert')).toContainText('not a supported Chessmate backup');expect(await read(page)).toEqual({version:999,keep:'original'});
 await restore(page,defaults());await expect(page.getByRole('alert')).toHaveCount(0);await expect.poll(async()=>(await read(page)).version).toBe(3);
});

test('opening searches clear old previews and choosing a module brings its exercises into view',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:768,height:1024});await page.getByRole('button',{name:'Opening practice',exact:false}).click();const search=page.getByLabel('Search opening name or ECO code');await search.fill('Sicilian');await page.locator('.catalog-results button').first().click();await expect(page.locator('.catalog-preview h3')).toContainText('Sicilian');await search.fill('not-a-real-opening-xyz');await expect(page.locator('.catalog-preview h3')).toHaveCount(0);await expect(page.getByRole('button',{name:'Explore this opening',exact:true})).toHaveCount(0);
 await page.locator('.module-card').filter({has:page.getByRole('heading',{name:'The Caro-Kann',exact:true})}).click();await expect(page.locator('.lesson-heading')).toBeFocused();await expect(page.locator('.lesson-heading')).toContainText('The Caro-Kann');await expect(page.locator('.lesson-heading')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
