# 🔍 AUDITORIA DE PERFORMANCE - Chrome Lento

**Data:** 17/06/2026  
**Problema:** Chrome muito lento, travando, problemas de performance

---

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **BUNDLE GIGANTE** 🔥 CRÍTICO
```
index-pngiBWLK.js: 515 KB (128 KB Brotli)
react-vendor: 202 KB (55 KB Brotli)
supabase-vendor: 172 KB (35 KB Brotli)
TOTAL: ~890 KB (~218 KB comprimido)
```

**Impacto:**
- ❌ Carregamento inicial: **3-5 segundos** em 4G
- ❌ Parsing/execução JS: **2-3 segundos**
- ❌ Total: **5-8 segundos** até interativo
- ❌ Chrome precisa processar **quase 1 MB de JavaScript**

### 2. **MUITOS useEffect/useState** ⚠️ ALTO
```
Total: 813 ocorrências em 113 arquivos
Média: ~7 por arquivo
```

**Impacto:**
- Re-renders excessivos
- Memória alta
- CPU constantemente ocupada

### 3. **214 ARQUIVOS TypeScript** ⚠️ MÉDIO
```
214 arquivos .ts/.tsx
```

**Impacto:**
- Bundle grande
- Muitos componentes carregados

### 4. **MUITAS DEPENDÊNCIAS** ⚠️ MÉDIO
```
- 25+ bibliotecas @radix-ui (UI components)
- framer-motion (animações pesadas)
- mapbox-gl (mapas - 500KB sozinho!)
- recharts (gráficos)
- react-image-crop
- embla-carousel
```

**Impacto:**
- Cada lib adiciona 10-50 KB
- Total: ~400 KB só de libs

---

## 📊 ANÁLISE DETALHADA

### Arquivos Mais Pesados (Brotli):

| Arquivo | Tamanho | Comprimido | Problema |
|---------|---------|------------|----------|
| **index.js** | 515 KB | 128 KB | ❌ BUNDLE PRINCIPAL GIGANTE |
| react-vendor | 202 KB | 55 KB | ⚠️ React grande |
| supabase-vendor | 172 KB | 35 KB | ✅ OK |
| ChurchCommunity | 91 KB | 19 KB | ⚠️ Componente pesado |
| ProfilePhotos | 77 KB | 14 KB | ⚠️ Muitas imagens? |
| SharedReading | 50 KB | 11 KB | ⚠️ Lógica complexa |
| Prayers | 49 KB | 11 KB | ⚠️ Muita lógica |
| Profile | 46 KB | 10 KB | ⚠️ Componente grande |

### Componentes Problemáticos:

1. **ChurchCommunity** (91 KB)
   - Muita lógica inline
   - Muitos subcomponentes
   - Mapbox integrado

2. **ProfilePhotos** (77 KB)
   - Upload de múltiplas fotos
   - Crop de imagens
   - Lightbox

3. **SharedReading** (50 KB)
   - WebSocket/realtime
   - Sincronização complexa

---

## 🎯 SOLUÇÕES PRIORITÁRIAS

### 🔥 URGENTE - Reduzir Bundle Principal

#### 1. **Lazy Load Componentes Pesados**
```typescript
// ANTES (carrega tudo)
import ChurchCommunity from './pages/ChurchCommunity'

// DEPOIS (carrega sob demanda)
const ChurchCommunity = lazy(() => import('./pages/ChurchCommunity'))
```

✅ **JÁ APLICADO** em App.tsx, mas alguns componentes ainda importam direto

#### 2. **Tree Shaking de Bibliotecas**
```typescript
// ANTES (importa tudo)
import * as Icons from 'lucide-react'

// DEPOIS (importa só o necessário)
import { Home, User } from 'lucide-react'
```

