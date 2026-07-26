import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // não incomodar por 14 dias após dispensar

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * Banner de instalação customizado, com a logo da Arca.
 * - Android/Chromium: usa o beforeinstallprompt (prompt nativo ao tocar).
 * - iOS Safari: não existe prompt automático → mostra o passo-a-passo manual.
 * Layout empilhado: o botão "Instalar" ocupa a largura toda (sempre clicável
 * no celular).
 */
const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false); // modo instruções (iOS)

  useEffect(() => {
    if (isStandalone()) return; // já instalado
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

    // iOS não dispara beforeinstallprompt — mostra o banner de instruções.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIOS()) t = setTimeout(() => setVisible(true), 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  const install = async () => {
    // iOS ou sem evento: mostra as instruções manuais em vez de tentar prompt.
    if (isIOS() || !deferred) {
      setIosHint(true);
      return;
    }
    try {
      await deferred.prompt();
      await deferred.userChoice.catch(() => {});
      setVisible(false);
      setDeferred(null);
    } catch {
      // Se o prompt nativo falhar, guia pelo menu do navegador.
      setIosHint(true);
    }
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
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          role="dialog"
          aria-label="Instalar o app Aliança"
        >
          <button onClick={dismiss} className="pwa-install-close" aria-label="Agora não">
            <X className="h-4 w-4" />
          </button>

          <div className="pwa-install-row">
            <img src="/icons/icon-192.png" alt="" className="pwa-install-logo" width={44} height={44} />
            <div className="pwa-install-text">
              <strong>Instalar o Aliança</strong>
              <span>Acesse mais rápido, direto da tela inicial.</span>
            </div>
          </div>

          {iosHint ? (
            <div className="pwa-install-steps">
              {isIOS() ? (
                <p>Toque em <Share className="inline h-4 w-4 align-text-bottom" /> <strong>Compartilhar</strong> e depois em <strong>“Adicionar à Tela de Início”</strong> <Plus className="inline h-4 w-4 align-text-bottom" />.</p>
              ) : (
                <p>Abra o menu <strong>⋮</strong> do navegador e toque em <strong>“Instalar aplicativo”</strong> (ou “Adicionar à tela inicial”).</p>
              )}
            </div>
          ) : (
            <button onClick={install} className="pwa-install-btn">
              <Download className="h-4 w-4" /> Instalar app
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
