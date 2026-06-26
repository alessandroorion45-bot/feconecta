# 🧪 TESTES PÓS-DEPLOY - FECONECTA

**Data:** 26/06/2026  
**Commit:** 90a3773  
**URL Produção:** https://feconecta-69w6.vercel.app

---

## ✅ STATUS DO DEPLOY

### Deploy Verificado
- ✅ **Site no ar:** https://feconecta-69w6.vercel.app
- ✅ **Título correto:** "Rede da Fé - Comunidade Cristã Online"
- ✅ **Sem erros de build**

### ⚠️ Problema Detectado
- ❌ **Rotas SPA retornando 404:** `/bible`, `/admin`, etc.
- **Causa:** Vercel pode não estar aplicando corretamente as rewrites
- **Solução:** Verificar configuração do Vercel ou aguardar propagação

---

## 🧪 CHECKLIST DE TESTES MANUAIS

Execute estes testes **MANUALMENTE** no navegador:

### 1️⃣ TESTE DE SEGURANÇA - Admin Hardcoded

**Objetivo:** Verificar se a correção de admin hardcoded está funcionando

**Passos:**
1. Abra: https://feconecta-69w6.vercel.app
2. Faça login (se ainda não estiver logado)
3. Abra DevTools (F12) → Console
4. Tente acessar: https://feconecta-69w6.vercel.app/admin

**Resultado Esperado:**
- ✅ Se **NÃO for admin**: Deve redirecionar para `/` (home)
- ✅ Se **for admin (via RLS)**: Deve mostrar dashboard

**Verificação da Correção:**
- Abra DevTools → Sources → `Dashboard.tsx`
- Procure por `alessandroibama40@gmail.com`
- **Não deve existir!** (foi removido)
- Deve ter `useAdmin()` no lugar

---

### 2️⃣ TESTE DE PERFORMANCE - Bíblia (N+1 Query)

**Objetivo:** Verificar se a Bíblia carrega 20x mais rápido

**Passos:**
1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Abra DevTools → Network
3. Acesse: https://feconecta-69w6.vercel.app/bible
4. Aguarde o carregamento completo
5. Verifique o tempo total no Network

**Resultado Esperado:**
- ✅ **Antes:** ~60 segundos
- ✅ **Depois:** ~3-5 segundos (20x mais rápido!)

**Verificação da Correção:**
- DevTools → Network → Filter: `bible_verses`
- **Antes:** 66 requests (uma por livro)
- **Depois:** 1 request (todos os livros de uma vez)

---

### 3️⃣ TESTE DE GAMIFICAÇÃO - Loop Infinito

**Objetivo:** Verificar se não há mais loop infinito em useGamification

**Passos:**
1. Abra DevTools → Console
2. Acesse qualquer página que use gamificação (ex: `/profile`)
3. Observe o Console por 10 segundos

**Resultado Esperado:**
- ✅ **Console calmo** (poucos logs)
- ✅ **CPU normal** (<50%)
- ❌ **NÃO deve ter** logs se repetindo infinitamente

**Verificação da Correção:**
- DevTools → Performance → Record por 10s
- CPU deve estar **normal**, não 100%

---

### 4️⃣ TESTE DE XP - GameAction Inválido

**Objetivo:** Verificar se XP é concedido ao ler capítulo da Bíblia

**Passos:**
1. Faça login
2. Acesse: https://feconecta-69w6.vercel.app/bible
3. Leia um capítulo completo (role até o final)
4. Observe o toast de notificação

**Resultado Esperado:**
- ✅ Toast: "Capítulo completado! 📖"
- ✅ "+15 XP concedidos"
- ✅ XP deve aparecer no perfil

**Verificação da Correção:**
- DevTools → Console
- **NÃO deve ter erro:** `GameAction 'bible_reading_completed' not found`
- Deve usar: `bible_reading` (ação válida)

---

### 5️⃣ TESTE DE AUTH - Session Key

**Objetivo:** Verificar se sessão persiste após reload

**Passos:**
1. Faça login
2. Pressione F5 (recarregar página)
3. Verifique se continua logado

