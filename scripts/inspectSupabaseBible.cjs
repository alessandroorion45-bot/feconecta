const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  env.split(/\r?\n/).forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  const { data: books, error: booksError } = await supabase
    .from('bible_books')
    .select('id,abbrev,name')
    .order('id', { ascending: true });

  console.log('books count', books?.length, 'error', booksError);
  console.log('first 12 books', books?.slice(0, 12));

  const { data: verses, error: versesError } = await supabase
    .from('bible_verses')
    .select('book_id,chapter,verse,text')
    .order('book_id', { ascending: true })
    .order('chapter', { ascending: true })
    .order('verse', { ascending: true })
    .range(0, 2000);

  console.log('verses sample count', verses?.length, 'error', versesError);
  console.log('verses sample', verses?.slice(0, 40));

  const versesByBook = (verses || []).reduce((map, verse) => {
    const id = Number(verse.book_id);
    if (!map[id]) map[id] = [];
    map[id].push({
      ...verse,
      book_id: Number(verse.book_id),
      chapter: Number(verse.chapter),
      verse: Number(verse.verse),
    });
    return map;
  }, {});

  console.log('grouped keys', Object.keys(versesByBook).sort((a,b)=>Number(a)-Number(b)).slice(0,10));
  console.log('count for 269', versesByBook[269]?.length, 'first for 269', versesByBook[269]?.slice(0,10));

  const book269Chapters = (versesByBook[269] || []).reduce((chap, v) => {
    const chapterNum = Number(v.chapter);
    if (!chap[chapterNum]) chap[chapterNum] = [];
    chap[chapterNum].push(v.text);
    return chap;
  }, {});
  console.log('chapters for 269 keys', Object.keys(book269Chapters).sort((a,b)=>Number(a)-Number(b)));

  process.exit(0);
})();
