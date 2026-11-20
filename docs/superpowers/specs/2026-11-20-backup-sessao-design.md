# Backup de compras

## Intenção

O histórico vive só neste navegador. Um arquivo que a pessoa guarda fora do aparelho permite recuperar todas as compras e o carrinho aberto depois de limpar o navegador ou trocar de celular.

## Objetivos

- Baixar um JSON com todas as compras salvas e o carrinho aberto.
- Em seguida, abrir a folha de compartilhamento do sistema com esse mesmo arquivo, quando o navegador permitir.
- Restaurar um arquivo substituindo compras e carrinho deste aparelho, depois de confirmação.
- Mostrar “Restaurar backup” também no Histórico vazio.

## Fora do escopo

- Conta, nuvem e planilha.
- Copiar o armazenamento cru do navegador.
- Incluir o tutorial no arquivo.
- Exportar só o que os filtros do Histórico estão mostrando.

## Restrições

- Sem dependência nova.
- App offline, React, Vite e Zustand.
- A confirmação reutiliza o diálogo já existente.
- Arquivo inválido, de outra versão ou incompleto não altera os dados.

## Abordagens

- JSON versionado, lido e gravado no próprio app. É o caminho escolhido: a restauração fica igual à foto daquele dia e o tutorial continua local.
- Cópia crua do armazenamento do navegador. Levaria o tutorial junto e quebraria quando o formato interno mudasse.
- Planilha. Os produtos de cada compra não voltam iguais.

## Comportamento

No Histórico, “Fazer backup” baixa `compras-AAAA-MM-DD.json` e, se o aparelho puder compartilhar arquivos, abre a folha do sistema. Cancelar a folha não é erro: o arquivo já foi baixado. O botão só aparece se houver compra salva ou item no carrinho.

“Restaurar backup” escolhe um arquivo. Se for válido, o diálogo diz quantas compras deste aparelho vão sair e o que o arquivo traz. “Substituir” troca compras e carrinho, mantém o tutorial e limpa os filtros do Histórico, para a compra restaurada não ficar escondida. “Cancelar” não muda nada.

O arquivo tem `version: 1`, `exportedAt`, `current` e `sessions`. Os ids de compras e produtos são os do arquivo. Campos desconhecidos são ignorados.

## O que fica com quem implementa

- Texto único para arquivo inválido: “Esse arquivo não é um backup válido desta calculadora.”
- Frases no singular e no vazio, no mesmo formato da frase de 12 compras, 40 compras e 3 itens.
- Módulo puro para gravar, ler e validar. Os botões ficam num componente próprio, para o Histórico não crescer em volta do arquivo.
