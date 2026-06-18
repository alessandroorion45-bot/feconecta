import { useState, useEffect } from 'react';

const CACHE_KEY = 'biblia_cache_v1';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface BibleBook {
  abbrev: { pt: string };
  author: string;
  chapters: Array<string[]>;
  group: string;
  name: string;
  testament: string;
  book?: string;
}

interface CachedData {
  data: BibleBook[];
  timestamp: number;
}

export function useBibliaOptimized() {
  const [livros, setLivros] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBiblia = async () => {
      try {
        // ✅ PASSO 1: Tentar cache primeiro (instantâneo!)
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp }: CachedData = JSON.parse(cached);

            // Verificar se cache ainda é válido
            if (Date.now() - timestamp < CACHE_TTL && data.length > 0) {
              console.log('📖 Bíblia carregada do cache! (instantâneo)');
              setLivros(data);
              setLoading(false);
              return; // ✅ Retorna IMEDIATAMENTE!
            }
          } catch (e) {
            console.warn('Cache inválido, recarregando...');
          }
        }

        // ✅ PASSO 2: Se não tem cache válido, buscar da API
        console.log('📥 Carregando Bíblia da API...');
        const response = await fetch('https://www.abibliadigital.com.br/api/books');

        if (!response.ok) {
          throw new Error('Erro ao carregar Bíblia');
        }

        const data: BibleBook[] = await response.json();

        // Adicionar campo "book" para compatibilidade
        const livrosComBook = data.map(livro => ({
          ...livro,
          book: livro.name
        }));

        // ✅ PASSO 3: Salvar no cache para próximas visitas
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: livrosComBook,
          timestamp: Date.now()
        }));

        console.log('✅ Bíblia carregada e cacheada!');
        setLivros(livrosComBook);
        setLoading(false);

      } catch (err: any) {
        console.error('❌ Erro ao carregar Bíblia:', err);
        setError(err.message || 'Erro ao carregar a Bíblia');
        setLoading(false);
      }
    };

    loadBiblia();
  }, []);

  return { livros, loading, error };
}
