# 🔍 AUDITORIA - Erro 404 no Login com Google

**Data**: 24/06/2026  
**Problema**: Erro 404 ao fazer login com Google  
**URL com erro**: `https://feconecta-69w6.vercel.app/auth?code=b4a5d9ea-044c-49b1-aecc-b6d86528c528`

---

## 🎯 DIAGNÓSTICO INICIAL

### ✅ O QUE ESTÁ CORRETO:

1. **Rota `/auth` existe no código**
   - Arquivo: `src/App.tsx` linha 85
   - Configuração: `{ path: "/auth", element: <Auth /> }`
   - Status: ✅ OK

2. **Função de login Google implementada**
   - Arquivo: `src/pages/Auth.tsx` linhas 600-640
   - Provider configurado: `'google'`
   - redirectTo: `${window.location.origin}/auth`
   - Status: ✅ OK

3. **Callback OAuth detectado**
   - Código verifica tanto `#access_token` quanto `?code=`
   - Linhas 202-213 do Auth.tsx
   - Status: ✅ OK

4. **Supabase configurado**
   - Project ID: `kfetvofrwtuduwmpvdlz`
   - URL: `https://kfetvofrwtuduwmpvdlz.supabase.co`
   - Status: ✅ OK

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **REDIRECT URI INCORRETO NO GOOGLE CLOUD**

**Problema**: O Google está redirecionando para `feconecta-69w6.vercel.app`, mas essa URL pode não estar autorizada.

**URLs que DEVEM estar no Google Cloud Console**:
```
https://kfetvofrwtuduwmpvdlz.supabase.co/auth/v1/callback
https://feconecta-69w6.vercel.app
https://feconecta-69w6.vercel.app/auth
http://localhost:8080
http://localhost:8080/auth
```

**Como verificar**:
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no OAuth 2.0 Client ID do projeto
3. Verifique se TODAS as URLs acima estão em **"Authorized redirect URIs"**

---

### 2. **SITE URL INCORRETO NO SUPABASE**

**Problema**: O Supabase pode estar bloqueando redirects que não sejam para URLs autorizadas.

**Como corrigir**:

1. Acesse: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/auth/url-configuration

2. Configure:

**Site URL**:
```
https://feconecta-69w6.vercel.app
```

**Redirect URLs** (adicione TODAS):
```
https://feconecta-69w6.vercel.app/**
https://feconecta-69w6.vercel.app/auth
http://localhost:8080/**
http://localhost:8080/auth
```

**Important**: Marque "Enable Wildcard Matching"

---

### 3. **CONFIGURAÇÃO DO VERCEL**

**Problema**: O Vercel pode estar fazendo SPA routing incorreto para rotas com query parameters.

**Solução**: Criar arquivo `vercel.json` na raiz do projeto:

```json
{
  "routes": [
    {
      "src": "/auth(.*)",
      "dest": "/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

### 4. **PROVIDER GOOGLE NÃO ATIVADO NO SUPABASE**

**Como verificar**:

1. Acesse: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/auth/providers

2. Procure por **"Google"**

3. Verifique se o toggle está **ATIVADO** (verde)

4. Verifique se **Client ID** e **Client Secret** estão preenchidos

Se não estiverem:
- Siga o guia em `GOOGLE-AUTH-SETUP.md`
- Configure as credenciais do Google OAuth

---

## 🔧 PASSO A PASSO PARA CORRIGIR

### **PASSO 1: Corrigir Supabase (CRÍTICO)**

```bash
# 1. Acesse o Supabase Dashboard
https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/auth/url-configuration

# 2. Configure Site URL:
https://feconecta-69w6.vercel.app

# 3. Configure Redirect URLs (adicione TODAS):
https://feconecta-69w6.vercel.app/**
http://localhost:8080/**

# 4. Marque "Enable Wildcard Matching"

# 5. Clique em SAVE
```

---

### **PASSO 2: Corrigir Google Cloud Console (CRÍTICO)**

```bash
# 1. Acesse:
https://console.cloud.google.com/apis/credentials

# 2. Clique no OAuth Client ID

# 3. Em "Authorized redirect URIs", adicione:
https://kfetvofrwtuduwmpvdlz.supabase.co/auth/v1/callback
https://feconecta-69w6.vercel.app
https://feconecta-69w6.vercel.app/auth
http://localhost:8080
http://localhost:8080/auth

# 4. Clique em SAVE
```

---

### **PASSO 3: Criar vercel.json (RECOMENDADO)**

Criar arquivo `vercel.json` na raiz para garantir SPA routing:

```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