**Resultado Esperado:**
- ✅ **Continua logado** (não pede login novamente)
- ✅ Sessão recuperada do localStorage

**Verificação da Correção:**
- DevTools → Application → Local Storage
- Procure chave: `sb-kfetvofrwtuduwmpvdlz-auth-token`
- **NÃO deve ter:** `sb-ucpsiqmsxocwasorvojw` (chave antiga)

---

### 6️⃣ TESTE DE LOGOUT - Preservar Cache

**Objetivo:** Verificar se cache da Bíblia é preservado no logout

**Passos:**
1. Acesse `/bible` e aguarde carregar completamente
2. Faça logout
3. Faça login novamente
4. Acesse `/bible` novamente

**Resultado Esperado:**
- ✅ **Segunda carga INSTANTÂNEA** (cache preservado)
- ✅ Não recarrega todos os versículos

**Verificação da Correção:**
- DevTools → Application → Local Storage
- Após logout, chaves de **cache da Bíblia ainda existem**
- Apenas chaves `sb-*`, `auth*`, `supabase*` foram removidas

---

### 7️⃣ TESTE DE MEMORY LEAK - Presence

**Objetivo:** Verificar se não há memory leak em subscriptions

**Passos:**
1. Abra DevTools → Performance → Memory
2. Acesse: https://feconecta-69w6.vercel.app/friends
3. Espere 30 segundos
4. Navegue para outra página
5. Volte para `/friends`
6. Repita 5x

**Resultado Esperado:**
- ✅ **Heap Size estável** (não cresce infinitamente)
- ✅ Canais Realtime são fechados ao sair da página

**Verificação da Correção:**
- Memory Heap deve **retornar ao normal** após sair da página

---

### 8️⃣ TESTE DE MEMORY LEAK - Quiz Timer

**Objetivo:** Verificar se timer do Quiz não cria múltiplos intervals

**Passos:**
1. Acesse: https://feconecta-69w6.vercel.app/quiz
2. Inicie um quiz
3. Observe o timer contando
4. Navegue para outra página ANTES do tempo acabar
5. Volte para `/quiz`

**Resultado Esperado:**
- ✅ **Apenas 1 timer rodando** (não múltiplos)
- ✅ Timer é limpo ao sair da página

**Verificação da Correção:**
- DevTools → Console
- **NÃO deve ter** múltiplos logs de countdown simultâneos

---

## 📊 TEMPLATE DE RELATÓRIO

Após executar os testes, preencha:

```markdown
# Relatório de Testes - 26/06/2026

## Testes Executados

- [ ] 1. Segurança Admin
- [ ] 2. Performance Bíblia
- [ ] 3. Gamificação Loop
- [ ] 4. XP Bíblia
- [ ] 5. Auth Session
- [ ] 6. Logout Cache
- [ ] 7. Memory Leak Presence
- [ ] 8. Memory Leak Quiz

## Resultados

### ✅ Sucessos
- [Liste os testes que passaram]

### ❌ Falhas
- [Liste os testes que falharam]

### ⚠️ Observações
- [Notas adicionais]

## Métricas

- **Carregamento Bíblia:** ___ segundos
- **CPU durante navegação:** ___% 
- **XP concedido:** Sim / Não
- **Sessão persistiu:** Sim / Não
```

---

## 🔧 TROUBLESHOOTING

### Problema: Rotas retornam 404
**Solução:**
1. Aguardar 5-10 minutos (propagação do deploy)
2. Se persistir, verificar configuração Vercel
3. Acessar diretamente: https://feconecta-69w6.vercel.app/#/bible (com hash)

### Problema: Erro de CORS
**Solução:**
1. Verificar variáveis de ambiente no Vercel
2. Confirmar URL do Supabase está correta

### Problema: Login não funciona
**Solução:**
1. Verificar se Supabase está no ar
2. Checar variáveis de ambiente
3. Limpar cache e cookies

---

## 📞 SUPORTE

Se encontrar problemas:
1. Abrir DevTools → Console
2. Copiar mensagens de erro
3. Reportar com print do erro

---

**Boa sorte nos testes! 🚀**
