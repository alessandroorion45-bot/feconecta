# ⚡ CORRIGIR GOOGLE AUTH - GUIA RÁPIDO

**Problema**: Erro 404 ao fazer login com Google  
**Tempo para corrigir**: 10 minutos

---

## 🎯 CAUSA DO PROBLEMA

O Google está redirecionando corretamente para:
```
https://feconecta-69w6.vercel.app/auth?code=...
```

Mas o Supabase ou Google Cloud não estão autorizando essa URL.

---

## 🔧 SOLUÇÃO RÁPIDA (3 PASSOS)

### **PASSO 1: Corrigir Supabase** ⚡ (5 min)

1. **Acesse**: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/auth/url-configuration

2. **Configure Site URL**:
   ```
   https://feconecta-69w6.vercel.app
   ```

3. **Configure Redirect URLs** (clique em "Add another redirect URL" para cada uma):
   ```
   https://feconecta-69w6.vercel.app/**
   https://feconecta-69w6.vercel.app/auth
   http://localhost:8080/**
   http://localhost:8080/auth
   ```

4. **Marque**: ✅ "Enable Wildcard Matching"

5. **Clique em**: `SAVE`

---

### **PASSO 2: Corrigir Google Cloud Console** ⚡ (3 min)

1. **Acesse**: https://console.cloud.google.com/apis/credentials

2. **Clique** no seu OAuth 2.0 Client ID

3. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://kfetvofrwtuduwmpvdlz.supabase.co/auth/v1/callback
   https://feconecta-69w6.vercel.app
   https://feconecta-69w6.vercel.app/auth
   http://localhost:8080
   http://localhost:8080/auth
   ```

4. **Clique em**: `SAVE`

---

### **PASSO 3: Verificar Provider Google** ⚡ (2 min)

1. **Acesse**: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/auth/providers

2. **Encontre "Google"** na lista de providers

3. **Verifique**:
   - ✅ Toggle está ATIVADO (verde)
   - ✅ Client ID está preenchido
   - ✅ Client Secret está preenchido

4. **Se não estiver configurado**:
   - Copie Client ID do Google Cloud Console
   - Copie Client Secret do Google Cloud Console
   - Cole no Supabase
   - Clique em `SAVE`

---

## 🧪 TESTAR AGORA

### **Teste em Produção**:

1. Limpe o cache do navegador (Ctrl + Shift + Delete)

2. Acesse: https://feconecta-69w6.vercel.app/auth

3. Clique em **"Entrar com Google"**

4. **Resultado esperado**:
   - ✅ Redireciona para Google
   - ✅ Escolhe conta
   - ✅ Volta para `/auth` SEM 404
   - ✅ Redireciona para `/feed` (ou modal de país)

---

### **Teste em Localhost**:

```bash
# 1. Iniciar servidor
npm run dev

# 2. Acessar
http://localhost:8080/auth

# 3. Clicar em "Entrar com Google"

# 4. Verificar funcionamento
```

---

## 🔍 VERIFICAR CONSOLE DO NAVEGADOR (F12)

Abra DevTools → Console e verifique se aparece:

```javascript
✅ [Auth] OAuth callback detectado: code
✅ [Auth] Processando OAuth callback...
✅ [Auth] Usuário autenticado via OAuth: seu@email.com
✅ [Auth] Redirecionando para /feed
```

Se aparecer **erros**:
- ❌ "Provider not enabled" → Ativar Google no Supabase (Passo 3)
- ❌ "redirect_uri_mismatch" → Adicionar URL no Google Cloud (Passo 2)
- ❌ "Invalid redirect URL" → Adicionar URL no Supabase (Passo 1)

---

## 📋 CHECKLIST RÁPIDO

- [ ] Site URL configurado no Supabase
- [ ] Redirect URLs configuradas no Supabase (com wildcard)
- [ ] Authorized redirect URIs no Google Cloud Console
- [ ] Provider Google ativado no Supabase
- [ ] Client ID e Secret preenchidos
- [ ] Testado em produção
- [ ] Login funcionando ✅

---

## 🆘 AINDA NÃO FUNCIONA?

### **1. Verifique se o projeto Google está publicado**:

1. Acesse: https://console.cloud.google.com/apis/credentials/consent
2. Se estiver em **"Testing"**, adicione seu email em **"Test users"**
3. Ou publique o app clicando em **"PUBLISH APP"**

### **2. Limpe TUDO e tente novamente**:

```javascript
// Abra o console do navegador (F12) e execute:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### **3. Verifique se o domínio Vercel está correto**:

No Vercel Dashboard, verifique se o domínio do projeto é mesmo:
```
feconecta-69w6.vercel.app
```

Se for diferente, atualize nos passos 1 e 2 acima.

---

## 📞 SUPORTE

Se nada funcionar, verifique:

1. **Console do navegador** (F12 → Console) - copie os erros
2. **Network tab** (F12 → Network) - veja as requisições
3. **Supabase Logs**: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/logs/edge-logs

---

**Boa sorte! 🚀**
