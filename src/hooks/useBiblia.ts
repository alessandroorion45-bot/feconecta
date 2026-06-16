import { useState, useEffect } from 'react'

const ACF_URL = 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/acf.json'

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
    fetch(ACF_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao carregar a Bíblia')
        }
        return res.text()
      })
      .then(text => {
        // Remove BOM (Byte Order Mark) se existir
        const cleanText = text.replace(/^﻿/, '')
        const data = JSON.parse(cleanText)
        setLivros(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Erro ao carregar Bíblia:', err)
        setError('Erro ao carregar a Bíblia. Tente novamente.')
        setLoading(false)
      })
  }, [])

  return { livros, loading, error }
}
