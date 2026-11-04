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

Edita receitas.json no ramo main. O fluxo do GitHub Actions gera e publica o site automaticamente. Para regenerar a cópia local, executa `node gerar.mjs`.

Os campos preparacao, cozedura, equipamento, antes, complemento e detalhes enriquecem uma receita. Cada elemento de detalhes corresponde ao passo na mesma posição. Os índices de ingredientes em usa e indices começam em zero e devem acompanhar a ordem da lista. Uma quantidade null com unidade q.b. mantém o tempero sem escala numérica.

A receita de risotto usa as quantidades recuperadas do jantar de Halloween. Para completar a preparação do óleo de cebolinho, esta edição acrescenta uma versão simples com 10 g de cebolinho e 40 ml de azeite para seis porções. O tempo total de 50 minutos é estimado, partindo de beterraba já cozida ou assada.

Mantém os identificadores estáveis para preservar favoritos e escolhas. Os antigos links index.html#identificador redirecionam para a página da receita. Os dados Recipe em JSON-LD estão no HTML original, para leitura pelo Bring!.
