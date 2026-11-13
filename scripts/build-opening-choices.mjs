import {readFile,writeFile} from 'node:fs/promises';
import {Chess} from 'chess.js';

// Derived only from the pinned, CC0 Lichess catalog already bundled here.
// Index every prefix by board state so different move orders meet at the same entry.
const rows=JSON.parse(await readFile(new URL('../src/data/openings.json',import.meta.url),'utf8'));
const positions=new Map();
const key=board=>board.fen().split(' ').slice(0,4).join(' ');
const compare=(a,b)=>a.remaining-b.remaining||a.name.length-b.name.length||a.name.localeCompare(b.name,'en')||a.eco.localeCompare(b.eco,'en')||a.line.join(' ').localeCompare(b.line.join(' '),'en');
for(const row of rows){
 const board=new Chess();
 for(let ply=0;ply<row.moves.length;ply++){
  const move=row.moves[ply],position=key(board);
  if(board.isGameOver())throw new Error(`Catalog continues after game end: ${row.name}`);
  board.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]});
  const candidate={move,name:row.name,eco:row.eco,line:row.moves.slice(ply,ply+20),remaining:row.moves.length-ply};
  let choices=positions.get(position);if(!choices){choices=new Map();positions.set(position,choices);}
  const previous=choices.get(move);
  if(!previous||compare(candidate,previous)<0)choices.set(move,candidate);
 }
}
const index=Object.fromEntries([...positions].sort(([a],[b])=>a.localeCompare(b,'en')).map(([position,choices])=>[
 position,[...choices.values()].sort((a,b)=>a.move.localeCompare(b.move,'en')).map(({remaining,...choice})=>choice)
]));
const json=JSON.stringify(index);
await writeFile(new URL('../src/data/opening-choices.json',import.meta.url),json);
console.log(`Built ${positions.size} positions with ${Object.values(index).reduce((n,choices)=>n+choices.length,0)} legal opening choices (${Buffer.byteLength(json).toLocaleString()} bytes).`);
