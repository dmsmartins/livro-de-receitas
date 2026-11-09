# À mesa. — Caderno de cozinha

Livro pessoal para estudar uma receita, preparar compras e cozinhar com dicas previamente escritas.

## Utilização

A página inicial apresenta o catálogo e a lista de compras. Cada receita tem uma página única com ingredientes, porções, dicas expansíveis e acesso direto ao Bring!.

As quantidades dos ingredientes e dos passos acompanham as porções. Desmarca os ingredientes que já tens e inclui a receita na lista de compras para a juntar a outras receitas. Podes copiar a seleção de uma receita ou copiar e guardar a lista consolidada.

O modo de cozinha aumenta o texto e permite marcar os passos concluídos. As porções, seleção e progresso ficam neste navegador. «Recomeçar» limpa o progresso da receita. Manter o ecrã ligado depende do suporte e das permissões do navegador. A página informa se foi possível.

## Bring!

O botão usa o endpoint oficial de integração web-to-app, com o endereço público da própria receita e os parâmetros baseQuantity e requestedQuantity. O cálculo de seis para duas porções foi confirmado no verificador oficial, com 150 g de arroz e 500 ml de caldo.

O Bring! recebe todos os ingredientes da receita. Os ingredientes desmarcados localmente precisam de ser retirados também na app. A seleção exata pode ser copiada como texto. A gravação na lista pessoal continua a exigir um teste na app do utilizador.

Se o botão não abrir a app, usa o menu Partilhar do navegador no telemóvel e escolhe Bring!, confirmando as porções nessa via.

[Documentação oficial do Bring!](https://sites.google.com/getbring.com/bring-import-dev-guide/web-to-app-integration)

## Conteúdo e publicação

Edita apenas os ficheiros `receitas/<slug>.json`. São a única fonte de verdade. O índice e o HTML são derivados e nunca precisam de edição manual. O GitHub Actions valida, testa, gera e publica automaticamente quando uma alteração chega a `main`. Num pull request, executa os mesmos testes e prepara o artefacto sem publicar.

### Estrutura B05

```text
receitas/                  Um JSON completo por receita
receita.schema.json        Contrato dos dados (JSON Schema 2020-12)
scripts/validar-receitas.js Validação estrutural e referências
scripts/gerar-indice.js     Índice determinístico, ordenado por ordem
data/receitas-index.json   Índice derivado (não versionado)
gerar.mjs                  Templates existentes e geração de public/
dados.js                   Adaptação para a interface existente
livro.js / estilo.css      Interações e desenho
public/                    Site gerado, pronto para GitHub Pages
tests/                     Validação, ciclo editorial e navegador
```

O índice agrega os dados completos: a lista de compras precisa dos ingredientes de várias receitas. A biblioteca carrega esse índice; cada página carrega também o seu JSON individual para as interações. O HTML é pré-gerado a partir dos mesmos ficheiros, mantendo a leitura sem JavaScript e o JSON-LD acessível ao Bring!. Não é necessário um backend, framework ou página genérica `receita.html`. Os endereços existentes `<slug>.html` e `index.html#<id>` mantêm-se. `teste-bring.html` passa a ser uma cópia gerada da página de tomate, sem outra fonte de conteúdo.

### Adicionar, editar ou eliminar

1. Para adicionar, copia um JSON existente para `receitas/novo-slug.json`, atribui `id`, `slug` e `ordem` únicos e substitui o conteúdo. O nome do ficheiro deve coincidir com o slug. Nunca uses os slugs reservados `index`, `receita`, `teste-bring` ou `404`.
2. Para editar, altera esse JSON. Mantém `id` e `slug` estáveis: identificam o estado guardado e os endereços públicos. Os nomes dos ingredientes identificam a seleção guardada; renomear um ingrediente reinicia a seleção desse ingrediente.
3. Para eliminar, remove o JSON. Na próxima geração desaparece do catálogo, das compras e da publicação. Uma segunda geração local também elimina a página e o JSON publicados anteriormente. Favoritos para receitas eliminadas deixam naturalmente de existir.
4. Valida e gera; envia a alteração num pull request ou para `main`. Não edites `data/` nem `public/`.

```sh
npm ci
npm run validate
npm run index
npm test
npm run build
npx playwright install chromium
npx playwright test
node tests/server.js
```

Abre `http://127.0.0.1:4173/livro-de-receitas/index.html`. É necessário servir por HTTP: abrir o HTML diretamente como `file://` não permite carregar os JSON de forma fiável. `node gerar.mjs` continua a funcionar sem instalar dependências. Node 20 ou superior; Actions usa Node 22. A única dependência de desenvolvimento é Playwright, com versões fixadas no lockfile; o site não tem dependências externas de execução. No Windows também podes testar com Edge: em PowerShell, `$env:PW_CHANNEL='msedge'` antes de executar os testes.

### Campos e valores desconhecidos

`versao` é 1; `ordem` preserva a ordenação anterior (o catálogo mostra primeiro a maior ordem). `categorias` e `etiquetas` são listas. `imagem` aceita um URL HTTPS ou `null`; nenhuma imagem foi inventada. `preparacao` e `cozedura` usam minutos ou `null` quando não conhecidos; `minutos` contém o total original. `equipamento: []` indica informação não fornecida.

Os ingredientes são objetos, por exemplo este ingrediente real do risotto:

```json
{
  "nome": "Arroz carnaroli ou arbório",
  "quantidade": 450,
  "unidade": "g",
  "componente": null,
  "notas": "",
  "opcional": false
}
```

`componente` permite agrupar ingredientes consecutivos (por exemplo, molho); `notas` e `opcional` aparecem na página. A migração deixa componentes não definidos como `null`, sem inferir classificações. `quantidade: null` exige `unidade: "q.b."`; quantidades numéricas são proporcionais às porções. Os tempos não são escalados. O esquema rejeita campos desconhecidos, valores inválidos e estruturas incompletas; a validação adicional verifica duplicados, nomes de ficheiros e referências a ingredientes. O validador local implementa apenas os termos usados neste esquema, não é um validador universal de JSON Schema.

Os campos preparacao, cozedura, equipamento, antes, complemento e detalhes enriquecem uma receita. Cada elemento de detalhes corresponde ao passo na mesma posição. Os índices de ingredientes em usa e indices começam em zero e devem acompanhar a ordem da lista. Uma quantidade null com unidade q.b. mantém o tempero sem escala numérica.

Os testes do navegador cobrem catálogo, URLs antigos, escala, limites de porções, compras consolidadas, cópia, exportação, seleção/progresso guardados, modo de cozinha, falha de carregamento e limitações de permissões. A cópia usa uma simulação da API do clipboard; a exportação verifica o download real. O ecrã permanentemente ligado e a importação final na conta Bring! continuam dependentes do dispositivo e das permissões do utilizador. Os testes verificam o URL público, as porções e o JSON-LD, mas não gravam compras numa conta Bring! nem confirmam a importação de uma branch ainda não publicada.

A receita de risotto usa as quantidades recuperadas do jantar de Halloween. Para completar a preparação do óleo de cebolinho, esta edição acrescenta uma versão simples com 10 g de cebolinho e 40 ml de azeite para seis porções. O tempo total de 50 minutos é estimado, partindo de beterraba já cozida ou assada.

Mantém os identificadores estáveis para preservar favoritos e escolhas. Os antigos links index.html#identificador redirecionam para a página da receita. Os dados Recipe em JSON-LD estão no HTML original, para leitura pelo Bring!.
