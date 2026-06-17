# PROMPT — Bíblia ACF no Supabase + FéConecta

## ✅ PASSO 1: Executar SQL no Supabase

Acesse: **https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/sql/new**

Cole e execute o SQL que está no arquivo: `database-bible-schema.sql`

---

## ✅ PASSO 2: Executar script de importação

No terminal, execute:

```bash
npx tsx scripts/importBiblia.ts
```

Aguarde a importação (pode levar alguns minutos).

---

## ✅ PASSO 3: Verificar importação

No Supabase, vá em **Table Editor** e verifique:
- `bible_books` deve ter 66 registros
- `bible_verses` deve ter ~31.000 versículos

---

## 📚 Créditos

Bíblia Almeida Corrigida e Fiel (ACF) — Domínio Público
Dados: github.com/thiagobodruk/biblia
