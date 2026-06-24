#!/usr/bin/env pwsh
# =====================================================
# DEPLOY MASSIVO DO PAINEL ADMINISTRATIVO
# =====================================================
# Script para aplicar todas as 6 migrations do painel admin
# Execute este script no SQL Editor do Supabase Dashboard
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY MASSIVO - PAINEL ADMINISTRATIVO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script irá aplicar 6 migrations SQL:" -ForegroundColor Yellow
Write-Host "1. admin_panel_real_data.sql - Dashboard + Logs" -ForegroundColor White
Write-Host "2. admin_photos_management.sql - Gerenciador de Fotos" -ForegroundColor White
Write-Host "3. admin_notifications.sql - Central de Notificacoes" -ForegroundColor White
Write-Host "4. admin_analytics.sql - Analytics Real" -ForegroundColor White
Write-Host "5. admin_user_actions.sql - Acoes de Usuarios (Banir/Suspender)" -ForegroundColor White
Write-Host "6. moderation_automation.sql - Automacoes de Moderacao" -ForegroundColor White
Write-Host ""

# Criar arquivo consolidado
$outputFile = "e:\feconecta\deploy-admin-panel-consolidated.sql"

Write-Host "Consolidando migrations em um unico arquivo..." -ForegroundColor Cyan

# Header
$header = @"
-- =====================================================
-- DEPLOY MASSIVO - PAINEL ADMINISTRATIVO COMPLETO
-- =====================================================
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Total de migrations: 6
-- Status: Pronto para producao
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

"@

$header | Out-File -FilePath $outputFile -Encoding UTF8

# Adicionar cada migration
$migrations = @(
    "e:\feconecta\supabase\migrations\20260623080000_admin_panel_real_data.sql",
    "e:\feconecta\supabase\migrations\20260623081000_admin_photos_management.sql",
    "e:\feconecta\supabase\migrations\20260623082000_admin_notifications.sql",
    "e:\feconecta\supabase\migrations\20260623083000_admin_analytics.sql",
    "e:\feconecta\supabase\migrations\20260623084000_admin_user_actions.sql",
    "e:\feconecta\supabase\migrations\20260623085000_moderation_automation.sql"
)

$count = 1
foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        $filename = Split-Path $migration -Leaf
        Write-Host "[$count/6] Adicionando: $filename" -ForegroundColor Green

        # Adicionar separador
        "`n-- =====================================================" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "-- MIGRATION $count/6: $filename" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "-- =====================================================" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8

        # Adicionar conteudo da migration
        Get-Content $migration -Encoding UTF8 | Out-File -FilePath $outputFile -Append -Encoding UTF8

        "`n`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8

        $count++
    } else {
        Write-Host "ERRO: Migration nao encontrada: $filename" -ForegroundColor Red
    }
}

# Footer
$footer = @"

-- =====================================================
-- FIM DO DEPLOY MASSIVO
-- =====================================================
-- Total de migrations aplicadas: 6
-- Status: COMPLETO
-- =====================================================

"@

$footer | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ARQUIVO CONSOLIDADO CRIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivo: $outputFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Abra o Supabase Dashboard" -ForegroundColor White
Write-Host "2. Va para SQL Editor" -ForegroundColor White
Write-Host "3. Copie e cole o conteudo do arquivo acima" -ForegroundColor White
Write-Host "4. Execute o SQL" -ForegroundColor White
Write-Host ""
Write-Host "Abrindo arquivo..." -ForegroundColor Cyan

# Abrir arquivo no editor padrao
Start-Process notepad $outputFile

Write-Host ""
Write-Host "Deseja abrir o Supabase Dashboard agora? (S/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's') {
    Write-Host "Abrindo Supabase Dashboard..." -ForegroundColor Cyan
    Start-Process "https://app.supabase.com/projects"
}

Write-Host ""
Write-Host "Deploy preparado com sucesso!" -ForegroundColor Green
