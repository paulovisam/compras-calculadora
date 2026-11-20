# Backup de compras — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exportar e restaurar todas as compras e o carrinho aberto num arquivo JSON.

**Architecture:** Um módulo puro grava, lê e valida o arquivo. O Zustand só ganha a troca de compras e carrinho. O Histórico mostra os botões e o diálogo de confirmação que já existe.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, `node:test` sem dependência nova.

**Spec:** `docs/superpowers/specs/2026-11-20-backup-sessao-design.md`

## Global Constraints

- Sem dependência nova.
- O arquivo não inclui o tutorial (`onboarded`).
- A exportação ignora os filtros do Histórico.
- Arquivo inválido não altera compras nem carrinho.
- A mensagem de arquivo inválido é exatamente `Esse arquivo não é um backup válido desta calculadora.`
- O nome do arquivo é `compras-AAAA-MM-DD.json`.
- Não criar commit: a regra do repositório só permite commit quando a pessoa pede.

## Review Focus

- Arquivo com preço negativo, quantidade zero, data impossível ou ids repetidos é recusado e os dados atuais permanecem.
- Cancelar o compartilhamento não mostra erro, porque o download já aconteceu.
- Restaurar no Histórico vazio continua disponível.
- “Substituir” não apaga a marca de tutorial já visto.
- Escolher o mesmo arquivo duas vezes dispara a leitura de novo.

---

### Task 1: Módulo de backup

**Files:**
- Create: `src/lib/backup.ts`
- Test: `tests/backup.test.ts`
- Modify: `package.json` (script `test`)

**Interfaces:**
- Consumes: tipos `Item` e `Session` de `src/store.ts` (só tipo)
- Produces:
  - `BACKUP_INVALID_MESSAGE: string`
  - `backupFilename(dateISO: string): string`
  - `canExportBackup(sessionCount: number, cartCount: number): boolean`
  - `serializeBackup(current: Item[], sessions: Session[], exportedAt: string): string`
  - `parseBackup(raw: string): { ok: true; backup: BackupFile } | { ok: false; error: string }`
  - `restoreMessage(localSessions: number, fileSessions: number, fileCartItems: number): string`
  - `BackupFile = { version: 1; exportedAt: string; current: Item[]; sessions: Session[] }`

- [x] **Step 1:** Escrever `tests/backup.test.ts` cobrindo ida e volta, nome do arquivo, frase de restauração, recusa de arquivo inválido e descarte de campos extras.
- [x] **Step 2:** Rodar `node --test tests/backup.test.ts` e ver falhar porque o módulo não existe.
- [x] **Step 3:** Implementar `src/lib/backup.ts` com as assinaturas acima.
- [x] **Step 4:** Rodar `node --test tests/backup.test.ts` e ver passar.
- [x] **Step 5:** Adicionar `"test": "node --test tests/*.test.ts"` em `package.json`.

### Task 2: Troca no armazenamento e botões

**Files:**
- Modify: `src/store.ts`
- Create: `src/components/BackupActions.tsx`
- Modify: `src/pages/History.tsx`

**Interfaces:**
- Consumes: as funções da Task 1 e `ConfirmDialog`
- Produces: `replaceBackup(current: Item[], sessions: Session[]): void` no store, sem mexer em `onboarded`

- [x] **Step 1:** Adicionar `replaceBackup` que faz `set({ current, sessions })`.
- [x] **Step 2:** Criar `BackupActions` com “Fazer backup” (baixa e, se `navigator.canShare` aceitar o arquivo, abre `navigator.share`) e “Restaurar backup” (input de arquivo, validação, confirmação, `replaceBackup`).
- [x] **Step 3:** No Histórico vazio e no cheio, mostrar o componente. “Fazer backup” só quando `canExportBackup` for verdadeiro.
- [x] **Step 4:** `npm test` e `npm run build`.
