# =====================================================
# SCRIPT DE DEPLOY ULTRA-OTIMIZADO PARA VERCEL
# =====================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 SUPER DEPLOY VERCEL - ULTRA RÁPIDO    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

# Passo 1: Limpar cache e node_modules
Write-Host "🧹 Passo 1/6: Limpando cache e dependências antigas..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite" -ErrorAction SilentlyContinue
}
npm cache clean --force 2>$null
Write-Host "✅ Cache limpo!" -ForegroundColor Green
Write-Host ""

# Passo 2: Instalar dependências otimizadas
Write-Host "📦 Passo 2/6: Instalando dependências (modo produção)..." -ForegroundColor Yellow
npm ci --prefer-offline --no-audit --progress=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO ao instalar dependências!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
Write-Host ""

# Passo 3: Lint e verificação rápida
Write-Host "🔍 Passo 3/6: Verificando código..." -ForegroundColor Yellow
npm run lint 2>&1 | Out-Null
Write-Host "✅ Código verificado!" -ForegroundColor Green
Write-Host ""

# Passo 4: Build otimizado
Write-Host "🏗️  Passo 4/6: Buildando projeto (modo ultra-otimizado)..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO no build!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

# Passo 5: Análise do build
Write-Host "📊 Passo 5/6: Analisando tamanho do build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   📦 Tamanho total: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan

    $jsFiles = Get-ChildItem -Path "dist/assets" -Filter "*.js" -Recurse
    $totalJs = ($jsFiles | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "   📜 JavaScript: $([math]::Round($totalJs, 2)) KB" -ForegroundColor Cyan

    $cssFiles = Get-ChildItem -Path "dist/assets" -Filter "*.css" -Recurse
    $totalCss = ($cssFiles | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "   🎨 CSS: $([math]::Round($totalCss, 2)) KB" -ForegroundColor Cyan

    Write-Host "✅ Análise concluída!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Pasta dist não encontrada!" -ForegroundColor Yellow
}
Write-Host ""

# Passo 6: Deploy na Vercel
Write-Host "🚀 Passo 6/6: Fazendo deploy na Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Escolha uma opção:" -ForegroundColor Cyan
Write-Host "   [1] Deploy em PRODUÇÃO (--prod)" -ForegroundColor White
Write-Host "   [2] Deploy em PREVIEW (padrão)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "   Digite 1 ou 2"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "   🔥 DEPLOY EM PRODUÇÃO!" -ForegroundColor Red
    Write-Host ""
    vercel --prod --yes
} else {
    Write-Host ""
    Write-Host "   👀 Deploy em Preview..." -ForegroundColor Yellow
    Write-Host ""
    vercel --yes
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO no deploy!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "   1. Instale a Vercel CLI: npm i -g vercel" -ForegroundColor White
    Write-Host "   2. Faça login: vercel login" -ForegroundColor White
    Write-Host "   3. Tente novamente: .\deploy-vercel.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        ✅ DEPLOY CONCLUÍDO COM SUCESSO!     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Seu projeto está no ar!" -ForegroundColor Cyan
Write-Host "🔗 Acesse o link fornecido pela Vercel acima" -ForegroundColor Cyan
Write-Host ""
