# 🚀 CONFIGURADOR AUTOMÁTICO DA VERCEL

## ✨ O QUE FAZ:

Este script configura **AUTOMATICAMENTE** todas as variáveis de ambiente na Vercel!

✅ Instala Vercel CLI (se necessário)
✅ Faz login na Vercel
✅ Vincula o projeto
✅ Configura TODAS as 6 variáveis
✅ Faz redeploy (opcional)

**Tempo:** ~2 minutos (vs 10-15 minutos manual)

---

## 📋 COMO USAR:

### **Opção 1: Duplo-clique (MAIS FÁCIL)**

1. Vá até a pasta `e:\feconecta`
2. **Duplo-clique** em `configurar-vercel.bat`
3. Siga as instruções na tela
4. Quando pedir login, uma aba do navegador vai abrir
5. Faça login com sua conta Vercel
6. Volte ao terminal e aguarde
7. Quando perguntar se quer redeploy, digite `s` e Enter

**PRONTO! ✅**

---

### **Opção 2: Via PowerShell**

1. Abra PowerShell na pasta do projeto
2. Execute:
   ```powershell
   .\configurar-vercel.ps1
   ```
3. Siga as instruções

---

### **Opção 3: Via CMD/Terminal**

1. Abra CMD na pasta do projeto
2. Execute:
   ```cmd
   configurar-vercel.bat
   ```
3. Siga as instruções

---

## 🔧 O QUE O SCRIPT FAZ:

1. **Verifica Vercel CLI:**
   - Se não estiver instalado, instala automaticamente

2. **Login:**
   - Abre navegador para você fazer login na Vercel
   - Só precisa fazer 1 vez

3. **Vincula Projeto:**
   - Conecta sua pasta local com o projeto na Vercel

4. **Configura Variáveis:**
   - Lê o arquivo `.env`
   - Envia TODAS as variáveis para Vercel
   - Configura para Production, Preview e Development

5. **Redeploy (Opcional):**
   - Pergunta se quer fazer deploy
   - Se sim, faz deploy automático

---

## ⚠️ REQUISITOS:

- ✅ Node.js instalado (você já tem)
- ✅ npm instalado (você já tem)
- ✅ Arquivo `.env` na pasta do projeto
- ✅ Conta Vercel (você já tem)
- ✅ Internet (óbvio 😄)

---

## 🎯 RESULTADO ESPERADO:

Após executar:

```
✅ 6 variáveis configuradas com sucesso!
✅ DEPLOY COMPLETO!

🎯 Aguarde 1-2 minutos e acesse:
   https://feconecta.vercel.app/admin
```

---

## ❓ SOLUÇÃO DE PROBLEMAS:

### "Vercel CLI não instalado"
- O script instala automaticamente
- Se der erro, instale manualmente: `npm install -g vercel`

### "Não conseguiu fazer login"
- Verifique se o navegador abriu
- Faça login manualmente
- Tente novamente

### "Projeto não encontrado"
- Execute na pasta `e:\feconecta`
- Verifique se `package.json` existe

### "Erro ao adicionar variáveis"
- Verifique se `.env` existe
- Verifique se fez login
- Tente executar novamente

---

## 🔒 SEGURANÇA:

✅ Script lê `.env` local (NÃO do GitHub)
✅ Variáveis são enviadas direto para Vercel
✅ `.env` continua no `.gitignore`
✅ Nada é commitado

---

## 🎉 VANTAGENS:

| Manual | Automático |
|--------|------------|
| 10-15 minutos | 2 minutos |
| 6 variáveis uma por uma | Todas de uma vez |
| Copiar/colar cada valor | Script faz tudo |
| Risco de erro de digitação | Zero erros |
| Chato e repetitivo | Rápido e fácil |

---

**Criado em:** 2026-06-23
**Versão:** 1.0
**Status:** ✅ Pronto para usar

---

**DÚVIDAS?** Me chama no chat! 💬
