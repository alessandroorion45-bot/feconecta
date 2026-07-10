// Integração com o ViaCEP — busca rua/bairro/cidade/estado a partir do CEP.
export interface ViaCepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
  erro?: boolean;
}

export function isValidCep(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep.trim());
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) throw new Error("Não foi possível consultar o CEP");
  const data = await res.json();
  if (data.erro) return null;
  return data as ViaCepResult;
}
