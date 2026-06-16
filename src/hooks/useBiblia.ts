import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Livro {
  abbrev: string
  book: string
  chapters: string[][]
}

export function useBiblia() {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBiblia() {
      try {
        console.log('🔄 Iniciando carregamento da Bíblia do Supabase...')

        // Buscar todos os livros ordenados por ID (ordem bíblica)
        const { data: books, error: booksError } = await supabase
          .from('bible_books')
          .select('id, abbrev, name')
          .order('id', { ascending: true })

        console.log('📚 Livros retornados:', books?.length, 'livros')
        if (books && books.length > 0) {
          console.log('📖 Primeiro livro:', books[0])
        }

        if (booksError) {
          console.error('❌ Erro ao buscar livros:', booksError)
          throw booksError
        }
        if (!books || books.length === 0) {
          throw new Error('Nenhum livro encontrado no banco de dados')
        }

        // Para cada livro, buscar versículos e organizar por capítulos
        const livrosCompletos: Livro[] = []

        for (const book of books) {
          const { data: verses, error: versesError } = await supabase
            .from('bible_verses')
            .select('chapter, verse, text')
            .eq('book_id', book.id)
            .order('chapter', { ascending: true })
            .order('verse', { ascending: true })

          if (versesError) {
            console.error(`❌ Erro ao buscar versículos do livro ${book.name}:`, versesError)
            throw versesError
          }

          // Organizar versículos por capítulo
          const chaptersMap = new Map<number, string[]>()

          verses?.forEach(v => {
            if (!chaptersMap.has(v.chapter)) {
              chaptersMap.set(v.chapter, [])
            }
            chaptersMap.get(v.chapter)!.push(v.text)
          })

          // Converter Map para array de arrays (chapters)
          const chapters: string[][] = Array.from(chaptersMap.values())

          livrosCompletos.push({
            abbrev: book.abbrev,
            book: book.name,
            chapters
          })
        }

        console.log('✅ Bíblia carregada com sucesso! Total de livros:', livrosCompletos.length)
        console.log('📖 Estrutura do primeiro livro:', {
          abbrev: livrosCompletos[0]?.abbrev,
          book: livrosCompletos[0]?.book,
          chapters: livrosCompletos[0]?.chapters?.length
        })

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
