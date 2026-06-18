#!/bin/bash

# 🚀 Script de Deploy - Otimização de Imagens
# Data: 2026-06-18
# Descrição: Deploy completo do sistema de otimização

set -e  # Para se houver erro

echo "🚀 Iniciando deploy de otimização de imagens..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Passo 1: Verificar se está no diretório correto
echo -e "${YELLOW}Passo 1: Verificando diretório...${NC}"
if [ ! -d "supabase" ]; then
    echo -e "${RED}❌ Erro: Diretório supabase/ não encontrado${NC}"
    echo "Execute este script na raiz do projeto (e:/feconecta)"
    exit 1
fi
echo -e "${GREEN}✅ Diretório OK${NC}"
echo ""

# Passo 2: Aplicar migração do banco
echo -e "${YELLOW}Passo 2: Aplicando migração do banco de dados...${NC}"
echo "Executando: npx supabase db push"
npx supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migração aplicada com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar migração${NC}"
    exit 1
fi
echo ""

# Passo 3: Deploy da Edge Function
echo -e "${YELLOW}Passo 3: Fazendo deploy da Edge Function...${NC}"
echo "Executando: npx supabase functions deploy optimize-image"
npx supabase functions deploy optimize-image

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Edge Function deployada com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao deployar Edge Function${NC}"
    exit 1
fi
echo ""

# Passo 4: Verificar status
echo -e "${YELLOW}Passo 4: Verificando status...${NC}"
npx supabase functions list
echo ""

# Passo 5: Teste rápido (opcional)
echo -e "${YELLOW}Deseja testar a função agora? (s/n)${NC}"
read -r resposta

if [ "$resposta" = "s" ] || [ "$resposta" = "S" ]; then
    echo "Iniciando função local para teste..."
    echo "Executando: npx supabase functions serve optimize-image"
    echo ""
    echo -e "${GREEN}A função está rodando em: http://localhost:54321/functions/v1/optimize-image${NC}"
    echo "Pressione Ctrl+C para parar"
    npx supabase functions serve optimize-image
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Próximos passos:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Migração aplicada"
echo "2. ✅ Edge Function deployada"
echo ""
echo "3. 🔄 Deploy do frontend na Vercel:"
echo "   git push origin main"
echo ""
echo "4. 🧪 Teste manual:"
echo "   - Acesse seu perfil"
echo "   - Faça upload de uma foto"
echo "   - Verifique o toast: 'Otimização: XX% menor • WebP'"
echo ""
echo "5. 📊 Monitorar logs:"
echo "   - Supabase Dashboard → Functions → optimize-image → Logs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Sistema de otimização pronto!${NC}"
echo ""
