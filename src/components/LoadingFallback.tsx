import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingFallback = ({ message = "Carregando...", showLogo = true }: LoadingFallbackProps) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 p-4">
      {showLogo && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          transition={{
            duration: 0.8,
            type: "spring",
            bounce: 0.5
          }}
          className="relative"
        >
          {/* Logo Aliança com animações magnéticas */}
          <motion.div
            animate={{
              y: [-8, 8, -8],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <img
              src="/alianca-logo.png"
              alt="Aliança"
              className="h-24 w-24 sm:h-32 sm:w-32 object-contain drop-shadow-2xl filter brightness-110"
            />

            {/* Glow pulsante */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 via-amber-500/40 to-orange-500/40 rounded-full blur-2xl -z-10"
            />

            {/* Ring externo expandindo */}
            <motion.div
              animate={{
                scale: [1, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 border-4 border-amber-400/60 rounded-full -z-10"
            />

            {/* Ring secundário */}
            <motion.div
              animate={{
                scale: [1, 2.2],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5
              }}
              className="absolute inset-0 border-2 border-yellow-400/40 rounded-full -z-10"
            />
          </motion.div>

          {/* Texto Aliança */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center mt-4"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent drop-shadow-lg">
              Aliança
            </h1>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-3"
      >
        <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
        <p className="text-base font-medium text-muted-foreground">{message}</p>
      </motion.div>
    </div>
  );
};

export default LoadingFallback;
