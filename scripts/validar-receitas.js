import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
const schema=JSON.parse(fs.readFileSync(new URL('../receita.schema.json',import.meta.url),'utf8'));
// Deliberately small validator for the keywords used by receita.schema.json.
export function check(value,rule,where='$') {
  const fail=message=>{throw new Error(`${where}: ${message}`);};
  if(rule.anyOf) {
    if(!rule.anyOf.some(r=>{try{check(value,r,where);return true;}catch{return false;}})) fail('valor não permitido');
    return;
  }
  const type=value===null?'null':Array.isArray(value)?'array':typeof value;
  if(rule.type && !(rule.type==='integer'?Number.isInteger(value):type===rule.type)) fail(`esperado ${rule.type}`);
  if(rule.const!==undefined && value!==rule.const) fail(`esperado ${rule.const}`);
  if(typeof value==='number' && (!Number.isFinite(value) || value<(rule.minimum??-Infinity) || value>(rule.maximum??Infinity))) fail('número fora dos limites');
  if(typeof value==='string' && (value.trim().length<(rule.minLength??0) || (rule.pattern && !new RegExp(rule.pattern).test(value)))) fail('texto inválido');
  if(type==='array') {
    if(value.length<(rule.minItems??0) || value.length>(rule.maxItems??Infinity)) fail('número de elementos inválido');
    if(rule.uniqueItems && new Set(value.map(v=>JSON.stringify(v))).size!==value.length) fail('elementos repetidos');
    value.forEach((v,i)=>check(v,rule.prefixItems?.[i]??rule.items??{},`${where}[${i}]`));
  }
  if(type==='object') {
    for(const name of rule.required??[]) if(!(name in value)) fail(`falta ${name}`);
    for(const [name,v] of Object.entries(value)) {
      if(rule.additionalProperties===false && !Object.hasOwn(rule.properties,name)) fail(`campo desconhecido ${name}`);
      check(v,rule.properties?.[name]??{},`${where}.${name}`);
    }
  }
}
export function validate(r,filename) {
  check(r,schema,filename);
  if(filename!==r.slug+'.json') throw Error(`${filename}: nome deve corresponder ao slug`);
  if(['index','teste-bring','receita','404'].includes(r.slug)) throw Error(`${filename}: slug reservado`);
  const names=new Set();
  r.ingredientes.forEach((i,n)=>{
    if((i.quantidade===null)!==(i.unidade==='q.b.')) throw Error(`${filename}: ingrediente ${n}: null exige q.b. e vice-versa`);
    if(names.has(i.nome)) throw Error(`${filename}: nomes de ingredientes repetidos afetam a seleção guardada`);
    names.add(i.nome);
  });
  if(r.detalhes && r.detalhes.length!==r.passos.length) throw Error(`${filename}: detalhes devem corresponder aos passos`);
  const refs=[...(r.complemento?.indices??[]),...(r.detalhes??[]).flatMap(d=>d.usa)];
  if(refs.some(i=>i>=r.ingredientes.length)) throw Error(`${filename}: referência a ingrediente inexistente`);
  if(r.preparacao!==null && r.cozedura!==null && r.minutos<Math.max(r.preparacao,r.cozedura)) throw Error(`${filename}: tempo total incoerente`);
  return r;
}
export function lerReceitas(dir=path.join(root,'receitas')) {
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort();
  const ids=new Set(),slugs=new Set(),orders=new Set();
  return files.map(f=>{
    let r;try {r=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));}catch(e){throw Error(`${f}: ${e.message}`);}
    validate(r,f);
    if(ids.has(r.id)||slugs.has(r.slug)||orders.has(r.ordem)) throw Error(`${f}: id, slug ou ordem repetido`);
    ids.add(r.id);slugs.add(r.slug);orders.add(r.ordem);
    return r;
  }).sort((a,b)=>a.ordem-b.ordem || a.slug.localeCompare(b.slug));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log(`${lerReceitas().length} receitas válidas.`);}catch(e){console.error(e.message);process.exitCode=1;}
}
