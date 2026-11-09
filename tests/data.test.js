import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {lerReceitas,validate,root} from '../scripts/validar-receitas.js';
import {adaptar} from '../dados.js';
const recipes=lerReceitas();
test('all standalone files validate and preserve the UI contract',()=>{
  assert.equal(recipes.length,fs.readdirSync(path.join(root,'receitas')).filter(f=>f.endsWith('.json')).length);
  for(const r of recipes) assert.equal(adaptar(r).ingredientes.length,r.ingredientes.length);
});
for(const [label,mutate] of Object.entries({
  'negative quantity':r=>r.ingredientes[0].quantidade=-1,
  'unknown fields':r=>r.inventado=true,
  'broken step reference':r=>r.detalhes=[{usa:[999],ponto:'x',porque:'x',corrigir:'x'}],
  'invalid portions':r=>r.porcoes=0,
  'unsafe slug':r=>r.slug='../index',
  'null quantity without qb':r=>r.ingredientes[0].quantidade=null,
  'unsafe image':r=>r.imagem='javascript:alert(1)',
  'repeated ingredient name':r=>r.ingredientes[1].nome=r.ingredientes[0].nome,
  'missing name':r=>delete r.nome
})) test('rejects '+label,{skip:!recipes.length},()=>{
  const r=structuredClone(recipes[0]);mutate(r);
  assert.throws(()=>validate(r,recipes[0].slug+'.json'));
});
test('build is deterministic; add/edit/delete updates index, pages, JSON-LD and removes stale files',{skip:!recipes.length},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'caderno-test-'));
  try {
    for(const name of ['gerar.mjs','package.json','dados.js','livro.js','estilo.css','receita.schema.json','scripts','receitas']) fs.cpSync(path.join(root,name),path.join(dir,name),{recursive:true});
    const build=()=>execFileSync(process.execPath,['gerar.mjs'],{cwd:dir});
    const read=name=>fs.readFileSync(path.join(dir,'public',name),'utf8');
    const index=()=>JSON.parse(read('data/receitas-index.json'));
    build();const original=read('index.html');build();assert.equal(read('index.html'),original);
    const extra=structuredClone(recipes[0]);extra.id=extra.slug='receita-de-teste';extra.ordem=Math.max(...recipes.map(r=>r.ordem))+1;
    const file=path.join(dir,'receitas',extra.slug+'.json');
    fs.writeFileSync(file,JSON.stringify(extra));build();assert.equal(index().length,recipes.length+1);
    assert.match(read('index.html'),/receita-de-teste.html/);
    extra.nome='Edição <segura>';extra.ingredientes[0].quantidade=123;
    extra.ingredientes[0].componente='Componente';extra.ingredientes[0].notas='Nota';extra.ingredientes[0].opcional=true;
    fs.writeFileSync(file,JSON.stringify(extra));build();
    assert.equal(index().find(r=>r.id===extra.id).ingredientes[0].quantidade,123);
    const html=read(extra.slug+'.html');assert.match(html,/Edição &lt;segura&gt;/);assert.match(html,/Componente/);assert.match(html,/opcional/);
    const ld=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(ld.name,extra.nome);assert.match(ld.recipeIngredient[0],/^123 /);
    fs.unlinkSync(file);build();assert.equal(index().length,recipes.length);
    assert.equal(fs.existsSync(path.join(dir,'public',extra.slug+'.html')),false);
    assert.equal(fs.existsSync(path.join(dir,'public','receitas',extra.slug+'.json')),false);
    assert.equal(read('index.html'),original);
    for(const r of recipes) fs.unlinkSync(path.join(dir,'receitas',r.slug+'.json'));
    build();assert.deepEqual(index(),[]);assert.equal(fs.existsSync(path.join(dir,'public','teste-bring.html')),false);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('duplicate identifiers fail before index generation',{skip:!recipes.length},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'caderno-validation-'));
  try {
    const a=structuredClone(recipes[0]),b={...a,slug:'duplicada',ordem:100};
    fs.writeFileSync(path.join(dir,a.slug+'.json'),JSON.stringify(a));
    fs.writeFileSync(path.join(dir,b.slug+'.json'),JSON.stringify(b));
    assert.throws(()=>lerReceitas(dir),/repetido/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
