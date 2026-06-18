@echo off
echo ════════════════════════════════════════════════════════════
echo     🚀 CRIAR REPOSITÓRIO NO GITHUB
echo ════════════════════════════════════════════════════════════
echo.
echo PASSO 1: Criar repositório no GitHub
echo.
echo 1. Acesse: https://github.com/alessandroorion45-bot
echo.
echo 2. Clique no botão verde "New" (ou "+") no canto superior direito
echo.
echo 3. Preencha:
echo    - Repository name: feconecta
echo    - Description: Rede social cristã - Rede da Fé
echo    - Visibilidade: Public (ou Private se preferir)
echo    - NÃO marque "Add a README file"
echo    - NÃO marque "Add .gitignore"
echo    - NÃO marque "Choose a license"
echo.
echo 4. Clique em "Create repository"
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo     📤 FAZENDO PUSH PARA O GITHUB
echo ════════════════════════════════════════════════════════════
echo.

cd /d e:\feconecta

git remote remove origin 2>nul
git remote add origin https://github.com/alessandroorion45-bot/feconecta.git

echo Fazendo push...
echo.

git push -u origin master

if errorlevel 1 (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo ❌ ERRO NO PUSH
    echo ════════════════════════════════════════════════════════════
    echo.
    echo Possíveis causas:
    echo.
    echo 1. Você precisa fazer login no Git:
    echo    git config --global user.name "Seu Nome"
    echo    git config --global user.email "seu@email.com"
    echo.
    echo 2. Repositório não foi criado ainda
    echo    Acesse: https://github.com/alessandroorion45-bot
    echo.
    echo 3. Precisa de autenticação (token)
    echo    Gere um token em: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ SUCESSO! REPOSITÓRIO CRIADO E CÓDIGO ENVIADO!
echo ════════════════════════════════════════════════════════════
echo.
echo 🔗 Seu repositório:
echo    https://github.com/alessandroorion45-bot/feconecta
echo.
echo 🚀 Próximo passo: Conectar na Vercel
echo.
echo 1. Acesse: https://vercel.com/dashboard
echo 2. Clique em "Add New..." → "Project"
echo 3. Selecione o repositório: alessandroorion45-bot/feconecta
echo 4. Configure:
echo    - Framework Preset: Vite
echo    - Root Directory: ./
echo    - Build Command: npm run build
echo    - Output Directory: dist
echo 5. Adicione as variáveis de ambiente:
echo    VITE_SUPABASE_URL
echo    VITE_SUPABASE_PUBLISHABLE_KEY
echo 6. Clique em "Deploy"
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
