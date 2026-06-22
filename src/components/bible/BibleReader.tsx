import { useState, useEffect } from 'react'
import { useBiblia } from '@/hooks/useBiblia'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Book, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useGamification } from '@/hooks/useGamification'
import { useAuth } from '@/contexts/AuthContext'

export function BibleReader() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { awardXP } = useGamification(user?.id)
  const { livros, loading, error } = useBiblia()
  const [livroIndex, setLivroIndex] = useState(0)
  const [capituloIndex, setCapituloIndex] = useState(0)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set())

  const livroAtual = livros[livroIndex]
  const capituloAtual = livroAtual?.chapters[capituloIndex]
  const totalCapitulos = livroAtual?.chapters.length || 0

  // Debug logs
  useEffect(() => {
    if (livros.length > 0) {
      console.log('Bíblia carregada:', livros.length, 'livros')
      console.log('Livro atual:', livroAtual?.book)
      console.log('Capítulo atual:', capituloIndex + 1)
      console.log('Capítulos atuais:', totalCapitulos)
    }
  }, [livros, livroIndex, capituloIndex, livroAtual, totalCapitulos])

  // Reset chapter when book changes
  useEffect(() => {
    setCapituloIndex(0)
  }, [livroIndex])

  // Clamp indices when data changes to avoid invalid book/chapter state
  useEffect(() => {
    if (livroIndex >= livros.length) {
      setLivroIndex(Math.max(0, livros.length - 1))
    }
  }, [livros.length, livroIndex])

  useEffect(() => {
    if (livroAtual && capituloIndex >= livroAtual.chapters.length) {
      setCapituloIndex(Math.max(0, livroAtual.chapters.length - 1))
    }
  }, [livroAtual, capituloIndex])

  const proximoCapitulo = () => {
    if (capituloIndex < totalCapitulos - 1) {
      setCapituloIndex(capituloIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (livroIndex < livros.length - 1) {
      // Go to next book, chapter 1
      setLivroIndex(livroIndex + 1)
      setCapituloIndex(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const capituloAnterior = () => {
    if (capituloIndex > 0) {
      setCapituloIndex(capituloIndex - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (livroIndex > 0) {
      // Go to previous book, last chapter
      const prevBook = livros[livroIndex - 1]
      setLivroIndex(livroIndex - 1)
      setCapituloIndex(prevBook.chapters.length - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const podeVoltar = livroIndex > 0 || capituloIndex > 0
  const podeAvancar = livroIndex < livros.length - 1 || capituloIndex < totalCapitulos - 1

  const markChapterAsRead = async () => {
    const chapterKey = `${livroAtual?.abbrev}-${capituloIndex + 1}`

    if (completedChapters.has(chapterKey)) return

    setCompletedChapters(new Set(completedChapters).add(chapterKey))

    // Conceder XP por leitura bíblica
    if (user) {
      await awardXP('bible_reading_completed')
    }

    toast({
      title: "Capítulo completado! 📖",
      description: "+15 XP concedidos. Continue meditando na Palavra!",
    })
  }

  const currentChapterKey = `${livroAtual?.abbrev}-${capituloIndex + 1}`
  const isCurrentChapterRead = completedChapters.has(currentChapterKey)

  if (loading) {
    return (
      <Card className="shadow-divine">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-divine border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar a Bíblia</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!loading && livros.length === 0) {
    return (
      <Card className="shadow-divine border-warning">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo da Bíblia disponível</h3>
            <p className="text-muted-foreground mb-4">
              Os dados da Bíblia não foram carregados corretamente. Atualize a página ou confira a conexão.
            </p>
            <Button onClick={() => window.location.reload()}>
              Recarregar Bíblia
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Card */}
      <Card className="shadow-divine">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            Navegação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Book Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Livro</label>
              <Select
                value={livroIndex.toString()}
                onValueChange={(v) => {
                  const newIndex = parseInt(v)
                  console.log('Mudando para livro:', newIndex, livros[newIndex]?.book)
                  setLivroIndex(newIndex)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um livro">
                    {livroAtual?.book || 'Carregando...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {livros.map((livro, index) => (
                    <SelectItem key={`${livro.abbrev}-${index}`} value={index.toString()}>
                      {livro.book}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Capítulo</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={capituloAnterior}
                  disabled={!podeVoltar}
                  aria-label="Capítulo anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={capituloIndex.toString()}
                  onValueChange={(v) => setCapituloIndex(parseInt(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Capítulo">
                      Capítulo {capituloIndex + 1}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: totalCapitulos }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Capítulo {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={proximoCapitulo}
                  disabled={!podeAvancar}
                  aria-label="Próximo capítulo"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter Content */}
      <Card className="shadow-soft">
        <CardHeader className="border-b bg-gradient-primary text-primary-foreground">
          <CardTitle className="text-2xl">
            {livroAtual?.book} {capituloIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4" aria-live="polite">
              {capituloAtual && capituloAtual.length > 0 ? (
                capituloAtual.map((versiculo, index) => (
                  <div
                    key={index}
                    className="group hover:bg-muted/50 p-3 rounded-lg transition-all"
                  >
                    <div className="flex gap-3">
                      <span className="text-sm font-bold text-primary mt-1 min-w-[2rem]">
                        {index + 1}
                      </span>
                      <p className="text-base leading-relaxed flex-1">
                        {versiculo}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <p className="font-semibold">Nenhum versículo disponível para este capítulo.</p>
                  <p>Verifique se os dados da Bíblia foram carregados corretamente ou atualize a página.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={capituloAnterior}
              disabled={!podeVoltar}
              className="flex-1 sm:flex-initial"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={proximoCapitulo}
              disabled={!podeAvancar}
              className="flex-1 sm:flex-initial"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <Button
            variant={isCurrentChapterRead ? "default" : "outline"}
            onClick={markChapterAsRead}
            disabled={isCurrentChapterRead}
            className="w-full sm:w-auto"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isCurrentChapterRead ? "Lido ✓" : "Marcar como lido"}
          </Button>
        </CardFooter>
        <CardFooter className="flex flex-col items-center border-t pt-4 text-xs text-muted-foreground space-y-2">
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">
              Bíblia Almeida Corrigida e Fiel (ACF)
            </p>
            <p className="text-green-600 dark:text-green-400 font-medium">
              ✓ Domínio Público — Livre para uso
            </p>
            <p className="text-xs">
              Tradução de João Ferreira de Almeida (século XVII)
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
