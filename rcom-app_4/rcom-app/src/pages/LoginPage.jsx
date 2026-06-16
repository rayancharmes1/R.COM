import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import RcomLogo from '../components/RcomLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // where to redirect after login
  const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/';

  const saveUser = async (user, extra = {}) => {
    await set(ref(db, `users/${user.uid}`), {
      name: user.displayName || extra.name || '',
      email: user.email || '',
      createdAt: Date.now(),
    });
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await saveUser(res.user);
      navigate(returnTo, { replace: true });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        await saveUser(res.user, { name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate(returnTo, { replace: true });
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Email déjà utilisé.',
        'auth/weak-password': 'Mot de passe trop faible (6 car. min).',
        'auth/user-not-found': 'Compte introuvable.',
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
          <RcomLogo size={70} showText textSize={32} />
        </div>
        <p style={s.tagline}>Votre plateforme tout-en-un</p>

        <button onClick={handleGoogle} style={s.googleBtn} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{marginRight:10}}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <div style={s.divider}><span style={s.dividerText}>ou</span></div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {mode === 'register' && (
            <input style={s.input} placeholder="Nom complet" value={name} onChange={e=>setName(e.target.value)} required />
          )}
          <input style={s.input} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required />
          {error && <p style={{ color:'#e74c3c', fontSize:13 }}>{error}</p>}
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <button style={s.switchBtn} onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); }}>
          {mode === 'login' ? "Pas de compte ? S'inscrire gratuitement" : "Déjà un compte ? Se connecter"}
        </button>

        <button style={s.skipBtn} onClick={() => navigate(returnTo, { replace:true })}>
          Continuer sans compte →
        </button>
      </div>
    </div>
  );
}

const s = {
  page:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0f2f5,#dfe3ea)', padding:20 },
  card:{ background:'white', borderRadius:24, padding:'36px 32px', width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.13)', textAlign:'center' },
  tagline:{ color:'#aaa', fontSize:13, marginBottom:24, letterSpacing:1 },
  googleBtn:{ width:'100%', padding:13, border:'2px solid #e8e8e8', borderRadius:12, background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
  divider:{ display:'flex', alignItems:'center', gap:12, margin:'18px 0', color:'#e0e0e0' },
  dividerText:{ color:'#bbb', fontSize:13, background:'white', padding:'0 8px' },
  input:{ padding:'12px 14px', border:'2px solid #eee', borderRadius:11, fontSize:15, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:"'Outfit',sans-serif" },
  submitBtn:{ padding:13, background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
  switchBtn:{ background:'none', border:'none', color:'#e67e22', fontSize:13, marginTop:14, cursor:'pointer', textDecoration:'underline', display:'block', width:'100%' },
  skipBtn:{ background:'none', border:'none', color:'#aaa', fontSize:13, marginTop:8, cursor:'pointer', display:'block', width:'100%' },
};
