import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Aguardar animação de saída
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-900"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -10, 0] // Flutuação suave
            }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              scale: { duration: 0.5, ease: "easeOut" },
              opacity: { duration: 0.5 },
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="relative"
          >
            {/* Logo Aliança */}
            <img
              src="/alianca-logo.png"
              alt="Aliança"
              className="w-48 h-48 md:w-64 md:h-64 object-contain filter drop-shadow-2xl"
            />

            {/* Brilho sutil */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-t from-amber-400/20 via-transparent to-transparent rounded-full blur-3xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
