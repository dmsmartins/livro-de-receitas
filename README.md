# À mesa. — Caderno de cozinha

Abre o index.html para usar o caderno. Marca «Incluir na lista de compras» em cada receita desejada. As porções e ingredientes assinalados ficam neste navegador. A lista soma ingredientes com o mesmo nome e unidade.

## Receitas e publicação

Edita receitas.json. Cada ingrediente contém nome, quantidade e unidade. Cada passo contém título, instrução e uma dica previamente escrita. Mantém os identificadores das receitas estáveis. Usa sempre as mesmas unidades para os ingredientes que queres somar.

Executa `node gerar.mjs` e inclui o JSON e os HTML gerados no mesmo commit. O GitHub Pages publica a raiz do ramo main. O site funciona sem dependências de execução. Cada receita tem um URL próprio e os dados Recipe em JSON-LD no HTML original.

## Testar o Bring! no telemóvel

1. Abre a receita «Tomate com manjericão» no site publicado e escolhe «Abrir receita para o Bring!».
2. Usa o botão oficial ou o menu de partilha do navegador e escolhe Bring!. Na app, seleciona uma lista de teste e mantém duas porções.
3. Confirma 300 g de tomate, 10 ml de azeite e 4 folhas de manjericão. Adiciona os artigos e verifica a lista de destino.
4. Se a partilha não estiver disponível, usa a lista do caderno. «Copiar lista» e «Guardar .txt» preservam porções e exclusões para consulta ou introdução manual.

O teste inicial enviou teste-bring.html, servido num URL HTTPS público, ao verificador oficial antes da implementação do livro. O serviço devolveu HTTP 200, duas porções e três entradas: tomate (300 g), Olivenöl (10 ml) e folhas de manjericao (4). A nomenclatura pode variar com o idioma. A leitura pelo serviço e a gravação na conta são verificações distintas.

O botão oficial importa uma receita por URL. As escolhas locais de várias receitas são exportadas em texto. O site não pede credenciais Bring!.

[Verificador oficial](https://www.getbring.com/en/integration-check) · [Guia de partilha](https://www.getbring.com/blog-posts/meal-planning-for-the-week-with-bring)
