import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {Chess} from 'chess.js';
const rows=[];
for(const letter of 'abcde'){
 const text=await readFile(new URL(`../vendor/chess-openings/${letter}.tsv`,import.meta.url),'utf8');
 for(const row of text.trim().split(/\r?\n/).slice(1)){
  const [eco,name,pgn]=row.split('\t');const c=new Chess();c.loadPgn(pgn,{strict:true});
  rows.push({eco,name,fen:c.fen(),moves:c.history({verbose:true}).map(m=>m.lan)});
 }
}
await mkdir(new URL('../src/data/',import.meta.url),{recursive:true});
await writeFile(new URL('../src/data/openings.json',import.meta.url),JSON.stringify(rows));
await copyFile(new URL('../vendor/chess-openings/COPYING.txt',import.meta.url),new URL('../public/licenses/chess-openings-CC0.txt',import.meta.url));
console.log(`Validated and indexed ${rows.length} opening lines.`);