#### 3. **Remover Mapbox (500 KB!)**
```typescript
// Opção 1: Lazy load só quando necessário
const MapboxComponent = lazy(() => import('./MapboxWrapper'))

// Opção 2: Usar Google Maps Embed (sem JS)
<iframe src="https://www.google.com/maps/embed?..." />

// Opção 3: Usar Leaflet (mais leve)
import 'leaflet' // ~150 KB vs 500 KB
```

#### 4. **Code Splitting Mais Agressivo**
```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'supabase-vendor': ['@supabase/supabase-js'],
  'ui-heavy': ['framer-motion', 'react-image-crop', 'recharts'], // Novo!
  'maps': ['mapbox-gl'], // Novo! Separar mapas
}
```

---

### ⚠️ IMPORTANTE - Otimizar Re-renders

#### 1. **React.memo em Componentes Pesados**
```typescript
// ChurchCommunity, ProfilePhotos, SharedReading
export default React.memo(ChurchCommunity)
```

#### 2. **useMemo/useCallback para Funções Pesadas**
```typescript
const expensiveCalculation = useMemo(() => {
  return heavyComputation(data)
}, [data])

const handleClick = useCallback(() => {
  doSomething()
}, [])
```

#### 3. **Virtualização de Listas Longas**
```typescript
// Para listas com 100+ itens
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

### 📱 BOM TER - Otimizações Extras

#### 1. **Imagens Lazy Loading**
✅ **JÁ APLICADO** - OptimizedImage.tsx

#### 2. **Service Worker para Cache**
✅ **JÁ TEM** - sw.js

#### 3. **Preload de Recursos Críticos**
```html
<link rel="preload" href="/assets/react-vendor.js" as="script">
```

---

## 🚀 PLANO DE AÇÃO

### Fase 1 - URGENTE (Reduzir 50% do bundle)
1. ✅ Remover ou lazy load Mapbox
2. ✅ Code splitting para framer-motion, recharts
3. ✅ Tree shaking de lucide-react
4. ✅ Remover dependências não usadas

**Meta:** Bundle de 515 KB → 250 KB

### Fase 2 - IMPORTANTE (Otimizar re-renders)
1. React.memo nos 10 componentes mais pesados
2. useMemo/useCallback em loops
3. Virtualização de listas

**Meta:** Reduzir uso de CPU em 40%

### Fase 3 - BOM TER (Polish)
1. Preload de recursos
2. HTTP/2 Server Push
3. WebP para imagens

**Meta:** Lighthouse 95+

---

## 📈 MÉTRICAS ESPERADAS

### ANTES (Atual):
- **Bundle:** 890 KB (218 KB comprimido)
- **Tempo até interativo:** 5-8s (4G)
- **First Contentful Paint:** 2-3s
- **Lighthouse Score:** ~70

### DEPOIS (Meta):
- **Bundle:** 450 KB (110 KB comprimido)
- **Tempo até interativo:** 2-3s (4G)
- **First Contentful Paint:** 0.8-1.2s
- **Lighthouse Score:** 90+

**Melhoria esperada:** **~60% mais rápido** ⚡

---

## 🔧 FERRAMENTAS PARA MEDIR

### 1. Chrome DevTools
```
F12 → Performance → Record → Reload
```
Veja:
- Scripting time (quanto tempo processando JS)
- Rendering time
- Memory usage

### 2. Lighthouse
```
F12 → Lighthouse → Generate Report
```
Veja:
- Performance score
- First Contentful Paint
- Time to Interactive

### 3. Bundle Analyzer
```bash
npm install -D rollup-plugin-visualizer
```

Adicionar em vite.config.ts:
```typescript
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer({ open: true })
]
```

---

## ✅ PRÓXIMOS PASSOS

1. **Implementar Fase 1** (remover Mapbox, code splitting)
2. **Testar no Chrome** (DevTools Performance)
3. **Medir melhoria** (Lighthouse antes/depois)
4. **Implementar Fase 2** se necessário

---

**Conclusão:** O Chrome está lento porque o bundle é **GIGANTE** (890 KB). Precisa remover peso urgentemente!
