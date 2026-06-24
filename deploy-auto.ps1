# =====================================================
# DEPLOY AUTOMÁTICO - Git + Build + Vercel
# =====================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  🚀 DEPLOY AUTOMÁTICO ULTRA-RÁPIDO VERCEL    ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Commit message
$commitMsg = Read-Host "📝 Digite a mensagem do commit"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "feat: Admin panel com dados reais + otimizações Vercel"
}

Write-Host ""
Write-Host "🔄 Iniciando deploy automatizado..." -ForegroundColor Cyan
Write-Host ""

# Passo 1: Git Status
Write-Host "📊 Passo 1/7: Verificando mudanças..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Passo 2: Git Add
Write-Host "➕ Passo 2/7: Adicionando arquivos..." -ForegroundColor Yellow
git add .
Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""

# Passo 3: Git Commit
Write-Host "💾 Passo 3/7: Criando commit..." -ForegroundColor Yellow
git commit -m "$commitMsg" -m "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit criado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nada para commitar ou erro" -ForegroundColor Yellow
}
Write-Host ""

# Passo 4: Git Push
Write-Host "🔼 Passo 4/7: Enviando para GitHub..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO ao fazer push!" -ForegroundColor Red
    Write-Host "💡 Tente: git pull --rebase && git push" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Push concluído!" -ForegroundColor Green
Write-Host ""

# Passo 5: Limpar cache
Write-Host "🧹 Passo 5/7: Limpando cache..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path ".vite") { Remove-Item -Recurse -Force ".vite" }
Write-Host "✅ Cache limpo!" -ForegroundColor Green
Write-Host ""

# Passo 6: Build
Write-Host "🏗️  Passo 6/7: Buildando projeto..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO no build!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

# Passo 7: Deploy Vercel
Write-Host "🚀 Passo 7/7: Deployando na Vercel..." -ForegroundColor Yellow
Write-Host ""
$deployChoice = Read-Host "   Deploy em PRODUÇÃO? (s/N)"

if ($deployChoice -eq "s" -or $deployChoice -eq "S") {
    Write-Host "   🔥 DEPLOY EM PRODUÇÃO!" -ForegroundColor Red
    vercel --prod --yes
} else {
    Write-Host "   👀 Deploy em Preview..." -ForegroundColor Yellow
    vercel --yes
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERRO no deploy Vercel!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ DEPLOY AUTOMÁTICO CONCLUÍDO! 🎉        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✨ Mudanças:" -ForegroundColor Cyan
Write-Host "   • Git: Commit + Push ✅" -ForegroundColor White
Write-Host "   • Build: Otimizado ✅" -ForegroundColor White
Write-Host "   • Vercel: Deployado ✅" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Acesse o link fornecido pela Vercel acima!" -ForegroundColor Cyan
Write-Host ""
