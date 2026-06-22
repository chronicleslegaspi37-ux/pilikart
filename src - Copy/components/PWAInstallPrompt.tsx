import { useState, useEffect } from 'react';
import { X, Download, Chrome, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function detectBrowser() {
  const ua = navigator.userAgent;
  const isFacebook = /FBAN|FBAV|FB_IAB|FB4A/i.test(ua);
  const isInstagram = /Instagram/i.test(ua);
  const isMessenger = /Messenger/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isInAppBrowser = isFacebook || isInstagram || isMessenger;
  return { isFacebook, isInstagram, isMessenger, isInAppBrowser, isAndroid, isIOS };
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInAppGuide, setShowInAppGuide] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa_prompt_dismissed') === 'true') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const browser = detectBrowser();

    if (browser.isInAppBrowser) {
      setTimeout(() => {
        setShowInAppGuide(true);
        setTimeout(() => setVisible(true), 10);
      }, 1500);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowPrompt(true);
        setTimeout(() => setVisible(true), 10);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => dismiss(), 3000);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setShowPrompt(false);
      setShowInAppGuide(false);
    }, 300);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setInstalled(true);
      setTimeout(() => dismiss(), 3000);
    } else {
      setInstalling(false);
    }
  };

  const slideStyle = {
    transform: visible ? 'translateY(0)' : 'translateY(120%)',
    opacity: visible ? 1 : 0,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
  };

  const browser = detectBrowser();

  /* ─── In-App Browser Guide (Facebook / Instagram / Messenger) ─── */
  if (showInAppGuide) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-[9999] max-w-[430px] mx-auto"
        style={slideStyle}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-primary p-4 text-white relative">
            <button onClick={dismiss} className="absolute top-3 right-3 text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Install PiliKart App</h3>
                <p className="text-[11px] text-primary-foreground/80">Get the full app experience</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-600 font-medium">
              To install PiliKart, open this page in your phone's browser:
            </p>

            <div className="space-y-2">
              {browser.isAndroid && (
                <>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">1</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Tap the <strong>three dots (⋮)</strong> or <strong>More options</strong> button in the top corner
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">2</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Select <strong>"Open in Chrome"</strong> or <strong>"Open in browser"</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">3</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Tap <strong>"Install App"</strong> or the <strong>install icon</strong> in Chrome's address bar
                    </p>
                  </div>
                </>
              )}
              {browser.isIOS && (
                <>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">1</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Tap the <strong>three dots (···)</strong> or <strong>Share</strong> button
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">2</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Select <strong>"Open in Safari"</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">3</span>
                    </div>
                    <p className="text-xs text-gray-700">
                      Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong>
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={dismiss}
              className="w-full text-xs text-gray-400 py-2 hover:text-gray-600 transition"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Normal PWA Install Prompt ─── */
  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9999] max-w-[430px] mx-auto"
      style={slideStyle}
    >
      <div className="bg-gray-950 text-white rounded-2xl shadow-2xl border border-gray-800 p-4 relative overflow-hidden">
        <button onClick={dismiss} className="absolute top-3 right-3 text-gray-400 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>

        {installed ? (
          <div className="text-center py-2">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="font-bold text-sm text-green-400">PiliKart Installed!</h3>
            <p className="text-[11px] text-gray-400 mt-1">Open it from your home screen anytime.</p>
          </div>
        ) : installing ? (
          <div className="py-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                <img src="/logo.jpg" alt="PiliKart" className="w-8 h-8 rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Installing PiliKart...</h3>
                <p className="text-[11px] text-gray-400">Please confirm in the prompt above</p>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-2 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-green-900/40">
                <img src="/logo.jpg" alt="PiliKart Logo" className="w-9 h-9 rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Install PiliKart App</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Shopping, rewards, Bible & games — in one app ⚡</p>
              </div>
            </div>

            <div className="flex gap-1.5 mb-4">
              {["Fast launch", "Offline support", "Push alerts"].map(f => (
                <span key={f} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded-lg font-medium">
                  {f}
                </span>
              ))}
            </div>

            <div className="flex gap-2 text-xs">
              <button
                className="flex-1 font-bold border border-gray-700 hover:border-gray-500 text-gray-300 py-2.5 rounded-xl transition bg-transparent"
                onClick={dismiss}
              >
                Not Now
              </button>
              <Button
                className="flex-1 font-bold bg-green-500 hover:bg-green-600 text-white shadow-md rounded-xl border-none h-auto py-2.5 active:scale-95 transition"
                onClick={handleInstall}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Install Now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
