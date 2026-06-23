# ========================================
# SCRIPT AUTOMÁTICO - CONFIGURAR VERCEL
# ========================================
# Este script configura automaticamente todas as variáveis de ambiente na Vercel
# Basta executar e pronto!

Write-Host "🚀 CONFIGURADOR AUTOMÁTICO DA VERCEL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script na pasta do projeto (e:\feconecta)" -ForegroundColor Red
    pause
    exit 1
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERRO: Arquivo .env não encontrado!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "📋 Verificando Vercel CLI..." -ForegroundColor Yellow

# Verificar se Vercel CLI está instalado
$vercelInstalled = $null
try {
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
} catch {}

if (-not $vercelInstalled) {
    Write-Host "📦 Vercel CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI instalado!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI já instalado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Fazendo login na Vercel..." -ForegroundColor Yellow
Write-Host "   (Uma aba do navegador vai abrir para você fazer login)" -ForegroundColor Gray
Write-Host ""

# Fazer login (abre navegador)
vercel login

Write-Host ""
Write-Host "📂 Vinculando projeto..." -ForegroundColor Yellow
vercel link --yes

Write-Host ""
Write-Host "⚙️  Configurando variáveis de ambiente..." -ForegroundColor Yellow
Write-Host ""

# Ler variáveis do .env
$envContent = Get-Content ".env"
$varsConfigured = 0

foreach ($line in $envContent) {
    # Pular linhas vazias e comentários
    if ($line -match '^\s*#' -or $line -match '^\s*$') {
        continue
    }

    # Extrair nome e valor
    if ($line -match '^([^=]+)=(.+)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')

        Write-Host "   Configurando: $name" -ForegroundColor Cyan

        # Adicionar variável para Production, Preview e Development
        vercel env add $name production --force 2>$null <<< $value
        vercel env add $name preview --force 2>$null <<< $value
        vercel env add $name development --force 2>$null <<< $value

        $varsConfigured++
    }
}

Write-Host ""
Write-Host "✅ $varsConfigured variáveis configuradas com sucesso!" -ForegroundColor Green
Write-Host ""

# Perguntar se quer fazer redeploy
Write-Host "🚀 Deseja fazer REDEPLOY agora? (s/n): " -ForegroundColor Yellow -NoNewline
$redeploy = Read-Host

if ($redeploy -eq 's' -or $redeploy -eq 'S' -or $redeploy -eq 'sim') {
    Write-Host ""
    Write-Host "🚀 Iniciando redeploy..." -ForegroundColor Yellow
    vercel --prod

    Write-Host ""
    Write-Host "✅ DEPLOY COMPLETO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Aguarde 1-2 minutos e acesse:" -ForegroundColor Cyan
    Write-Host "   https://feconecta.vercel.app/admin" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Variáveis configuradas, mas deploy não foi feito." -ForegroundColor Yellow
    Write-Host "   Para fazer deploy depois, execute: vercel --prod" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

pause
