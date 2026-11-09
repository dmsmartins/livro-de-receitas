// Compatibility view for the established UI. Standalone JSON is the only source.
export function adaptar(r) {
  return {...r, categoria:r.categorias.join(' · '), ingredientMeta:r.ingredientes,
    ingredientes:r.ingredientes.map(i=>[i.nome,i.quantidade,i.unidade])};
}
