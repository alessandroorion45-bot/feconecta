import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
// Não incomodar de novo por 14 dias após dispensar.
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Banner de instalação customizado (beforeinstallprompt) — discreto, com a
 * logo da Arca. Aparece só quando o navegador considera o app instalável e o
 * usuário ainda não instalou nem dispensou recentemente.
 */
const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const snoozed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (snoozed && Date.now() - snoozed < SNOOZE_MS) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pwa-install-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          role="dialog"
          aria-label="Instalar o app Aliança"
        >
          <img src="/icons/icon-192.png" alt="" className="pwa-install-logo" width={44} height={44} />
          <div className="pwa-install-text">
            <strong>Instalar o Aliança</strong>
            <span>Acesse mais rápido, direto da tela inicial.</span>
          </div>
          <button onClick={install} className="pwa-install-btn">
            <Download className="h-4 w-4" /> Instalar
          </button>
          <button onClick={dismiss} className="pwa-install-close" aria-label="Agora não">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
