# 🚀 Deploy: Otimização de Imagens

**Data:** 2026-06-18  
**Status:** ✅ Implementado - Aguardando Deploy  
**Prioridade:** 🔴 CRÍTICA

---

## ✅ O que foi implementado

### 1. **Edge Function do Supabase**
📂 `supabase/functions/optimize-image/index.ts`

- ✅ Processa imagens com **Sharp** (biblioteca Node.js)
- ✅ Gera **3 versões** de cada imagem:
  - **Thumbnail**: 300x300px (fotos), 150x150px (avatares), 400x150px (capas)
  - **Medium**: 800x800px (fotos), 400x400px (avatares), 1200x400px (capas)
  - **Full**: 1920x1920px (fotos), 800x800px (avatares), 1920x600px (capas)
- ✅ Converte tudo para **WebP** (30-80% menor)
- ✅ Retorna estatísticas de compressão

### 2. **Migração do Banco de Dados**
📂 `supabase/migrations/20260618000001_add_image_optimization_fields.sql`

- ✅ Adiciona campos para URLs otimizadas:
  - `profile_photos`: `thumbnail_url`, `medium_url`, `compression_ratio`
  - `profiles`: `avatar_thumbnail_url`, `avatar_medium_url`, `cover_thumbnail_url`, `cover_medium_url`
  - `user_videos`: `thumbnail_medium_url`

### 3. **Biblioteca de Otimização**
📂 `src/lib/imageOptimization.ts`

- ✅ Função `optimizeImage()` - Chama Edge Function
- ✅ Função `getResponsiveImageUrl()` - Retorna URL ideal baseada no tamanho
- ✅ Função `getOptimalImageSize()` - Detecta tamanho da tela
- ✅ Tratamento de erros com fallback

### 4. **Componentes Atualizados**

#### ✅ ProfilePhotos.tsx
- Upload agora otimiza automaticamente
- Galeria usa `thumbnail_url` (grade)
- Timeline usa `medium_url`
- Modal usa `full_url`
- Toast mostra taxa de compressão

#### ✅ AvatarUpload.tsx
- Avatar cropado é otimizado antes do upload
- Gera 3 versões WebP
- Salva URLs no perfil

#### ✅ CoverImageUpload.tsx
- Capa recortada é otimizada
- Gera versões específicas para capa (16:9)
- Salva URLs otimizadas

---

## 🚀 Como fazer o Deploy

### **Passo 1: Aplicar Migração do Banco**

```bash
cd e:/feconecta

# Aplicar migração no Supabase
npx supabase db push
```

Ou manualmente no Supabase Dashboard:
1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/20260618000001_add_image_optimization_fields.sql`
4. Execute

### **Passo 2: Deploy da Edge Function**

```bash
# Login no Supabase (se ainda não estiver logado)
npx supabase login

# Link do projeto
npx supabase link --project-ref [SEU_PROJECT_REF]

# Deploy da função
npx supabase functions deploy optimize-image
```

**Importante:** A função usa **Sharp via npm** (Deno). Certifique-se de que o Supabase CLI está atualizado:

```bash
npx supabase@latest functions deploy optimize-image
```

### **Passo 3: Configurar Variáveis de Ambiente**

A Edge Function precisa de:
- `SUPABASE_URL` (automático)
- `SUPABASE_SERVICE_ROLE_KEY` (automático)

Elas já são injetadas automaticamente pelo Supabase nas Edge Functions.

### **Passo 4: Testar a Função**

```bash
# Testar localmente (opcional)
npx supabase functions serve optimize-image

# Em outro terminal, teste:
curl -i --location --request POST 'http://localhost:54321/functions/v1/optimize-image' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "file": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "fileName": "test.jpg",
    "userId": "test-user-id",
    "type": "photo"
  }'
```

### **Passo 5: Deploy do Frontend (Vercel)**

```bash
# Commit das mudanças
git add .
git commit -m "feat: Otimização automática de imagens com WebP

- Edge Function com Sharp para processamento
- Gera 3 versões (thumb, medium, full)
- Converte para WebP (30-80% menor)
- Atualiza ProfilePhotos, Avatar e Cover
- Migração do banco adicionada

Redução estimada: 90-95% no tamanho total"

# Push para deploy automático na Vercel
git push origin main
```

---

## 🔍 Como Testar

### **1. Testar Upload de Foto de Perfil**

1. Acesse seu perfil
2. Clique em "Nova Foto"
3. Faça upload de uma imagem
4. ✅ Deve aparecer: "Otimizando imagem... 🔄"
5. ✅ Depois: "Foto publicada! 📸✨ • Otimização: XX% menor • WebP"

### **2. Verificar URLs Otimizadas**

Abra o console do navegador e execute:

```javascript
// Ver foto recém-enviada
const photos = await supabase
  .from('profile_photos')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1);

