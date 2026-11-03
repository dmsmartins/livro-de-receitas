import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
const receitas=JSON.parse(fs.readFileSync('receitas.json','utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const head=title=>`<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Caderno de cozinha</title><link rel="stylesheet" href="estilo.css">`;
const header='<header><span aria-hidden="true">✳</span> Caderno de cozinha</header>';
const used=new Set();
for(const r of receitas){
  if(!/^[a-z0-9-]+$/.test(r.id)||used.has(r.id)) throw Error('Identificador inválido ou repetido');
  used.add(r.id);
  const lines=r.ingredientes.map(([name,n,u])=>n===null ? name+" q.b." : `${n} ${u} de ${name.toLocaleLowerCase('pt')}`);
  const schema={'@context':'https://schema.org','@type':'Recipe',name:r.nome,author:{'@type':'Person',name:'Caderno de cozinha'},description:r.descricao,recipeYield:String(r.porcoes),recipeIngredient:lines,recipeInstructions:r.passos.map(([name,text])=>({'@type':'HowToStep',name,text}))};
  fs.writeFileSync(r.id+'.html',head(r.nome)+`<script type="application/ld+json">${json(schema)}</script></head><body>${header}<main><a href="index.html#${r.id}">← Voltar ao caderno</a><p class="tag">${escape(r.categoria)} · ${r.minutos} min</p><h1>${escape(r.nome)}</h1><p>${escape(r.descricao)}</p><h2>Ingredientes · ${r.porcoes} porções</h2><ul>${lines.map(i=>'<li>'+escape(i)+'</li>').join('')}</ul><h2>Preparação</h2>${r.passos.map(([n,p,t],i)=>`<section><h3>${i+1}. ${escape(n)}</h3><p>${escape(p)}</p><details><summary>Dica de cozinha</summary><p>${escape(t)}</p></details></section>`).join('')}<h2>Importar no Bring!</h2><p>O botão envia esta receita completa. Escolhe as porções e confirma os ingredientes na app. Se o botão não aparecer, abre esta página publicada no telemóvel e escolhe Partilhar → Bring!.</p><div data-bring-import="" style="display:none"></div><script async src="https://platform.getbring.com/widgets/import.js"></script><a href="https://www.getbring.com">Bring! Shopping List</a></main></body></html>`);
}
fs.writeFileSync('index.html',head('Livro de receitas')+`</head><body>${header}<main><p class="tag">Livro de receitas pessoal</p><h1>À mesa.</h1><p class="intro">Escolhe o que vais cozinhar e leva contigo uma só lista de compras.</p><div class="layout"><article><label for="receita">Folhear o caderno</label><select id="receita"></select><div id="ficha"></div></article><aside><p class="tag">Para levar</p><h2>Lista de compras</h2><div id="compras"></div><button id="copiar">Copiar lista</button><button id="guardar">Guardar .txt</button><p id="aviso" role="status"></p></aside></div></main><script type="application/json" id="dados">${json(receitas)}</script><script src="livro.js"></script></body></html>`);
