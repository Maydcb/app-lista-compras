# 🛒 Lista de Compras

App web simples para substituir a lista de compras impressa. Você cria um **modelo** com os itens de sempre e gera uma **lista nova** a partir dele a cada ida ao mercado.

**Acesse:** https://maydcb.github.io/app-lista-compras/

## Funcionalidades

- **Modelos:** cadastre os itens que você sempre compra, na ordem dos corredores do mercado
- **Listas:** geradas a partir de um modelo, com três colunas:
  - **Comprar:** o nome do item
  - **Tem em casa:** quantos você já tem
  - **Pegar:** quantos precisa comprar
- **Riscar itens:** toque no item para marcar como pego; os itens pegos descem para a seção "No carrinho"
- **Filtro "A pegar":** mostra só o que tem quantidade para comprar
- **Renomear e excluir** listas e modelos, incluindo a exclusão das listas concluídas
- **Copiar a lista** em texto para enviar por WhatsApp
- Funciona no celular e no computador, com tema claro e escuro
- **Instalável (PWA):** dá para "Adicionar à tela inicial" do celular e abrir sem internet

## Tecnologias

- HTML, CSS e JavaScript puro, sem frameworks e sem build
- Dados salvos no navegador com `localStorage`

## Como rodar localmente

Não precisa instalar nada: basta abrir o arquivo `index.html` no navegador. (O modo offline/PWA só funciona quando o app é servido por `http(s)`, como no GitHub Pages.)

## Estrutura do projeto

```
app-lista-compras/
├── index.html        # estrutura da página
├── css/style.css     # aparência
├── js/app.js         # comportamento
├── manifest.json     # dados do app instalável (nome, ícones, cores)
├── sw.js             # service worker: permite abrir sem internet
├── icons/            # ícones do app (aba do navegador e tela inicial)
├── README.md         # este arquivo
└── .gitignore        # arquivos que o Git deve ignorar
```

## Observações

- Os dados ficam salvos **no navegador de cada aparelho**. Uma lista criada no computador não aparece no celular.
- Limpar os dados do navegador apaga as listas.
