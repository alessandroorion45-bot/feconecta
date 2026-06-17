// scripts/importBiblia.ts
// Baixa o JSON da ACF do GitHub e importa no Supabase
// Executar: npx tsx scripts/importBiblia.ts

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Carregar .env manualmente
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value
    }
  })
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/acf.json'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!')
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL)
  console.error('   VITE_SUPABASE_PUBLISHABLE_KEY:', SUPABASE_ANON_KEY ? '***' : 'não definida')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface Livro {
  abbrev: string
  book: string
  chapters: string[][]
}

async function main() {
  console.log('🔄 Baixando JSON da Bíblia ACF...')

  const res = await fetch(JSON_URL)
  if (!res.ok) throw new Error(`Erro ao baixar JSON: ${res.status}`)

  // Remover BOM se existir
  const text = await res.text()
  const cleanText = text.replace(/^﻿/, '')
  const data: Livro[] = JSON.parse(cleanText)

  console.log(`✅ JSON carregado. Livros encontrados: ${data.length}`)

  // Limpar dados antigos (opcional)
  console.log('🧹 Limpando dados antigos...')
  await supabase.from('bible_verses').delete().neq('id', 0)
  await supabase.from('bible_books').delete().neq('id', 0)

  for (const [index, livro] of data.entries()) {
    const testament = index < 39 ? 'AT' : 'NT'

    // Debug: mostrar estrutura do livro
    if (index === 0) {
      console.log('📝 Debug - Estrutura do primeiro livro:', JSON.stringify(livro, null, 2).substring(0, 300))
    }

    const bookName = livro.name || livro.book || livro.title || 'Unknown'
    const bookAbbrev = livro.abbrev || livro.abbr || `book${index + 1}`

    // Inserir livro
    const { data: bookData, error: bookError } = await supabase
      .from('bible_books')
      .upsert({ abbrev: bookAbbrev, name: bookName, testament }, { onConflict: 'abbrev' })
      .select('id')
      .single()

    if (bookError) {
      console.error(`❌ Erro ao inserir livro ${bookName}:`, bookError.message)
      continue
    }

    const bookId = bookData.id
    console.log(`📖 Importando: ${bookName} (${livro.chapters.length} capítulos)`)

    // Montar batch de versículos
    const verses: { book_id: number; chapter: number; verse: number; text: string }[] = []

    for (const [chapIndex, chapter] of livro.chapters.entries()) {
      for (const [verseIndex, text] of chapter.entries()) {
        verses.push({
          book_id: bookId,
          chapter: chapIndex + 1,
          verse: verseIndex + 1,
          text,
        })
      }
    }

    // Inserir em batches de 500
    const BATCH_SIZE = 500
    for (let i = 0; i < verses.length; i += BATCH_SIZE) {
      const batch = verses.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('bible_verses').upsert(batch)
      if (error) {
        console.error(`❌ Erro batch ${i}:`, error.message)
      } else {
        console.log(`   ✓ Inseridos ${Math.min(BATCH_SIZE, verses.length - i)} versículos`)
      }
    }
  }

  console.log('\n🎉 Importação concluída!')
  console.log('\n📊 Estatísticas:')

  const { count: booksCount } = await supabase.from('bible_books').select('*', { count: 'exact', head: true })
  const { count: versesCount } = await supabase.from('bible_verses').select('*', { count: 'exact', head: true })

  console.log(`   - Livros: ${booksCount}`)
  console.log(`   - Versículos: ${versesCount}`)
}

main().catch(console.error)
