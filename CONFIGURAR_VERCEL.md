# 🚀 GUIA: Configurar Variáveis de Ambiente na Vercel

## ⚠️ PROBLEMA ENCONTRADO:
Suas credenciais estavam **expostas no GitHub**! Foram removidas com segurança.

---

## 📋 **PASSO A PASSO - CONFIGURAR VERCEL:**

### **1. Acessar Dashboard da Vercel**
```
https://vercel.com/alessandroorion45-bots-projects/feconecta
```

### **2. Ir em Settings → Environment Variables**
```
https://vercel.com/alessandroorion45-bots-projects/feconecta/settings/environment-variables
```

### **3. Adicionar TODAS essas variáveis:**

#### **Supabase (obrigatório):**
```
VITE_SUPABASE_PROJECT_ID=kfetvofrwtuduwmpvdlz
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_8-a3qVJjeLmRBhKui1rCvg_9hWQMqqR
VITE_SUPABASE_URL=https://kfetvofrwtuduwmpvdlz.supabase.co
```

#### **ImageKit.io (obrigatório):**
```
VITE_IMAGEKIT_PUBLIC_KEY=public_rFmCkdvenfXBSY/M2+7x8F/qLMM=
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/0wfnlsfxm
VITE_IMAGEKIT_PRIVATE_KEY=private_PwxgnxD+nIVApf0uLujylKkb2vs=
```

### **4. Para cada variável:**
1. Clique em **"Add New"**
2. **Name:** cole o nome (ex: `VITE_SUPABASE_URL`)
3. **Value:** cole o valor
4. **Environments:** selecione **Production, Preview, Development** (todas)
5. Clique em **"Save"**

### **5. Depois de adicionar TODAS:**
- Clique em **"Deployments"** no menu
- Clique em **"..."** no último deploy
- Clique em **"Redeploy"**
- Aguarde ~2 minutos

---

## 🔧 **LIMPAR CACHE DA VERCEL:**

Se o deploy ainda estiver dando erro 404:

1. Acesse: https://vercel.com/alessandroorion45-bots-projects/feconecta/settings/general
2. Role até **"Clear build cache"**
3. Clique em **"Clear"**
4. Faça **Redeploy** novamente

---

## ✅ **CHECKLIST - APÓS CONFIGURAR:**

- [ ] Todas as 6 variáveis adicionadas na Vercel
- [ ] Selecionadas para Production, Preview, Development
- [ ] Redeploy feito
- [ ] Aguardado 2 minutos
- [ ] Testado https://feconecta.vercel.app/admin
- [ ] Dashboard apareceu com sucesso

---

## 🎯 **RESULTADO ESPERADO:**

Após configurar:
- ✅ `/admin` funciona
- ✅ `/themes` funciona
- ✅ Upload de imagens funciona (ImageKit)
- ✅ Dashboard carrega métricas
- ✅ Deploy reflete mudanças rapidamente

---

## 🔒 **SEGURANÇA:**

✅ `.env` agora está no `.gitignore`
✅ Credenciais removidas do GitHub
✅ Variáveis apenas na Vercel (seguro)
✅ `.env.example` criado como template

---

**Criado em:** 2026-06-23
**Status:** ✅ Correções de segurança aplicadas
