import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfetvofrwtuduwmpvdlz.supabase.co';
const supabaseKey = 'sb_publishable_8-a3qVJjeLmRBhKui1rCvg_9hWQMqqR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBiblia() {
  console.log('🔍 Verificando dados da Bíblia no Supabase...\n');

  try {
    // 1. Verificar livros
    const { data: books, error: booksError } = await supabase
      .from('bible_books')
      .select('id, name, abbrev')
      .order('id', { ascending: true });

    if (booksError) {
      console.error('❌ Erro ao buscar livros:', booksError);
      return;
    }

    console.log(`📚 Total de livros: ${books?.length || 0}`);
    console.log('Primeiros 5 livros:');
    books?.slice(0, 5).forEach(book => {
      console.log(`  - ID: ${book.id}, Nome: ${book.name}, Abbrev: ${book.abbrev}`);
    });
    console.log('');

    // 2. Verificar total de versículos
    const { count: totalVerses, error: countError } = await supabase
      .from('bible_verses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar versículos:', countError);
      return;
    }

    console.log(`📖 Total de versículos: ${totalVerses || 0}\n`);

    // 3. Verificar versículos de Levítico (book_id do Levítico)
    // Primeiro, achar o ID de Levítico
    const levitico = books?.find(b => b.name.toLowerCase().includes('lev'));

    if (levitico) {
      console.log(`🔎 Verificando Levítico (ID: ${levitico.id})...`);

      const { data: levVerses, error: levError } = await supabase
        .from('bible_verses')
        .select('book_id, chapter, verse, text')
        .eq('book_id', levitico.id)
        .limit(10);

      if (levError) {
        console.error('❌ Erro ao buscar versículos de Levítico:', levError);
      } else {
        console.log(`  Total encontrado: ${levVerses?.length || 0} versículos (amostra)`);
        if (levVerses && levVerses.length > 0) {
          console.log('  Primeiro versículo:', levVerses[0]);
        } else {
          console.log('  ⚠️ NENHUM versículo encontrado para Levítico!');
        }
      }
    }

    // 4. Verificar distribuição de versículos por livro
    console.log('\n📊 Versículos por livro (primeiros 10):');

    for (let i = 0; i < Math.min(10, books?.length || 0); i++) {
      const book = books![i];
      const { count } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', book.id);

      console.log(`  ${book.name} (ID: ${book.id}): ${count || 0} versículos`);
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }
}

verificarBiblia();
