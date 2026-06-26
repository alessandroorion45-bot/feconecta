# 🚀 Como Aplicar as Migrations Manualmente

## ✅ Servidor de Desenvolvimento Rodando

O servidor está rodando em:
- **Local:** http://localhost:8080/
- **Network:** http://192.168.15.5:8080/

---

## 📋 Migrations Para Aplicar

Você precisa aplicar 2 migrations no Supabase Dashboard:

### 1️⃣ Migration: Versículo do Dia
**Arquivo:** `supabase/migrations/20260626000000_daily_verse_system.sql`

### 2️⃣ Migration: Trigger XP Curtidas
**Arquivo:** `supabase/migrations/20260626000001_comment_like_xp_trigger.sql`

---

## 🔧 Passo a Passo - Supabase Dashboard

### Opção 1: SQL Editor (Recomendado)

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Vá para SQL Editor:**
   - Menu lateral → SQL Editor

3. **Copie e cole o conteúdo da Migration 1:**
   ```bash
   # Abra o arquivo:
   supabase/migrations/20260626000000_daily_verse_system.sql
   
   # Copie todo o conteúdo
   # Cole no SQL Editor
   # Clique em "Run" (ou Ctrl + Enter)
   ```

4. **Copie e cole o conteúdo da Migration 2:**
   ```bash
   # Abra o arquivo:
   supabase/migrations/20260626000001_comment_like_xp_trigger.sql
   
   # Copie todo o conteúdo
   # Cole no SQL Editor
   # Clique em "Run" (ou Ctrl + Enter)
   ```

5. **Verifique se aplicou corretamente:**
   - Deve aparecer: "Success" ou "Sucesso"
   - Verifique a última linha de cada migration:
     - Migration 1: "Sistema de Versículo do Dia criado com sucesso!"
     - Migration 2: "Trigger de XP para curtidas em comentários criado com sucesso!"

---

### Opção 2: Via CLI (Alternativa)

Se preferir usar CLI depois:

```bash
# No terminal, execute:
cd e:/feconecta

# Aplicar apenas as novas migrations (forçar)
cat supabase/migrations/20260626000000_daily_verse_system.sql | psql YOUR_DATABASE_URL

cat supabase/migrations/20260626000001_comment_like_xp_trigger.sql | psql YOUR_DATABASE_URL
```

---

## ✅ Verificação Pós-Aplicação

Após aplicar as migrations, verifique se funcionou:

### 1. Verificar Funções RPC Criadas

No SQL Editor, execute:

```sql
-- Verificar se a função get_daily_verse existe
SELECT proname FROM pg_proc WHERE proname = 'get_daily_verse';

-- Testar a função
SELECT * FROM get_daily_verse();
```

### 2. Verificar Tabela Criada

```sql
-- Verificar se a tabela daily_verse_history existe
SELECT * FROM daily_verse_history LIMIT 5;
```

### 3. Verificar Trigger

```sql
-- Verificar se o trigger foi criado
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_award_xp_on_comment_like';
```

---

## 🧪 Testando no Navegador

### 1. Acesse a aplicação:
http://localhost:8080/bible

### 2. Verifique o Versículo do Dia:
- ✅ Card destacado no topo da página
- ✅ Versículo carregado automaticamente
- ✅ Botões "Favoritar" e "Compartilhar"

### 3. Teste a Gamificação:

#### Favoritar (+2 XP)
1. Clique em ❤️ "Favoritar" em qualquer versículo
2. Deve aparecer toast: "❤️ Adicionado aos favoritos! (+2 XP)"

#### Comentar (+5 XP)
1. Clique em "Comentar" em um versículo
2. Digite um comentário
3. Clique em "Publicar"
4. Deve aparecer toast: "✨ Comentário publicado! +5 XP"

#### Responder Comentário (+5 XP)
1. Clique em "Responder" em um comentário
2. Digite uma resposta
3. Clique em "Responder"
4. Deve aparecer toast: "✨ Resposta publicada! +5 XP"

