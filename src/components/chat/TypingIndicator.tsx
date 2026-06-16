import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  name?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  name,
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        'flex items-center gap-2 px-4 py-2',
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-muted/50 backdrop-blur-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
        {name && (
          <span className="text-xs text-muted-foreground">
            {name} está digitando...
          </span>
        )}
      </div>
    </motion.div>
  );
};
