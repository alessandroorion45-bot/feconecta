import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Check, Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface FriendRequestAnimationProps {
  type: "received" | "accepted" | "sent";
  userName?: string;
  show: boolean;
  onComplete?: () => void;
}

export const FriendRequestAnimation = ({
  type,
  userName,
  show,
  onComplete
}: FriendRequestAnimationProps) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getContent = () => {
    switch (type) {
      case "received":
        return {
          icon: UserPlus,
          title: "Novo pedido de amizade!",
          subtitle: userName ? `${userName} quer ser seu amigo` : "Alguém quer ser seu amigo",
          color: "from-blue-500 to-purple-500",
          emoji: "🎉"
        };
      case "accepted":
        return {
          icon: Check,
          title: "Pedido aceito!",
          subtitle: userName ? `Você e ${userName} agora são amigos` : "Nova amizade formada",
          color: "from-green-500 to-emerald-500",
          emoji: "🤝"
        };
      case "sent":
        return {
          icon: Heart,
          title: "Pedido enviado!",
          subtitle: userName ? `Aguardando ${userName} aceitar` : "Aguardando confirmação",
          color: "from-pink-500 to-rose-500",
          emoji: "💝"
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <motion.div
            className={`relative bg-gradient-to-r ${content.color} p-4 rounded-2xl shadow-2xl text-white min-w-[280px]`}
            initial={{ rotateX: -20 }}
            animate={{ rotateX: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Sparkles decoration */}
            <motion.div
              className="absolute -top-2 -right-2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Sparkles className="h-6 w-6 text-yellow-300" />
            </motion.div>
            
            <motion.div
              className="absolute -bottom-1 -left-1"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.div
                className="bg-white/20 rounded-full p-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              
              <div className="flex-1">
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="font-bold text-lg">{content.title}</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="text-xl"
                  >
                    {content.emoji}
                  </motion.span>
                </motion.div>
                <motion.p
                  className="text-sm text-white/90"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {content.subtitle}
                </motion.p>
              </div>
            </div>

            {/* Animated pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-white/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 1, repeat: 2, repeatType: "loop" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FriendRequestAnimation;
