# ========================================
# SCRIPT AUTOMATICO - CONFIGURAR ADMIN ROLE
# ========================================
# Este script configura voce como SUPER_ADMIN no banco de dados
# Resolve o problema de 404 ao acessar /admin

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CONFIGURADOR DE ADMIN ROLE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se esta no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta do projeto (e:\feconecta)" -ForegroundColor Red
    pause
    exit 1
}

# Verificar se arquivo SQL existe
if (-not (Test-Path "configurar-admin-role.sql")) {
    Write-Host "ERRO: Arquivo configurar-admin-role.sql nao encontrado!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "PROBLEMA:" -ForegroundColor Yellow
Write-Host "  Ao acessar /admin, voce e redirecionado para /feed" -ForegroundColor Gray
Write-Host "  Isso acontece porque voce NAO esta na tabela user_roles como super_admin" -ForegroundColor Gray
Write-Host ""

Write-Host "SOLUCAO:" -ForegroundColor Green
Write-Host "  Este script vai executar um SQL que insere voce como SUPER_ADMIN" -ForegroundColor Gray
Write-Host "  Email: alessandroibama40@gmail.com" -ForegroundColor Gray
Write-Host ""

Write-Host "PASSO 1: Executar SQL no Supabase" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "OPCAO 1 - Via SQL Editor (RECOMENDADO):" -ForegroundColor Yellow
Write-Host "  1. Acesse: https://supabase.com/dashboard/project/_/sql/new" -ForegroundColor White
Write-Host "  2. Copie o conteudo de: configurar-admin-role.sql" -ForegroundColor White
Write-Host "  3. Cole no SQL Editor e clique em RUN" -ForegroundColor White
Write-Host ""
Write-Host "OPCAO 2 - Via Supabase CLI:" -ForegroundColor Yellow
Write-Host "  npx supabase db execute -f configurar-admin-role.sql" -ForegroundColor White
Write-Host ""

Write-Host "Pressione ENTER apos executar o SQL no Supabase..." -ForegroundColor Cyan
$null = Read-Host

Write-Host ""
Write-Host "PASSO 2: Testar acesso ao painel admin" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Agora teste acessando:" -ForegroundColor Yellow
Write-Host "  https://feconecta-69w6.vercel.app/admin" -ForegroundColor White
Write-Host ""
Write-Host "Se ainda redirecionar para /feed:" -ForegroundColor Yellow
Write-Host "  1. Faca CTRL+SHIFT+R para limpar cache do navegador" -ForegroundColor White
Write-Host "  2. Ou abra uma aba anonima" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

pause
