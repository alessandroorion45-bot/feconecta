@echo off
REM ═══════════════════════════════════════════════════════════
REM Script Automático de Deploy - Otimização de Imagens
REM Execute este arquivo clicando duas vezes nele!
REM ═══════════════════════════════════════════════════════════

echo.
echo ════════════════════════════════════════════════════════════
echo          🚀 DEPLOY AUTOMÁTICO - OTIMIZAÇÃO DE IMAGENS
echo ════════════════════════════════════════════════════════════
echo.
echo Este script vai:
echo   1. Fazer login no Supabase
echo   2. Linkar o projeto
echo   3. Deploy da Edge Function optimize-image
echo.
echo ════════════════════════════════════════════════════════════
echo.

pause

REM Mudar para o diretório correto
cd /d e:\feconecta

echo.
echo ════════════════════════════════════════════════════════════
echo [Passo 1/3] Login no Supabase...
echo ════════════════════════════════════════════════════════════
echo.
echo 📌 Uma janela do navegador vai abrir
echo 📌 Faça login com sua conta Supabase
echo 📌 Depois volte para cá
echo.

call npx supabase login

if errorlevel 1 (
    echo.
    echo ❌ Erro no login!
    echo.
    echo Possíveis soluções:
    echo   1. Verifique sua conexão com a internet
    echo   2. Certifique-se de que fez login no navegador
    echo   3. Tente executar manualmente: npx supabase login
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Login realizado com sucesso!
echo.
pause

echo.
echo ════════════════════════════════════════════════════════════
echo [Passo 2/3] Linkando o projeto...
echo ════════════════════════════════════════════════════════════
echo.
echo 📌 Selecione seu projeto da lista que vai aparecer
echo 📌 Se pedir senha do banco, digite
echo.

call npx supabase link

if errorlevel 1 (
    echo.
    echo ❌ Erro ao linkar projeto!
    echo.
    echo Possíveis soluções:
    echo   1. Selecione o projeto correto da lista
    echo   2. Digite a senha correta se pedir
    echo   3. Verifique se o projeto existe no Supabase
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Projeto linkado com sucesso!
echo.
pause

echo.
echo ════════════════════════════════════════════════════════════
echo [Passo 3/3] Deploy da Edge Function...
echo ════════════════════════════════════════════════════════════
echo.
echo 📌 Fazendo upload da função optimize-image...
echo 📌 Isso pode demorar alguns segundos...
echo.

call npx supabase functions deploy optimize-image

if errorlevel 1 (
    echo.
    echo ❌ Erro no deploy da função!
    echo.
    echo Possíveis soluções:
    echo   1. Verifique se o arquivo existe: supabase\functions\optimize-image\index.ts
    echo   2. Atualize o Supabase CLI: npm install -g supabase@latest
    echo   3. Tente novamente
    echo.
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════
echo           ✅ DEPLOY CONCLUÍDO COM SUCESSO! ✅
echo ════════════════════════════════════════════════════════════
echo.
echo 🎉 Tudo pronto! A otimização de imagens está ativa!
echo.
echo 📊 O que foi feito:
echo    ✅ Login no Supabase
echo    ✅ Projeto linkado
echo    ✅ Edge Function deployada
echo.
echo 🧪 Como testar:
echo    1. Acesse seu app (Vercel)
echo    2. Vá no seu perfil
echo    3. Clique em "Nova Foto"
echo    4. Faça upload de uma imagem
echo    5. Veja o toast: "Otimização: XX%% menor • WebP"
echo.
echo 🚀 Próximo passo (OPCIONAL):
echo    git push origin main
echo    (Para deployar o frontend na Vercel)
echo.
echo ════════════════════════════════════════════════════════════
echo.

pause

REM Abrir documentação
echo.
echo Deseja ver a documentação completa? (S/N)
set /p resposta=

if /i "%resposta%"=="S" (
    start README_OTIMIZACAO.md
)

echo.
echo ✅ Script finalizado!
echo.
pause
