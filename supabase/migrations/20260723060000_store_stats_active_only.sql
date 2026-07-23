-- Estatísticas da Loja: contar só produtos ATIVOS (status='active'),
-- deixando os arquivados de fora do catálogo e das metricas.
-- Substitui as views de 20260723050000 adicionando o filtro de status.
--
-- Rollback: reaplicar 20260723050000_store_stats_admin.sql (sem o filtro).

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
  and p.status = 'active'
group by p.tipo
order by receita desc, vendas desc;

revoke all on public.admin_store_stats_by_type from anon, public;
grant select on public.admin_store_stats_by_type to authenticated;

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
  and p.status = 'active'
group by p.id, p.nome, p.tipo, p.raridade, p.preco, p.image_url, p.icone, p.limitado, p.estoque
order by vendas desc, receita desc, p.nome;

revoke all on public.admin_store_product_stats from anon, public;
grant select on public.admin_store_product_stats to authenticated;
