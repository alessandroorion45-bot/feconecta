@echo off
REM 🚀 Script de Deploy - Otimização de Imagens (Windows)
REM Data: 2026-06-18
REM Descrição: Deploy completo do sistema de otimização

echo.
echo ========================================
echo 🚀 Deploy de Otimização de Imagens
echo ========================================
echo.

REM Passo 1: Verificar diretório
echo [Passo 1] Verificando diretório...
if not exist "supabase\" (
    echo ❌ Erro: Diretório supabase\ não encontrado
    echo Execute este script na raiz do projeto (e:\feconecta^)
    pause
    exit /b 1
)
echo ✅ Diretório OK
echo.

REM Passo 2: Migração do banco
echo [Passo 2] Aplicando migração do banco de dados...
echo Executando: npx supabase db push
call npx supabase db push

if errorlevel 1 (
    echo ❌ Erro ao aplicar migração
    pause
    exit /b 1
)
echo ✅ Migração aplicada com sucesso
echo.

REM Passo 3: Deploy da Edge Function
echo [Passo 3] Fazendo deploy da Edge Function...
echo Executando: npx supabase functions deploy optimize-image
call npx supabase functions deploy optimize-image

if errorlevel 1 (
    echo ❌ Erro ao deployar Edge Function
    pause
    exit /b 1
)
echo ✅ Edge Function deployada com sucesso
echo.

REM Passo 4: Verificar status
echo [Passo 4] Verificando status...
call npx supabase functions list
echo.

REM Passo 5: Mensagem de sucesso
echo.
echo ========================================
echo ✅ Deploy concluído com sucesso!
echo ========================================
echo.
echo 📊 Próximos passos:
echo.
echo 1. ✅ Migração aplicada
echo 2. ✅ Edge Function deployada
echo.
echo 3. 🔄 Deploy do frontend na Vercel:
echo    git push origin main
echo.
echo 4. 🧪 Teste manual:
echo    - Acesse seu perfil
echo    - Faça upload de uma foto
echo    - Verifique o toast: "Otimização: XX%% menor • WebP"
echo.
echo 5. 📊 Monitorar logs:
echo    - Supabase Dashboard → Functions → optimize-image → Logs
echo.
echo ========================================
echo 🎉 Sistema de otimização pronto!
echo ========================================
echo.

pause
