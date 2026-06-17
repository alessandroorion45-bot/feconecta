import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = envContent.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
  const [key, ...value] = line.split('=')
  if (!key) return acc
  acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '')
  return acc
}, {})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)

async function main() {
  const booksCount = await supabase.from('bible_books').select('*', { count: 'exact', head: true })
  const versesCount = await supabase.from('bible_verses').select('*', { count: 'exact', head: true })
  console.log('books count', booksCount.count, 'error', booksCount.error)
  console.log('verses count', versesCount.count, 'error', versesCount.error)

  const pageData = await supabase
    .from('bible_verses')
    .select('book_id,chapter,verse,text')
    .order('book_id', { ascending: true })
    .order('chapter', { ascending: true })
    .order('verse', { ascending: true })
    .range(0, 1999)

  console.log('range0-1999 length', pageData.data?.length, 'error', pageData.error)
  if (pageData.data) {
    console.log('unique book_ids first 20', [...new Set(pageData.data.map(v => v.book_id))].slice(0, 20))
    console.log('first book_id', pageData.data[0]?.book_id, 'last book_id', pageData.data[pageData.data.length-1]?.book_id)
  }

  const pageData2 = await supabase
    .from('bible_verses')
    .select('book_id,chapter,verse,text')
    .order('book_id', { ascending: true })
    .order('chapter', { ascending: true })
    .order('verse', { ascending: true })
    .range(1000, 1999)

  console.log('range1000-1999 length', pageData2.data?.length, 'error', pageData2.error)
  if (pageData2.data) {
    console.log('unique book_ids page2 first 20', [...new Set(pageData2.data.map(v => v.book_id))].slice(0, 20))
    console.log('first book_id page2', pageData2.data[0]?.book_id, 'last book_id page2', pageData2.data[pageData2.data.length-1]?.book_id)
  }

  const pageData3 = await supabase
    .from('bible_verses')
    .select('book_id,chapter,verse,text')
    .order('book_id', { ascending: true })
    .order('chapter', { ascending: true })
    .order('verse', { ascending: true })
    .range(2000, 2999)

  console.log('range2000-2999 length', pageData3.data?.length, 'error', pageData3.error)
  if (pageData3.data) {
    console.log('unique book_ids page3 first 20', [...new Set(pageData3.data.map(v => v.book_id))].slice(0, 20))
    console.log('first book_id page3', pageData3.data[0]?.book_id, 'last book_id page3', pageData3.data[pageData3.data.length-1]?.book_id)
  }

  const sample = await supabase.from('bible_verses').select('*').eq('book_id', 269).limit(5)
  console.log('book 269 sample', sample.data?.length, 'error', sample.error)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
