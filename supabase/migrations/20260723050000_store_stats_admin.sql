-- ============================================================
-- Estatísticas reais da loja no painel admin.
-- Duas views (por tipo e por produto), padrão admin_* : filtro
-- is_admin embutido, só authenticated SELECT, nada pra anon.
-- amount = preço do item (1 linha = 1 item), então sum(amount) das
-- compras aprovadas é a receita real, sem duplicar lotes de presente.
--
-- Rollback:
--   drop view if exists public.admin_store_product_stats;
--   drop view if exists public.admin_store_stats_by_type;
-- ============================================================

-- Por TIPO de produto (selo / presente / tema / moldura / ...)
create or replace view public.admin_store_stats_by_type as
select
  p.tipo,
  count(distinct p.id) as produtos_no_catalogo,
  count(sp.id) filter (where sp.status = 'approved') as vendas,
  coalesce(sum(sp.amount) filter (where sp.status = 'approved'), 0) as receita,
  count(sp.id) filter (where sp.status = 'approved' and sp.gift_to is not null) as presenteados,
  count(sp.id) filter (where sp.status = 'pending') as pendentes
from public.store_products p
left join public.store_purchases sp on sp.product_id = p.id
where public.is_admin(auth.uid())
group by p.tipo
order by receita desc, vendas desc;

revoke all on public.admin_store_stats_by_type from anon, public;
grant select on public.admin_store_stats_by_type to authenticated;

-- Por PRODUTO (inclui os que ainda não venderam, com 0)
create or replace view public.admin_store_product_stats as
select
  p.id,
  p.nome,
  p.tipo,
  p.raridade,
  p.preco,
  p.image_url,
  p.icone,
  p.limitado,
  p.estoque,
  count(sp.id) filter (where sp.status = 'approved') as vendas,
  coalesce(sum(sp.amount) filter (where sp.status = 'approved'), 0) as receita,
  count(sp.id) filter (where sp.status = 'approved' and sp.gift_to is not null) as presenteados,
  count(sp.id) filter (where sp.status = 'approved' and sp.gift_to is null) as compras_proprias,
  max(sp.created_at) filter (where sp.status = 'approved') as ultima_venda
from public.store_products p
left join public.store_purchases sp on sp.product_id = p.id
where public.is_admin(auth.uid())
group by p.id, p.nome, p.tipo, p.raridade, p.preco, p.image_url, p.icone, p.limitado, p.estoque
order by vendas desc, receita desc, p.nome;

revoke all on public.admin_store_product_stats from anon, public;
grant select on public.admin_store_product_stats to authenticated;
