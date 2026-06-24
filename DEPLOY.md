# 🚀 Guia de Deploy Ultra-Otimizado Vercel

## Deploy Automático

```powershell
.\deploy-auto.ps1
```

Faz: Git commit/push + Build + Deploy Vercel

## Otimizações Ativas

- Terser 3 passes
- Code splitting por vendor
- Gzip + Brotli
- Region: São Paulo (GRU1)
- Cache headers otimizados
- Request caching com TTL

## Checklist

- [ ] SQL executado no Supabase
- [ ] Build local OK
- [ ] Deploy Vercel
- [ ] Testar admin panel

