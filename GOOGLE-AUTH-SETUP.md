# 🔐 Configurar Login com Google no Supabase

## ✅ O QUE JÁ FOI FEITO NO CÓDIGO:

1. ✅ Adicionado botão "Entrar com Google" na tela de login
2. ✅ Adicionado botão "Cadastrar com Google" na tela de cadastro
3. ✅ Implementada função `handleGoogleSignIn()` com Supabase Auth
4. ✅ Instalado `react-icons` para ícone do Google
5. ✅ Suporte multilíngue (PT, ES, EN, NL)

---

## 📋 PASSOS PARA CONFIGURAR NO SUPABASE:

### **1. Acessar o Console do Google Cloud**

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Crie um novo projeto ou selecione um existente

---

### **2. Criar Credenciais OAuth 2.0**

#### **2.1. Ativar a Google+ API:**

1. No menu lateral, vá em: **APIs & Services** → **Library**
2. Pesquise por: **"Google+ API"**
3. Clique em **Enable** (Ativar)

#### **2.2. Configurar Tela de Consentimento OAuth:**

1. Vá em: **APIs & Services** → **OAuth consent screen**
2. Escolha: **External** (para qualquer usuário Google)
3. Clique em **Create**
4. Preencha:
   - **App name**: Rede da Fé
   - **User support email**: seu-email@gmail.com
   - **Developer contact**: seu-email@gmail.com
5. Clique em **Save and Continue**
6. Em **Scopes**, clique em **Add or Remove Scopes**
7. Adicione:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Clique em **Save and Continue**
9. Em **Test users**, adicione seu email (opcional para teste)
10. Clique em **Save and Continue**

#### **2.3. Criar Credenciais OAuth:**

1. Vá em: **APIs & Services** → **Credentials**
2. Clique em **+ Create Credentials** → **OAuth client ID**
3. Escolha: **Web application**
4. Preencha:
   - **Name**: Rede da Fé Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8080
     https://kfetvofrwtuduwmpvdlz.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     https://kfetvofrwtuduwmpvdlz.supabase.co/auth/v1/callback
     http://localhost:8080
     ```
5. Clique em **Create**
6. **COPIE** o **Client ID** e **Client Secret** que aparecerão

---

### **3. Configurar no Supabase**

1. Acesse o dashboard do Supabase: 
   👉 https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz

2. No menu lateral, vá em: **Authentication** → **Providers**

3. Procure por **Google** e clique para expandir

4. Ative o toggle: **Enable Sign in with Google**

5. Cole as credenciais:
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google

6. Em **Authorized Client IDs** (opcional), adicione o Client ID

7. Clique em **Save**

---

### **4. Atualizar URLs de Redirect (se necessário)**

Se você for usar um domínio customizado no futuro:

1. No Supabase: **Authentication** → **URL Configuration**
2. Adicione seu domínio em **Site URL**
3. Adicione em **Redirect URLs**

---

## 🧪 TESTAR O LOGIN

### **Testar em Localhost:**

1. Certifique-se de que o servidor está rodando:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:8080/auth

3. Clique em **"Entrar com Google"**

4. Você será redirecionado para o Google

5. Escolha uma conta Google

6. Autorize o acesso

7. Será redirecionado de volta para o app

8. O perfil será criado automaticamente no Supabase!

---

## 🔍 VERIFICAR SE FUNCIONOU:

### **No Supabase:**

1. Vá em: **Authentication** → **Users**
2. Você verá o usuário criado com:
   - Email da conta Google
   - Avatar da conta Google
   - Provider: `google`

### **No Banco de Dados:**

Execute no SQL Editor:

```sql
-- Ver usuários autenticados via Google
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as name,
  raw_user_meta_data->>'avatar_url' as avatar,
  created_at
FROM auth.users
WHERE raw_app_meta_data->>'provider' = 'google'
ORDER BY created_at DESC;

-- Ver perfis criados
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
```

---

## 🛠️ TROUBLESHOOTING

### **Erro: "redirect_uri_mismatch"**

**Causa**: A URL de redirect não está autorizada no Google Console.

**Solução**:
1. Vá no Google Cloud Console → **Credentials**
2. Edite o OAuth Client
3. Adicione em **Authorized redirect URIs**:
   ```
   https://kfetvofrwtuduwmpvdlz.supabase.co/auth/v1/callback
   ```

### **Erro: "Access blocked: This app's request is invalid"**

**Causa**: Tela de consentimento não configurada corretamente.

**Solução**:
1. Vá em **OAuth consent screen**
2. Publique o app ou adicione seu email em **Test users**

### **Usuário autenticado mas perfil não criado**

**Causa**: Trigger ou função não está criando o perfil automaticamente.

**Solução**: Criar trigger para criar perfil automaticamente:

```sql
-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'preferred_username',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'pt-BR')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função ao criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 📝 CHECKLIST FINAL

- [ ] Projeto criado no Google Cloud Console
- [ ] Google+ API ativada
- [ ] OAuth consent screen configurado
- [ ] OAuth Client ID criado
- [ ] Redirect URIs configuradas no Google
- [ ] Provider Google ativado no Supabase
- [ ] Client ID e Secret configurados no Supabase
- [ ] Trigger de criação de perfil criado no banco
- [ ] Testado login com Google
- [ ] Usuário aparece em Authentication → Users
- [ ] Perfil criado na tabela `profiles`

---

## 🎉 PRONTO!

Agora os usuários podem:
- ✅ Fazer login com email/senha (método tradicional)
- ✅ Fazer login com conta Google (OAuth)
- ✅ Cadastrar-se com conta Google
- ✅ Avatar e nome importados automaticamente do Google

---

## 📚 RECURSOS ÚTEIS

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Google Cloud Console**: https://console.cloud.google.com/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz

---

**Desenvolvido com ❤️ para Rede da Fé** 🙏
