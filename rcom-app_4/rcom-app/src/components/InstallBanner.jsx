import React, { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (localStorage.getItem('rcom-install-dismissed')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Android / Chrome - capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    });

    // iOS detection
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = window.navigator.standalone;
    if (isIOS && !isInStandalone) {
      setShowIOS(true);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowAndroid(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowAndroid(false);
    setShowIOS(false);
    setDismissed(true);
    localStorage.setItem('rcom-install-dismissed', '1');
  };

  if (dismissed || (!showAndroid && !showIOS)) return null;

  return (
    <div style={s.banner}>
      <div style={s.left}>
        <div style={s.logoMini}>R</div>
        <div>
          <p style={s.title}>Installer R.COM</p>
          <p style={s.sub}>
            {showIOS
              ? 'Appuyez sur 🔗 puis "Sur l\'écran d\'accueil"'
              : 'Accès rapide depuis votre écran d\'accueil'
            }
          </p>
        </div>
      </div>
      <div style={s.btns}>
        {showAndroid && (
          <button style={s.installBtn} onClick={handleInstall}>
            Installer
          </button>
        )}
        <button style={s.dismissBtn} onClick={dismiss}>✕</button>
      </div>
    </div>
  );
}

const s = {
  banner: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
    background: 'white', borderTop: '3px solid #c0392b',
    padding: '12px 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12, flex: 1 },
  logoMini: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#c0392b,#e67e22)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Bebas Neue',cursive", fontSize: 22, flexShrink: 0,
  },
  title: { fontWeight: 700, fontSize: 14, margin: 0, color: '#111' },
  sub: { fontSize: 12, color: '#888', margin: '2px 0 0', lineHeight: 1.4 },
  btns: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  installBtn: {
    background: 'linear-gradient(135deg,#c0392b,#e67e22)', color: 'white',
    border: 'none', borderRadius: 10, padding: '8px 16px',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: "'Outfit',sans-serif",
  },
  dismissBtn: {
    background: '#f0f2f5', border: 'none', borderRadius: 8,
    width: 32, height: 32, cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