---

### **PASSO 4: Verificar Provider Google no Supabase**

```bash
# 1. Acesse:
https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/auth/providers

# 2. Encontre "Google"

# 3. Verifique se:
   - Toggle está ATIVADO ✅
   - Client ID está preenchido
   - Client Secret está preenchido

# 4. Se não estiver configurado:
   - Siga GOOGLE-AUTH-SETUP.md
```

---

## 🧪 COMO TESTAR DEPOIS DE CORRIGIR

### **Teste 1: Localhost**

```bash
# 1. Limpar cache do navegador
# 2. Iniciar servidor
npm run dev

# 3. Acessar
http://localhost:8080/auth

# 4. Clicar em "Entrar com Google"

# 5. Resultado esperado:
   - Redireciona para Google
   - Escolhe conta
   - Volta para o app
   - Redireciona para /feed (ou modal de país)
```

---

### **Teste 2: Produção (Vercel)**

```bash
# 1. Fazer deploy
git add .
git commit -m "fix: Corrige OAuth Google + vercel.json"
git push

# 2. Aguardar deploy no Vercel

# 3. Acessar
https://feconecta-69w6.vercel.app/auth

# 4. Clicar em "Entrar com Google"

# 5. Resultado esperado:
   - Redireciona para Google
   - Escolhe conta
   - Volta CORRETAMENTE para /auth
   - SEM 404!
   - Redireciona para /feed
```

---

## 📊 VERIFICAÇÕES NO CONSOLE DO NAVEGADOR

Abra DevTools (F12) e verifique:

### **Console (Tab Console):**

```javascript
// Deve aparecer:
[Auth] OAuth callback detectado: code
[Auth] Processando OAuth callback...
[Auth] Usuário autenticado via OAuth: email@gmail.com
[Auth] Redirecionando para /feed
```

### **Network (Tab Network):**

```
1. Requisição para Google OAuth
2. Redirect para: /auth?code=...
3. POST para Supabase /auth/v1/token
4. GET para /auth/v1/user
5. Redirect para /feed
```

---

## 🔍 POSSÍVEIS ERROS E SOLUÇÕES

### **Erro: "redirect_uri_mismatch"**

```
Causa: URL não autorizada no Google
Solução: Adicionar URL em Google Cloud Console → Credentials
```

### **Erro: "400 Bad Request"**

```
Causa: Site URL incorreto no Supabase
Solução: Configurar Site URL no Supabase
```

### **Erro: "404 Not Found"**

```
Causa: Vercel não está fazendo SPA routing
Solução: Criar vercel.json com rewrites
```

### **Erro: "Provider not enabled"**

```
Causa: Google provider desativado no Supabase
Solução: Ativar em Auth → Providers
```

---

## ✅ CHECKLIST DE CORREÇÃO

Marque conforme for corrigindo:

- [ ] Site URL configurado no Supabase
- [ ] Redirect URLs configuradas no Supabase (com wildcard)
- [ ] Authorized redirect URIs configuradas no Google Cloud
- [ ] Provider Google ativado no Supabase
- [ ] Client ID e Secret preenchidos no Supabase
- [ ] `vercel.json` criado na raiz do projeto
- [ ] Deploy feito no Vercel
- [ ] Testado em localhost
- [ ] Testado em produção
- [ ] Console não mostra erros
- [ ] Login com Google funcionando ✅

---

## 📝 RESUMO DO PROBLEMA

**Causa raiz**: 
O erro 404 acontece porque:

1. O Google redireciona para `feconecta-69w6.vercel.app/auth?code=...`
2. O Vercel não sabe que é uma SPA e busca `/auth` como arquivo físico
3. Como não existe arquivo físico `/auth`, retorna 404

**Solução**:
- Criar `vercel.json` para fazer SPA routing
- Garantir que redirect URLs estão autorizadas no Supabase e Google

---

## 🚀 PRÓXIMOS PASSOS

1. **IMEDIATO**: Corrigir URLs no Supabase (5 min)
2. **IMEDIATO**: Corrigir URLs no Google Cloud (5 min)
3. **IMEDIATO**: Criar vercel.json (1 min)
4. **Deploy**: Fazer push e aguardar deploy (3 min)
5. **Teste**: Testar login com Google (2 min)

**Tempo total estimado**: ~15 minutos

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Vercel SPA Configuration](https://vercel.com/docs/configuration#routes)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- Documento local: `GOOGLE-AUTH-SETUP.md`

---

**Desenvolvido com ❤️ para Rede da Fé** 🙏
