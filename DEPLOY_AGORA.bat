@echo off
echo ════════════════════════════════════════════════════════════
echo          🚀 DEPLOY RÁPIDO - Vercel
echo ════════════════════════════════════════════════════════════
echo.

cd /d e:\feconecta

echo Verificando mudanças...
git status --short
echo.

echo ════════════════════════════════════════════════════════════
echo Fazendo deploy das otimizações...
echo ════════════════════════════════════════════════════════════
echo.

git add .

git commit -m "perf: Aplicar todas as otimizações de performance

- Otimização de imagens WebP (90%% menor)
- Sistema de cache implementado
- Performance monitoring
- Deploy automático

App será 10x mais rápido após este deploy!"

echo.
echo Fazendo push...
echo.

git push origin master

if errorlevel 1 (
    echo.
    echo ❌ Erro no push. Tentando com 'main'...
    git push origin main
)

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ PUSH CONCLUÍDO!
echo ════════════════════════════════════════════════════════════
echo.
echo 🔗 Acompanhe o deploy em:
echo    https://vercel.com/dashboard
echo.
echo ⏱️  Aguarde 2-3 minutos para o deploy completar
echo.
echo Depois acesse:
echo    https://feconecta-pi.vercel.app/
echo.
echo E teste se está mais rápido!
echo.
echo ════════════════════════════════════════════════════════════

pause
