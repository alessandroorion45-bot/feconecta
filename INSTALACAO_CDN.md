# 🚀 INSTALAÇÃO - CDN e Otimização de Mídia

## **📦 DEPENDÊNCIAS A INSTALAR:**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

---

## **🔧 SETUP - PASSO A PASSO:**

### **1️⃣ ImageKit.io (Imagens)**

**a) Criar conta:**
1. Acesse: https://imagekit.io/registration
2. Crie conta grátis (GitHub/Google)
3. Confirme email

**b) Pegar credenciais:**
1. Vá em: Dashboard → Developer Options
2. Copie:
   - **Public Key**
   - **URL Endpoint** (ex: https://ik.imagekit.io/seu_id)
   - **Private Key** (para backend)

**c) Adicionar no .env:**
```env
VITE_IMAGEKIT_PUBLIC_KEY=public_xxx
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/seu_id
VITE_IMAGEKIT_PRIVATE_KEY=private_xxx
```

**d) Testar:**
- Fazer upload de uma imagem
- Verificar se aparece no Dashboard do ImageKit
- URL deve ser: `https://ik.imagekit.io/seu_id/uploads/foto.jpg`

---

### **2️⃣ Cloudflare R2 (Vídeos e Áudios)**

**a) Criar conta Cloudflare:**
1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie conta grátis

**b) Ativar R2:**
1. No dashboard, vá em: **R2 Object Storage**
2. Clique em: **Purchase R2 Plan** → **Free** (10 GB grátis)

**c) Criar Bucket:**
1. Clique em: **Create Bucket**
2. Nome: `feconecta-media`
3. Localização: Automatic
4. Clique em: **Create Bucket**

**d) Criar API Token:**
1. Vá em: **R2** → **Manage R2 API Tokens**
2. Clique em: **Create API Token**
3. Nome: `feconecta-app`
4. Permissões: **Object Read & Write**
5. Aplique a: `feconecta-media` (bucket específico)
6. Clique em: **Create API Token**
7. **COPIE E SALVE** (só mostra 1 vez!):
   - Access Key ID
   - Secret Access Key
   - Account ID (no topo da página)

**e) Configurar Domínio Público (opcional mas recomendado):**
1. No bucket `feconecta-media`, vá em: **Settings**
2. Ative: **Public Access** (se quiser URLs públicas)
3. OU configure: **Custom Domain** (seu próprio domínio)
4. Copie a URL pública gerada

**f) Adicionar no .env:**
```env
VITE_R2_ACCOUNT_ID=seu_account_id
VITE_R2_ACCESS_KEY_ID=xxx
VITE_R2_SECRET_ACCESS_KEY=yyy
VITE_R2_BUCKET_NAME=feconecta-media
VITE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

**g) Testar:**
- Fazer upload de um vídeo pequeno
- Verificar se aparece no bucket
- Testar URL pública

---

## **⚙️ CONFIGURAÇÃO NA VERCEL:**

**Adicionar variáveis de ambiente:**

1. Vá em: https://vercel.com/seu-projeto/settings/environment-variables

2. Adicione TODAS as variáveis:
   ```
   VITE_IMAGEKIT_PUBLIC_KEY
   VITE_IMAGEKIT_URL_ENDPOINT
   VITE_IMAGEKIT_PRIVATE_KEY
   VITE_R2_ACCOUNT_ID
   VITE_R2_ACCESS_KEY_ID
   VITE_R2_SECRET_ACCESS_KEY
   VITE_R2_BUCKET_NAME
   VITE_R2_PUBLIC_URL
   ```

3. Ambiente: **Production, Preview, Development**

4. Clique em: **Save**

5. **Redeploy** o projeto

---

## **🧪 TESTAR A INTEGRAÇÃO:**

### **Teste 1: ImageKit**
```typescript
import { uploadToImageKit, getImageKitUrl } from '@/lib/imagekit';

// Upload
const result = await uploadToImageKit(imageFile, 'profile-photos');
console.log('URL:', result.url);

// URL otimizada
const optimized = getImageKitUrl('profile-photos/foto.jpg', {
  width: 400,
  quality: 80,
  format: 'auto'
});
```

### **Teste 2: Cloudflare R2**
```typescript
import { uploadToR2, getR2PublicUrl } from '@/lib/cloudflare-r2';

// Upload com progress
const videoUrl = await uploadToR2(videoFile, 'videos', (progress) => {
  console.log(`${progress.percentage}%`);
});

console.log('Vídeo disponível em:', videoUrl);
```

---

## **📊 ECONOMIA ESPERADA:**

### **ANTES (Supabase Storage):**
```
1 GB grátis → $0.021/GB adicional
100 GB = $2.08/mês
```

### **DEPOIS (ImageKit + R2):**
```
ImageKit: 20 GB grátis (imagens)
R2: 10 GB grátis (vídeos/áudios)
30 GB = $0.00/mês! 🎉

Acima de 30 GB:
- ImageKit: $0.40/GB bandwidth
- R2: $0.015/GB storage + DOWNLOAD GRÁTIS!
100 GB = ~$1.05/mês (50% mais barato!)
```

---

## **🔐 SEGURANÇA:**

**NUNCA commite o .env!**

Já está no .gitignore, mas verifique:
```bash
# Ver se .env está ignorado
git status

# Se aparecer .env, adicione ao .gitignore:
echo ".env" >> .gitignore
```

---

## **📝 PRÓXIMOS PASSOS:**

1. ✅ Instalar dependências (`npm install`)
2. ✅ Criar contas (ImageKit + Cloudflare)
3. ✅ Configurar .env local
4. ✅ Configurar variáveis na Vercel
5. ✅ Testar upload local
6. ✅ Fazer deploy
7. ✅ Testar em produção

---

**Me avise quando completar cada etapa!** 🚀
