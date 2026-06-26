import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, X } from 'lucide-react';
import { STICKER_CATEGORIES, searchStickers, Sticker } from '@/lib/constants/stickers';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;
  onClose?: () => void;
  favorites?: string[]; // IDs dos stickers favoritados
  onToggleFavorite?: (stickerId: string) => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  onSelect,
  onClose,
  favorites = [],
  onToggleFavorite
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('fe-oracao');

  // Buscar stickers
  const searchResults = searchQuery.trim()
    ? searchStickers(searchQuery)
    : [];

  // Stickers favoritos
  const favoriteStickers = STICKER_CATEGORIES
    .flatMap(cat => cat.stickers)
    .filter(s => favorites.includes(s.id));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="w-full max-w-md h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Stickers da Aliança</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resultados da busca */}
      {searchQuery.trim() && (
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum sticker encontrado
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {searchResults.map((sticker) => (
                  <StickerItem
                    key={sticker.id}
                    sticker={sticker}
                    onSelect={onSelect}
                    isFavorite={favorites.includes(sticker.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Tabs por categoria */}
      {!searchQuery.trim() && (
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0 rounded-none border-b">
            {/* Tab de favoritos */}
            {favoriteStickers.length > 0 && (
              <TabsTrigger value="favorites" className="gap-2">
                <Star className="h-4 w-4" />
                Favoritos
              </TabsTrigger>
            )}

            {/* Tabs das categorias */}
            {STICKER_CATEGORIES.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <span>{category.emoji}</span>
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Favoritos */}
          {favoriteStickers.length > 0 && (
            <TabsContent value="favorites" className="flex-1 overflow-hidden m-0 p-0">
              <ScrollArea className="h-full p-4">
                <div className="grid grid-cols-4 gap-2">
                  {favoriteStickers.map((sticker) => (
                    <StickerItem
                      key={sticker.id}
                      sticker={sticker}
                      onSelect={onSelect}
                      isFavorite={true}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* Categorias */}
          {STICKER_CATEGORIES.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="flex-1 overflow-hidden m-0 p-0"
            >
              <ScrollArea className="h-full p-4">
                <div className="grid grid-cols-4 gap-2">
                  {category.stickers.map((sticker) => (
                    <StickerItem
                      key={sticker.id}
                      sticker={sticker}
                      onSelect={onSelect}
                      isFavorite={favorites.includes(sticker.id)}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </motion.div>
  );
};

// =====================================================
// STICKER ITEM
// =====================================================

interface StickerItemProps {
  sticker: Sticker;
  onSelect: (sticker: Sticker) => void;
  isFavorite: boolean;
  onToggleFavorite?: (stickerId: string) => void;
}

const StickerItem: React.FC<StickerItemProps> = ({
  sticker,
  onSelect,
  isFavorite,
  onToggleFavorite
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.1, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
    >
      {/* Sticker */}
      <div
        onClick={() => onSelect(sticker)}
        className="w-full h-full p-2 flex items-center justify-center"
      >
        <img
          src={sticker.url}
          alt={sticker.name}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            // Fallback para stickers que não existem
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext y="50" font-size="40"%3E❓%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>

      {/* Botão favoritar */}
      {onToggleFavorite && (
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(sticker.id);
              }}
              className={cn(
                'absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors',
                isFavorite
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}
            >
              <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* Nome ao passar o mouse */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs py-1 px-2 text-center"
          >
            {sticker.name}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
