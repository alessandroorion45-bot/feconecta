import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REDE_DA_FE_REACTIONS } from '@/lib/constants/reactions';
import { cn } from '@/lib/utils';

interface ReactionPickerProps {
  isOpen: boolean;
  onSelect: (reactionId: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onSelect,
  onClose,
  position = 'top'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Picker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'absolute z-50 flex gap-1 p-2 rounded-full',
              'bg-white dark:bg-gray-800',
              'shadow-2xl border border-gray-200 dark:border-gray-700',
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            )}
          >
            {REDE_DA_FE_REACTIONS.map((reaction, index) => (
              <motion.button
                key={reaction.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 500,
                  damping: 20
                }}
                whileHover={{
                  scale: 1.3,
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onSelect(reaction.id);
                  onClose();
                }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors relative group'
                )}
                title={reaction.label}
              >
                <span className="text-2xl">{reaction.emoji}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {reaction.label}
                </div>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
