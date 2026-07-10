// Integração com a API pública do IBGE (localidades) — estados e
// municípios do Brasil, sem precisar de chave de API.
export interface IbgeState {
  id: number;
  sigla: string;
  nome: string;
}

export interface IbgeCity {
  id: number;
  nome: string;
}

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";

export async function fetchBrazilianStates(): Promise<IbgeState[]> {
  const res = await fetch(`${IBGE_BASE}/estados?orderBy=nome`);
  if (!res.ok) throw new Error("Não foi possível carregar os estados");
  return res.json();
}

export async function fetchCitiesByState(uf: string): Promise<IbgeCity[]> {
  if (!uf) return [];
  const res = await fetch(`${IBGE_BASE}/estados/${uf}/municipios?orderBy=nome`);
  if (!res.ok) throw new Error("Não foi possível carregar os municípios");
  return res.json();
}