console.log(photos.data[0]);
// Deve ter: photo_url, thumbnail_url, medium_url, compression_ratio
```

### **3. Verificar Carregamento Responsivo**

- **Mobile**: Deve carregar `thumbnail_url` (pequeno)
- **Tablet**: Deve carregar `medium_url` (médio)
- **Desktop**: Deve carregar `full_url` ou `photo_url` (grande)

Inspecione a rede do navegador (F12 → Network → Img) e veja qual URL está sendo carregada.

### **4. Verificar Formato WebP**

No DevTools:
- F12 → Network → Img
- Clique em uma imagem carregada
- Headers → Content-Type: deve ser `image/webp`

---

## 📊 Resultados Esperados

### **Antes:**
- 1 foto de perfil: ~3.5 MB
- Galeria 20 fotos: ~70 MB
- Tempo de carregamento: ~10s (4G)

### **Depois:**
- 1 foto de perfil: ~200 KB (94% menor)
- Galeria 20 fotos: ~2 MB (97% menor)
- Tempo de carregamento: ~1s (4G)

---

## ⚠️ Possíveis Problemas e Soluções

### **Problema 1: Edge Function não encontra Sharp**

**Erro:**
```
Cannot find package 'sharp'
```

**Solução:**
```bash
# Atualizar Supabase CLI
npm install -g supabase@latest

# Re-deploy
npx supabase functions deploy optimize-image
```

### **Problema 2: Timeout na Edge Function**

**Erro:**
```
Function timeout after 10s
```

**Causa:** Imagem muito grande (>10MB)

**Solução:** Aumentar validação de tamanho no frontend:

```typescript
// src/lib/imageOptimization.ts (já implementado)
if (file.size > 10 * 1024 * 1024) {
  throw new Error('Imagem muito grande. Máximo: 10MB');
}
```

### **Problema 3: CORS Error**

**Erro:**
```
Access to fetch blocked by CORS policy
```

**Solução:** Adicionar headers CORS na Edge Function (já implementado):

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### **Problema 4: Imagens antigas não otimizadas**

**Solução:** Script de migração (criar depois):

```typescript
// migrate-existing-images.ts
// TODO: Criar script para otimizar imagens existentes
```

---

## 🎯 Checklist de Deploy

- [ ] **Migração aplicada no banco**
  ```bash
  npx supabase db push
  ```

- [ ] **Edge Function deployada**
  ```bash
  npx supabase functions deploy optimize-image
  ```

- [ ] **Frontend deployado na Vercel**
  ```bash
  git push origin main
  ```

- [ ] **Testar upload de foto**
  - Abrir perfil
  - Upload nova foto
  - Verificar toast de otimização

- [ ] **Verificar URLs no banco**
  - Conferir `thumbnail_url`, `medium_url`
  - Verificar `compression_ratio`

- [ ] **Testar em diferentes telas**
  - Mobile (thumbnail)
  - Tablet (medium)
  - Desktop (full)

- [ ] **Monitorar logs do Supabase**
  - Dashboard → Functions → optimize-image → Logs
  - Verificar erros

- [ ] **Verificar storage**
  - Dashboard → Storage → photos
  - Confirmar versões WebP sendo criadas

---

## 📈 Monitoramento Pós-Deploy

### **1. Métricas de Sucesso**

Acompanhar no Supabase Dashboard:

| Métrica | Onde Ver | Meta |
|---------|----------|------|
| Taxa de conversão WebP | Storage → photos | 100% |
| Tamanho médio de arquivo | Storage Analytics | <200KB |
| Taxa de compressão média | Query no banco | >80% |
| Tempo de execução da função | Functions → Logs | <3s |

### **2. Query para Estatísticas**

```sql
-- Ver estatísticas de compressão
SELECT 
  AVG(compression_ratio) as avg_compression,
  COUNT(*) as total_photos,
  SUM(original_size) / 1024 / 1024 as original_mb,
  SUM(optimized_size) / 1024 / 1024 as optimized_mb
FROM profile_photos
WHERE compression_ratio IS NOT NULL;
```

### **3. Alertas**

Configurar no Supabase:
- ⚠️ Taxa de erro da função > 5%
- ⚠️ Tempo de execução > 5s
- ⚠️ Storage crescendo > 1GB/dia

---

## 🔄 Próximos Passos (Futuro)

### **Fase 2: Migração de Imagens Antigas**
- [ ] Script para otimizar fotos existentes
- [ ] Migração em lote (100 por vez)
- [ ] Limpar versões antigas

### **Fase 3: Melhorias Adicionais**
- [ ] Suporte a AVIF (ainda mais leve que WebP)
- [ ] Lazy loading mais agressivo
- [ ] Progressive loading (blur-up)
- [ ] CDN Cloudflare para cache

### **Fase 4: Analytics**
- [ ] Dashboard de economia de banda
- [ ] Relatório mensal de performance
- [ ] Comparação antes/depois

---

## 💡 Dicas

1. **Sempre teste localmente primeiro:**
   ```bash
   npx supabase functions serve optimize-image
   ```

2. **Monitore os logs da função:**
   ```bash
   npx supabase functions logs optimize-image
   ```

3. **Se algo der errado, rollback:**
   ```sql
   -- Reverter migração (se necessário)
   ALTER TABLE profile_photos DROP COLUMN thumbnail_url;
   ALTER TABLE profile_photos DROP COLUMN medium_url;
   -- ... etc
   ```

4. **Backup antes de migrar:**
   ```bash
   npx supabase db dump -f backup.sql
   ```

---

## 📞 Suporte

- **Documentação Sharp:** https://sharp.pixelplumbing.com/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Documentação WebP:** https://developers.google.com/speed/webp

---

**Pronto para deploy? 🚀**

Execute os comandos do checklist acima e acompanhe os logs!
