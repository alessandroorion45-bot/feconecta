import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Calendar, User, Image, Mic, FileText, Hash, Star } from 'lucide-react';
import { AvatarPro } from '@/components/AvatarPro';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { MessageType } from '@/hooks/useChatEngine';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SearchFilters {
  query: string;
  type?: MessageType;
  from?: string; // User ID
  dateFrom?: Date;
  dateTo?: Date;
  hasMedia?: boolean;
  isStarred?: boolean;
  hashtag?: string;
}

interface SearchResult {
  id: string;
  conversation_id: string;
  content: string;
  type: MessageType;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
  media_url?: string;
  is_starred: boolean;
}

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => Promise<SearchResult[]>;
  onSelectResult: (result: SearchResult) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  isOpen,
  onClose,
  onSearch,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Partial<SearchFilters>>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, filters]);

  const performSearch = async () => {
    setIsSearching(true);

    try {
      const searchFilters: SearchFilters = {
        query,
        ...filters
      };

      const searchResults = await onSearch(searchFilters);
      setResults(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = Object.keys(filters).filter(
    k => filters[k as keyof SearchFilters] !== undefined
  ).length;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -20, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header com busca */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filtros */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2">
                  {/* Tipo de mensagem */}
                  <Select
                    value={filters.type}
                    onValueChange={(value) => updateFilter('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de mensagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="sticker">Sticker</SelectItem>
                      <SelectItem value="verse">Versículo</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Data */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        {filters.dateFrom
                          ? `Desde ${filters.dateFrom.toLocaleDateString('pt-BR')}`
                          : 'Data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => updateFilter('dateFrom', date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Filtros rápidos */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.hasMedia ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('hasMedia', !filters.hasMedia)}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Com mídia
                  </Button>

                  <Button
                    variant={filters.isStarred ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('isStarred', !filters.isStarred)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Favoritas
                  </Button>

                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resultados */}
        <ScrollArea className="flex-1">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-20" />
              <p>
                {query.trim() || Object.keys(filters).length > 0
                  ? 'Nenhum resultado encontrado'
                  : 'Digite algo para buscar'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  onClick={() => {
                    onSelectResult(result);
                    onClose();
                  }}
                  className="p-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <AvatarPro src={result.sender_avatar} name={result.sender_name} size="sm" clickable={false} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{result.sender_name}</p>
                        {result.is_starred && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(result.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>

                      {/* Message preview */}
                      {result.type === 'text' && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </p>
                      )}

                      {result.type === 'image' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Image className="h-4 w-4" />
                          Imagem
                        </div>
                      )}

                      {result.type === 'audio' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mic className="h-4 w-4" />
                          Áudio
                        </div>
                      )}

                      {result.type === 'document' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Documento
                        </div>
                      )}

                      {result.media_url && result.type === 'image' && (
                        <img
                          src={result.media_url}
                          alt="Preview"
                          className="mt-2 max-w-[200px] rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer com contador */}
        {results.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 && 's'} encontrado{results.length !== 1 && 's'}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
