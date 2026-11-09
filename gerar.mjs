import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
import { gerarIndice } from './scripts/gerar-indice.js';
import { adaptar } from './dados.js';
const fontes=gerarIndice();
const receitas=fontes.map(adaptar);
const output=process.env.OUTPUT_DIR || 'public';
fs.mkdirSync(output,{recursive:true});
// Remove only files owned by a previous build, including deleted recipes.
const manifest=output+'/.generated.json';
if(fs.existsSync(manifest)) for(const slug of JSON.parse(fs.readFileSync(manifest,'utf8'))) {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Manifesto inválido');
  fs.rmSync(output+'/'+slug+'.html',{force:true});
  fs.rmSync(output+'/receitas/'+slug+'.json',{force:true});
}
const write=(name,content)=>fs.writeFileSync(output+'/'+name,content.replace(/<(button|input)\b/g,'<$1 disabled'));

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const json=v=>JSON.stringify(v).replaceAll('<','\\u003c');
const head=title=>`<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#254f40"><title>${esc(title)} · Caderno de cozinha</title><link rel="stylesheet" href="estilo.css">`;
const header='<header><a href="index.html" class="brand">✳ Caderno de cozinha</a><a href="index.html#compras">Compras</a></header>';
const data=()=>`<script type="module" src="livro.js"></script>`;
const measure=(r,i)=>{const [name,n,u]=r.ingredientes[i];return `<span data-qty="${i}">${n===null?'q.b.':n+' '+esc(u)}</span> ${esc(name)}`;};
const used=new Set();
for(const r of receitas){
  if(!/^[a-z0-9-]+$/.test(r.id)||used.has(r.id))throw Error('Identificador inválido ou repetido');
  used.add(r.id);
  const lines=r.ingredientes.map(([name,n,u])=>n===null?name+' q.b.':`${n} ${u} de ${name.toLocaleLowerCase('pt')}`);
  const schema={'@context':'https://schema.org','@type':'Recipe',name:r.nome,author:{'@type':'Person',name:'Caderno de cozinha'},description:r.descricao,recipeYield:String(r.porcoes),totalTime:'PT'+r.minutos+'M',recipeIngredient:lines,recipeInstructions:r.passos.map(([name,text])=>({'@type':'HowToStep',name,text}))};
  if(r.imagem)schema.image=r.imagem;
  if(r.preparacao!==null)schema.prepTime='PT'+r.preparacao+'M';
  if(r.cozedura!==null)schema.cookTime='PT'+r.cozedura+'M';
  schema.recipeCategory=r.categorias;
  schema.keywords=r.etiquetas.join(', ');
  if(r.complemento)schema.recipeInstructions.unshift({'@type':'HowToStep',name:r.complemento.nome,text:r.complemento.passos.join(' ')});
  const url='https://dmsmartins.github.io/livro-de-receitas/'+r.slug+'.html';
  const bring='https://api.getbring.com/rest/bringrecipes/deeplink?'+new URLSearchParams({url,source:'web',baseQuantity:r.porcoes,requestedQuantity:r.porcoes});
  const complement=r.complemento;
  write(r.slug+'.html',head(r.nome)+`<script type="application/ld+json">${json(schema)}</script></head><body data-recipe="${r.id}">${header}
  <main><a class="back" href="index.html">← Todas as receitas</a><div class="recipe-intro"><p class="eyebrow">${esc(r.categoria)} · Do meu caderno</p><h1>${esc(r.nome)}</h1><p class="lead">${esc(r.descricao)}</p>${r.imagem?`<img class="recipe-image" src="${esc(r.imagem)}" alt="${esc(r.nome)}">`:""}<div class="meta"><span>${r.minutos} min no total</span>${r.preparacao!==null?`<span>${r.preparacao} min preparação</span>`:''}${r.cozedura!==null?`<span>${r.cozedura} min confeção</span>`:''}</div></div>
  <nav class="recipe-nav" aria-label="Nesta receita"><a href="#antes">Antes de começar</a><a href="#ingredientes">Ingredientes</a><a href="#preparacao">Cozinhar</a></nav>
  <section id="antes" class="before"><h2>Antes de começar</h2><ul>${(r.antes||['Lê os passos e prepara os ingredientes antes de começares.']).map(t=>'<li>'+esc(t)+'</li>').join('')}</ul>${r.equipamento?`<details><summary>Material de cozinha</summary><ul>${r.equipamento.map(t=>'<li>'+esc(t)+'</li>').join('')}</ul></details>`:''}</section>
  <div class="recipe-grid"><section id="ingredientes" class="ingredients-panel"><p class="eyebrow">Preparar & comprar</p><div class="section-heading"><h2>Ingredientes</h2><div class="servings"><button id="menos" aria-label="Diminuir porções">−</button><output id="porcoes" aria-live="polite">${r.porcoes} porções</output><button id="mais" aria-label="Aumentar porções">+</button></div></div><p class="muted">Desmarca o que já tens para preparar a tua lista de compras.</p><div class="ingredients">${r.ingredientes.map(([name],i)=>` ${r.ingredientMeta[i].componente && (i===0 || r.ingredientMeta[i-1].componente!==r.ingredientMeta[i].componente)?`<h3>${esc(r.ingredientMeta[i].componente)}</h3>`:""}<label><input type="checkbox" data-ingredient="${i}" checked><span>${esc(name)}${r.ingredientMeta[i].opcional?" (opcional)":""}${r.ingredientMeta[i].notas?`<small> — ${esc(r.ingredientMeta[i].notas)}</small>`:""}</span><strong data-qty="${i}">${r.ingredientes[i][1]===null?'q.b.':r.ingredientes[i][1]+' '+esc(r.ingredientes[i][2])}</strong></label>`).join('')}</div>
  <label class="include"><input type="checkbox" id="incluir"> Incluir esta receita na lista de compras</label><div class="bring-panel"><a class="button primary" id="bring" href="${esc(bring)}">Enviar receita para o Bring! ↗</a><p id="bring-note">Envia a receita completa para ${r.porcoes} pessoas. Retira na app os ingredientes que já tens.</p><details><summary>Se o Bring! não abrir</summary><p>No telemóvel, abre esta página no navegador e usa Partilhar → Bring!. Confirma as porções na app. Também podes copiar a seleção abaixo.</p></details></div><button id="copiar-receita">Copiar ingredientes selecionados</button><p id="aviso" role="status"></p></section>
  <article id="preparacao"><div class="section-heading"><div><p class="eyebrow">Da bancada à mesa</p><h2>Vamos cozinhar</h2></div><button id="modo" aria-pressed="false">Modo de cozinha</button></div><p class="muted">As quantidades nos passos acompanham as porções escolhidas.</p><p id="ecra" role="status"></p>
  ${complement?`<details class="subrecipe"><summary>${esc(complement.nome)} · preparar primeiro</summary><p class="muted">${esc(complement.nota)}</p><p class="step-ingredients">${complement.indices.map(i=>measure(r,i)).join(' · ')}</p><ol>${complement.passos.map(t=>'<li>'+esc(t)+'</li>').join('')}</ol><p>${esc(complement.dica)}</p></details>`:''}
  <div class="progress"><output id="progresso" aria-live="polite">0 de ${r.passos.length} passos concluídos</output><button id="repor">Recomeçar</button></div>
  ${r.passos.map(([name,body,tip],i)=>{const d=r.detalhes?.[i];return `<section class="step" id="passo-${i+1}"><div class="step-top"><span class="step-number">${String(i+1).padStart(2,'0')}</span><label><input type="checkbox" data-step="${i}"> Passo concluído</label></div><h3>${esc(name)}</h3>${d?.usa?`<p class="step-ingredients">${d.usa.map(j=>measure(r,j)).join(' · ')}</p>`:''}<p>${esc(body)}</p>${d?`<p class="target"><strong>Está no ponto quando…</strong> ${esc(d.ponto)}</p>`:''}<details><summary>Como acertar o ponto</summary><p>${esc(tip)}</p></details>${d?`<details><summary>Porque se faz assim</summary><p>${esc(d.porque)}</p></details><details><summary>Se alguma coisa correr mal</summary><p>${esc(d.corrigir)}</p></details>`:''}</section>`;}).join('')}</article></div></main><div id="cook-bar" hidden><span id="cook-progress"></span><button id="proximo">Próximo passo</button><button id="sair">Sair do modo de cozinha</button></div>${data()}</body></html>`);
}
write('index.html',head('À mesa')+`</head><body>${header}<main><p class="eyebrow">O meu livro de receitas</p><h1>À mesa.</h1><p class="lead">Receitas para voltar a fazer. As dicas ficam aqui.</p><div class="cards">${[...receitas].reverse().map((r,i)=>`<a class="card card-${i}" href="${r.slug}.html"><span class="eyebrow">${esc(r.categoria)} · ${r.minutos} min</span><h2>${esc(r.nome)}</h2><p>${esc(r.descricao)}</p><span class="card-link">Abrir receita →</span></a>`).join('')}</div><section id="compras" class="shopping"><p class="eyebrow">Para levar</p><h2>A minha lista de compras</h2><p>Junta receitas à lista a partir dos seus ingredientes.</p><div id="lista"></div><button id="copiar">Copiar lista</button> <button id="guardar">Guardar .txt</button><p id="aviso" role="status"></p></section></main>${data()}</body></html>`);

for (const file of ['estilo.css','livro.js','dados.js','receita.schema.json']) fs.copyFileSync(file,output+'/'+file);
for (const dir of ['receitas','data']) fs.cpSync(dir,output+'/'+dir,{recursive:true});
if(fs.existsSync('assets')) fs.cpSync('assets',output+'/assets',{recursive:true});
// Keep the historical Bring test URL without maintaining another recipe source.
if(receitas.some(r=>r.slug==='tomate-com-manjericao')) fs.copyFileSync(output+'/tomate-com-manjericao.html',output+'/teste-bring.html');
else fs.rmSync(output+'/teste-bring.html',{force:true});
fs.writeFileSync(manifest,JSON.stringify(receitas.map(r=>r.slug)));
fs.writeFileSync(output+'/.nojekyll','');
console.log(`Geradas ${receitas.length} receitas em ${output}/`);
