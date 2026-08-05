import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { lerBibliaOffline, salvarBibliaOffline } from '@/lib/offlineBible'

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

const LEGACY_CACHE_KEY = 'biblia_supabase_cache_v1'; // localStorage antigo
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias — só decide QUANDO atualizar

/** Baixa a Bíblia inteira do Supabase (paginado: PostgREST devolve ~1000/vez). */
async function baixarBiblia(): Promise<Livro[]> {
  const { data: books, error: booksError } = await supabase
    .from('bible_books')
    .select('id, abbrev, name')
    .order('id', { ascending: true })

  if (booksError) throw booksError
  if (!books || books.length === 0) throw new Error('Nenhum livro encontrado no banco de dados')

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

    if (versesError) throw versesError
    if (!page || page.length === 0) break
    allVerses.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  const versesByBook = new Map<number, typeof allVerses>()
  allVerses.forEach(v => {
    if (!versesByBook.has(v.book_id)) versesByBook.set(v.book_id, [])
    versesByBook.get(v.book_id)!.push(v)
  })

  return books.map(book => {
    const verses = versesByBook.get(book.id) || []
    const chaptersMap = new Map<number, string[]>()
    verses.forEach(v => {
      if (!chaptersMap.has(v.chapter)) chaptersMap.set(v.chapter, [])
      chaptersMap.get(v.chapter)!.push(v.text)
    })
    return { abbrev: book.abbrev, book: book.name, chapters: Array.from(chaptersMap.values()) }
  })
}

/**
 * Bíblia com leitura OFFLINE.
 *
 * Ordem: cópia local primeiro (abre na hora, mesmo sem internet) e só então,
 * se estiver velha, atualiza em segundo plano. Se a rede falhar, a cópia local
 * continua valendo — a Palavra não pode depender de sinal.
 */
export function useBiblia() {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function loadBiblia() {
      // O cache antigo em localStorage ocupava ~4 MB da cota (e no celular
      // costumava nem caber). Agora usamos IndexedDB — libera o espaço.
      try { localStorage.removeItem(LEGACY_CACHE_KEY) } catch { /* ignore */ }

      const guardada = await lerBibliaOffline<Livro[]>()

      if (guardada?.data?.length) {
        if (!cancelado) {
          setLivros(guardada.data)
          setLoading(false)
        }
        // Está fresca? nada a fazer.
        if (Date.now() - guardada.timestamp < CACHE_TTL) return

        // Está velha: atualiza em segundo plano, sem tirar a Bíblia da tela se
        // a rede falhar (o usuário segue lendo o que já tem).
        try {
          const nova = await baixarBiblia()
          await salvarBibliaOffline(nova)
          if (!cancelado) setLivros(nova)
        } catch {
          if (!cancelado) setOffline(true)
        }
        return
      }

      // Primeira vez (nada guardado): precisa da rede uma vez só.
      try {
        const nova = await baixarBiblia()
        if (!cancelado) {
          setLivros(nova)
          setLoading(false)
        }
        // Gravação isolada: se o disco recusar, a leitura NÃO pode quebrar.
        // (era o bug — localStorage.setItem estourava a cota e o app exibia
        // "erro ao carregar a Bíblia" mesmo com os versículos já carregados.)
        await salvarBibliaOffline(nova)
      } catch (err) {
        console.error('❌ Erro ao carregar Bíblia:', err)
        if (!cancelado) {
          setError(
            navigator.onLine
              ? 'Não foi possível carregar a Bíblia agora. Tente novamente.'
              : 'Você está sem internet e a Bíblia ainda não foi baixada. Conecte-se uma vez para poder ler offline depois.'
          )
          setLoading(false)
        }
      }
    }

    loadBiblia()
    return () => { cancelado = true }
  }, [])

  return { livros, loading, error, offline }
}