#### Compartilhar (+10 XP)
1. Clique em "Compartilhar" em um versículo
2. Escolha um dos 8 temas premium
3. Compartilhe em qualquer plataforma
4. Deve aparecer toast com "+10 XP"

#### Curtir Comentário (+3 XP automático para o autor)
1. Curta um comentário de outro usuário
2. O autor do comentário ganha +3 XP automaticamente (trigger SQL)

### 4. Teste os 8 Temas de Compartilhamento:

1. Clique em "Compartilhar" em qualquer versículo
2. Navegue pelas tabs dos temas:
   - 🌑 Dark Royal
   - ☀️ Reino Celestial
   - 💎 Nova Jerusalém
   - 👑 Trono da Glória
   - 🌿 Jardim do Éden
   - ⛰️ Monte Sião
   - 💠 Diamante da Promessa
   - 🔥 Fogo de Pentecostes
3. Veja o preview mudar em tempo real
4. Baixe a imagem em HD

### 5. Teste o Modo Leitura:

1. Clique em "Modo Leitura" no header
2. Ajuste:
   - Tamanho da fonte
   - Espaçamento
   - Largura do texto
   - Tipo de fonte
   - Tema (Claro/Escuro/Sépia)
3. Ative o "Modo Foco"
4. Verifique se oculta menus e ações

---

## 📊 Estrutura de Dados Criada

### Tabela: `daily_verse_history`
```sql
- id (uuid)
- date (date) - Única
- book_id (integer)
- chapter (integer)
- verse (integer)
- text (text)
- views_count (integer)
- shares_count (integer)
- favorites_count (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Funções RPC:
- `get_daily_verse()` - Retorna versículo do dia
- `record_daily_verse_view()` - Registra visualização
- `record_daily_verse_share()` - Registra compartilhamento
- `record_daily_verse_favorite()` - Registra favoritamento

### Trigger:
- `trigger_award_xp_on_comment_like` - XP automático ao receber curtida

---

## 🐛 Troubleshooting

### Erro: "function get_daily_verse does not exist"
✅ **Solução:** Aplique a migration `20260626000000_daily_verse_system.sql`

### Erro: "table daily_verse_history does not exist"
✅ **Solução:** Aplique a migration `20260626000000_daily_verse_system.sql`

### Erro: "trigger does not exist"
✅ **Solução:** Aplique a migration `20260626000001_comment_like_xp_trigger.sql`

### Versículo do Dia não aparece
1. Verifique se aplicou a migration
2. Verifique se tem dados na tabela `bible_verses`
3. Teste a função no SQL Editor:
   ```sql
   SELECT * FROM get_daily_verse();
   ```

### XP não está sendo concedido
1. Verifique se o hook `useGamification` está sendo chamado
2. Verifique se a tabela `profiles` tem as colunas `xp` e `level`
3. Para o trigger de curtidas, verifique se foi criado:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_award_xp_on_comment_like';
   ```

---

## ✅ Checklist Final

Após aplicar as migrations e testar:

- [ ] Migrations aplicadas no Supabase Dashboard
- [ ] Função `get_daily_verse()` existe e funciona
- [ ] Tabela `daily_verse_history` existe
- [ ] Trigger `trigger_award_xp_on_comment_like` existe
- [ ] Versículo do Dia aparece na página `/bible`
- [ ] XP é concedido ao favoritar (+2 XP)
- [ ] XP é concedido ao comentar (+5 XP)
- [ ] XP é concedido ao compartilhar (+10 XP)
- [ ] XP é concedido automaticamente ao receber curtida (+3 XP)
- [ ] 8 temas de compartilhamento funcionam
- [ ] Modo leitura funciona
- [ ] Comentários aninhados funcionam
- [ ] Ordenação de comentários funciona

---

**🎉 Pronto! Todas as funcionalidades estão implementadas e prontas para uso!**
