# 🛒 Lista de Compras

App web simples para substituir a lista de compras impressa. Você cria um **modelo** com os itens de sempre e gera uma **lista nova** a partir dele a cada ida ao mercado.

## Funcionalidades

- **Modelos:** cadastre os itens que você sempre compra, na ordem dos corredores do mercado
- **Listas:** geradas a partir de um modelo, com três colunas:
  - **Comprar:** o nome do item
  - **Tem em casa:** quantos você já tem
  - **Pegar:** quantos precisa comprar
- **Riscar itens:** toque no item para marcar como pego
- **Filtro "A pegar":** mostra só o que tem quantidade para comprar
- **Renomear e excluir** listas, incluindo a exclusão das listas concluídas
- **Copiar a lista** em texto para enviar por WhatsApp
- Funciona no celular e no computador, com tema claro e escuro

## Tecnologias

- HTML, CSS e JavaScript puro, sem frameworks e sem build
- Dados salvos no navegador com `localStorage`

## Como rodar localmente

Não precisa instalar nada: basta abrir o arquivo `index.html` no navegador.

## Estrutura do projeto

```
app-lista-compras/
├── index.html        # o app inteiro (HTML, CSS e JS)
├── README.md         # este arquivo
├── .gitignore        # arquivos que o Git deve ignorar
└── docs/
    └── requisitos.md # o pedido original do projeto
```

## Observações

- Os dados ficam salvos **no navegador de cada aparelho**. Uma lista criada no computador não aparece no celular.
- Limpar os dados do navegador apaga as listas.
