# Calculadora de Compras

App web mobile-first para somar compras de supermercado, salvar o histórico por data e mercado e comparar preços ao longo do tempo. Implementa o [PRD](docs/PRD.md).

**Stack:** React 19 + Vite + TypeScript, Tailwind CSS v4, Zustand (persistência em `localStorage`), Motion (animações), Vercel Analytics.

## Funcionalidades

- **Compra atual** — adicione produto, preço unitário e quantidade; o formulário fica aberto e o foco volta ao nome para o próximo item. Total fixo no topo, subtotal por item, sugestões de nomes já usados e aviso com o último preço pago.
- **Editar/remover** itens da compra atual e de compras salvas.
- **Salvar compra** com nome do supermercado (com sugestões) e data preenchida automaticamente.
- **Histórico** com compras expansíveis e filtros por supermercado e período.
- **Comparar preços** — por produto: menor/média/maior, gráfico de evolução, preço por supermercado (destaca o mais barato) e tabela com todos os registros.
- Onboarding na primeira visita (com "Pular"), estados vazios, fallback em memória quando o `localStorage` não está disponível.
- Eventos rastreados (Vercel Analytics): `product_added`, `session_saved`, `history_viewed`, `price_comparison_used`, `item_edited`, `item_deleted`.

Os dados ficam apenas no aparelho do usuário (offline-first). Sincronização em nuvem/login (P2) não está incluída.

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build
```

## Deploy na Vercel

O `vercel.json` já define framework (Vite), build, pasta `dist`, rewrite de SPA e cache dos assets.

- **Pelo painel:** suba o projeto para um repositório Git e importe em vercel.com/new — nenhuma configuração extra é necessária.
- **Pela CLI:** `npx vercel` (preview) ou `npx vercel --prod`.

Para ver as métricas, ative **Analytics** no projeto dentro do painel da Vercel.
