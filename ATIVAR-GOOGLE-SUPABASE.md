# 🔧 ATIVAR GOOGLE PROVIDER NO SUPABASE - PASSO A PASSO

## ⚠️ ERRO ATUAL:
```
"Unsupported provider: provider is not enabled"
```

Isso acontece porque o Google OAuth ainda não foi ativado no Supabase.

---

## 📋 SOLUÇÃO RÁPIDA (5 MINUTOS):

### **Passo 1: Google Cloud Console**

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto: **"RedeFe"**
3. No menu lateral: **APIs & Services** → **Library**
4. Pesquise: **"Google+ API"**
5. Clique em **Enable** (Ativar)

### **Passo 2: OAuth Consent Screen**

1. **APIs & Services** → **OAuth consent screen**
2. Escolha: **External**
3. Preencha:
   - App name: `Rede da Fé`
   - User support email: `seu-email@gmail.com`
   - Developer contact: `seu-email@gmail.com`
4. Clique: **Save and Continue**
5. Em **Scopes**: clique **Add or Remove Scopes**
6. Selecione:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
7. **Save and Continue**
8. **Save and Continue** novamente

### **Passo 3: Criar OAuth Client**

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Escolha: **Web application**
4. Preencha:

**Name:** `RedeFe Web Client`

**Authorized JavaScript origins:**
```
http://localhost:8080
https://kfetvofrwtuduwmpvdlz.supabase.co
```

**Authorized redirect URIs:**
```
https://kfetvofrwtuduwmpvdlz.supabase.co/auth/v1/callback
http://localhost:8080
```

5. Clique: **Create**
6. **COPIE**: 
   - Client ID (algo como: `123456789-xxx.apps.googleusercontent.com`)
   - Client Secret (algo como: `GOCSPX-xxxxxxxxxxxxx`)

### **Passo 4: Configurar no Supabase**

1. Acesse: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz
2. Menu lateral: **Authentication** → **Providers**
3. Procure: **Google**
4. Clique para expandir
5. **Ative** o toggle: "Enable Sign in with Google"
6. Cole:
   - **Client ID (for OAuth)**: Cole o Client ID
   - **Client Secret (for OAuth)**: Cole o Client Secret
7. Clique: **Save**

---

## ✅ VERIFICAR SE FUNCIONOU:

1. Acesse: http://localhost:8080/auth
2. Clique: "Entrar com Google"
3. Se abrir a tela do Google = **FUNCIONOU!** ✅
4. Se ainda der erro = verifique os passos acima

---

## 🔍 CHECKLIST:

- [ ] Google+ API ativada
- [ ] OAuth consent screen configurado
- [ ] OAuth Client ID criado
- [ ] Redirect URIs corretas
- [ ] Client ID e Secret copiados
- [ ] Google ativado no Supabase
- [ ] Credenciais coladas no Supabase
- [ ] Salvou as configurações
- [ ] Testou o login

---

**Faça isso PRIMEIRO antes de testar novamente!** 🚀
