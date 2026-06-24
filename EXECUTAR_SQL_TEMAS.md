# 🛠️ EXECUTAR SQL - SISTEMA DE TEMAS

**Erro**: Funções RPC não encontradas (400 Bad Request)

**Solução**: Executar o script SQL no Supabase

---

## 🎯 PASSO A PASSO

### **1. Acessar SQL Editor do Supabase**

👉 https://supabase.com/dashboard/project/kfetvofrwtuduwmpvdlz/sql/new

---

### **2. Copiar o SQL**

Abra o arquivo: `supabase/migrations/20260624_setup_themes_system.sql`

Ou copie diretamente daqui:

```sql
-- Ver arquivo: supabase/migrations/20260624_setup_themes_system.sql
```

---

### **3. Colar no Editor**

1. Cole TODO o conteúdo do arquivo SQL
2. Clique no botão **"RUN"** (canto inferior direito)
3. Aguarde a execução (~5 segundos)

---

### **4. Verificar Sucesso**

Você verá mensagens como:

```
✓ CREATE TABLE
✓ CREATE INDEX
✓ CREATE POLICY
✓ INSERT 10
✓ CREATE FUNCTION
✓ CREATE TRIGGER
```

---

## ✅ O QUE SERÁ CRIADO

### **Tabelas:**
- ✅ `themes` - Todos os temas disponíveis
- ✅ `user_themes` - Temas de cada usuário

### **Funções RPC:**
- ✅ `get_active_theme(p_user_id)` - Retorna tema ativo
- ✅ `get_available_themes(p_user_id)` - Lista temas
- ✅ `set_active_theme(p_user_id, p_theme_key)` - Ativa tema

### **Dados:**
- ✅ 10 temas inseridos automaticamente
- ✅ Tema "default" gratuito
- ✅ 9 temas premium

---

## 🧪 TESTAR DEPOIS

### **1. Verificar Tabelas**

```sql
-- Ver temas criados
SELECT theme_key, theme_name, rarity, tier
FROM public.themes
ORDER BY rarity DESC;
```

Deve retornar **10 temas**.

### **2. Testar Função GET**

```sql
-- Buscar temas disponíveis (substitua pelo seu user_id)
SELECT * FROM public.get_available_themes('6644c5e3-4886-4181-967f-b519cfed8538');
```

Deve retornar os 10 temas com `is_unlocked` e `is_active`.

### **3. Testar Função SET**

```sql
-- Ativar tema default (sempre permitido)
SELECT public.set_active_theme('6644c5e3-4886-4181-967f-b519cfed8538', 'default');
```

Deve retornar `true`.

---

## 🔓 DESBLOQUEAR TEMAS PREMIUM (ADMIN)

Para desbloquear um tema premium para um usuário:

```sql
-- Desbloquear Dark Royal Premium para você
INSERT INTO public.user_themes (user_id, theme_key, is_unlocked, unlocked_at)
VALUES (
  '6644c5e3-4886-4181-967f-b519cfed8538',
  'dark-royal',
  true,
  now()
)
ON CONFLICT (user_id, theme_key)
DO UPDATE SET is_unlocked = true, unlocked_at = now();
```

Substitua:
- `user_id`: ID do usuário
- `theme_key`: Chave do tema (ver lista abaixo)

### **Temas Disponíveis:**
```
default           - Padrão (sempre desbloqueado)
dark-royal        - Dark Royal Premium (Mítico)
reino-celestial   - Reino Celestial (Épico)
nova-jerusalem    - Nova Jerusalém (Lendário)
trono-gloria      - Trono da Glória (Lendário)
arca-alianca      - Arca da Aliança (Épico)
guerreiro-fe      - Guerreiro da Fé (Lendário)
monte-siao        - Monte Sião (Épico)
jardim-eden       - Jardim do Éden (Lendário)
diamante-promessa - Diamante da Promessa (Mítico)
```

---

## 🎨 DESBLOQUEAR TODOS OS TEMAS PARA VOCÊ

Se quiser testar todos os temas:

```sql
-- Desbloquear TODOS os temas para você
INSERT INTO public.user_themes (user_id, theme_key, is_unlocked, unlocked_at)
SELECT
  '6644c5e3-4886-4181-967f-b519cfed8538' as user_id,
  theme_key,
  true as is_unlocked,
  now() as unlocked_at
FROM public.themes
WHERE theme_key != 'default'
ON CONFLICT (user_id, theme_key)
DO UPDATE SET is_unlocked = true, unlocked_at = now();
```

---

## 🚨 TROUBLESHOOTING

### **Erro: "relation themes already exists"**
```sql
-- Apagar tudo e começar de novo
DROP TABLE IF EXISTS public.user_themes CASCADE;
DROP TABLE IF EXISTS public.themes CASCADE;
DROP FUNCTION IF EXISTS public.get_active_theme CASCADE;
DROP FUNCTION IF EXISTS public.get_available_themes CASCADE;
DROP FUNCTION IF EXISTS public.set_active_theme CASCADE;

-- Depois execute o script completo novamente
```

### **Erro: "permission denied"**
Você precisa estar logado como admin/owner do projeto Supabase.

### **Erro 400 ainda aparece**
1. Verifique se as funções foram criadas:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
     AND routine_name LIKE '%theme%';
   ```
   Deve retornar 3 funções.

2. Limpe o cache do navegador (Ctrl + Shift + Delete)
3. Recarregue a página (F5)

---

## ✅ RESULTADO ESPERADO

Depois de executar o SQL:

1. ✅ Erros 400 devem sumir
2. ✅ Modal abre sem erro
3. ✅ Temas aparecem com previews
4. ✅ Tema default está desbloqueado
5. ✅ Temas premium aparecem bloqueados
6. ✅ Ao clicar "Aplicar Tema" no default, funciona!

---

## 📋 CHECKLIST

- [ ] Acessei SQL Editor do Supabase
- [ ] Copiei o SQL completo
- [ ] Colei no editor
- [ ] Cliquei em RUN
- [ ] Vejo mensagens de sucesso
- [ ] Executei query de teste
- [ ] 10 temas retornados
- [ ] Desloquei todos os temas para mim (opcional)
- [ ] Limpei cache do navegador
- [ ] Recarreguei a página
- [ ] Abri a Central de Temas
- [ ] SEM ERROS! 🎉

---

**Execute o SQL e me avise quando terminar!** 🚀
