# 🧹 LIMPAR CACHE DA BÍBLIA

## PASSO A PASSO:

1. **Abra o DevTools** (pressione F12)

2. **Vá em Application**
   - Clique na aba "Application" no topo

3. **Local Storage**
   - No menu esquerdo, expanda "Local Storage"
   - Clique em `http://localhost:8080`

4. **Delete o cache da Bíblia**
   - Procure a chave: `bible_cache_v2`
   - Clique com botão direito → **Delete**

5. **Recarregue a página** (F5)

6. **Abra o Console** (F12 → Console)

7. **Copie TODOS os logs** que aparecem e me envie!

---

**O que deve aparecer:**

```
🔄 Iniciando carregamento da Bíblia...
🌐 Buscando Bíblia do Supabase...
✅ 66 livros carregados. Buscando versículos...
📖 Total de versículos carregados: 31106
🔢 Primeiros 5 versículos normalizados: [...]
🔢 Amostra de Levítico (book_id 270): [...]
📦 Total de livros no mapa: 66
📦 IDs dos livros no mapa: [268, 269, 270, ...]
🔎 [0] Livro: Gênesis
🔎 [1] Livro: Êxodo
🔎 [2] Livro: Levítico  <-- ESTE DEVE TER VERSÍCULOS!
...
```

**ME MOSTRE O CONSOLE!** 🔍
