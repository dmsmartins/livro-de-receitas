import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {lerReceitas,root} from './validar-receitas.js';
export function gerarIndice(dir=path.join(root,'receitas'),destination=path.join(root,'data/receitas-index.json')) {
  const recipes=lerReceitas(dir);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,JSON.stringify(recipes,null,2)+'\n');
  return recipes;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log(`${gerarIndice().length} receitas no índice.`);}catch(e){console.error(e.message);process.exitCode=1;}
}
