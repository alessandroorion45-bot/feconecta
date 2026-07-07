import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase sem tipagem (temporário até regenerar types.ts)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)

export interface Livro {
  abbrev: string
  book: string
  chapters: string[][]
}

const CACHE_KEY = 'biblia_supabase_cache_v1';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface CachedData {
  data: Livro[];
  timestamp: number;
}

export function useBiblia() {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBiblia() {
      try {
        // ✅ OTIMIZAÇÃO: Tentar cache primeiro
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp }: CachedData = JSON.parse(cached);

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

        console.log('🔄 Iniciando carregamento da Bíblia do Supabase...')

        // Buscar todos os livros ordenados por ID (ordem bíblica)
        const { data: books, error: booksError } = await supabase
          .from('bible_books')
          .select('id, abbrev, name')
          .order('id', { ascending: true })

        console.log('📚 Livros retornados:', books?.length, 'livros')

        if (booksError) {
          console.error('❌ Erro ao buscar livros:', booksError)
          throw booksError
        }
        if (!books || books.length === 0) {
          throw new Error('Nenhum livro encontrado no banco de dados')
        }

        // ✅ Buscar TODOS os versículos, paginando (Supabase/PostgREST limita
        // a ~1000 linhas por requisição — a Bíblia inteira tem >30 mil versículos)
        console.log('📖 Buscando todos os versículos (paginado)...')
        const bookIds = books.map(b => b.id)
        const PAGE_SIZE = 1000
        const allVerses: { book_id: number; chapter: number; verse: number; text: string }[] = []

        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data: page, error: versesError } = await supabase
            .from('bible_verses')
            .select('book_id, chapter, verse, text')
            .in('book_id', bookIds)
            .order('book_id', { ascending: true })
            .order('chapter', { ascending: true })
            .order('verse', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1)

          if (versesError) {
            console.error('❌ Erro ao buscar versículos:', versesError)
            throw versesError
          }

          if (!page || page.length === 0) break
          allVerses.push(...page)
          if (page.length < PAGE_SIZE) break
        }

        console.log(`✅ ${allVerses.length} versículos carregados!`)

        // Organizar versículos por livro
        const versesByBook = new Map<number, typeof allVerses>()
        allVerses?.forEach(v => {
          if (!versesByBook.has(v.book_id)) {
            versesByBook.set(v.book_id, [])
          }
          versesByBook.get(v.book_id)!.push(v)
        })

        // Construir livros completos
        const livrosCompletos: Livro[] = books.map(book => {
          const verses = versesByBook.get(book.id) || []

          // Organizar versículos por capítulo
          const chaptersMap = new Map<number, string[]>()
          verses.forEach(v => {
            if (!chaptersMap.has(v.chapter)) {
              chaptersMap.set(v.chapter, [])
            }
            chaptersMap.get(v.chapter)!.push(v.text)
          })

          // Converter Map para array de arrays (chapters)
          const chapters: string[][] = Array.from(chaptersMap.values())

          return {
            abbrev: book.abbrev,
            book: book.name,
            chapters
          }
        })

        console.log('✅ Bíblia carregada com sucesso! Total de livros:', livrosCompletos.length)

        // ✅ OTIMIZAÇÃO: Salvar no cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: livrosCompletos,
          timestamp: Date.now()
        }));

        setLivros(livrosCompletos)
        setLoading(false)
      } catch (err) {
        console.error('❌ Erro ao carregar Bíblia:', err)
        setError('Erro ao carregar a Bíblia do banco de dados. Tente novamente.')
        setLoading(false)
      }
    }

    loadBiblia()
  }, [])

  return { livros, loading, error }
}
