import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RcomLogo from '../components/RcomLogo';

const DEFAULTS = [
  { id:'market', name:'R.COM Market', icon:'🛒', color:'#c0392b', available:true,  description:'Marketplace — électronique, mode, maison...', isDefault:true },
  { id:'tech',   name:'R.COM Tech',   icon:'💻', color:'#2980b9', available:false, description:'Informatique, gadgets & services tech',     isDefault:true },
  { id:'delice', name:'R.COM Délice', icon:'🍽️', color:'#e67e22', available:false, description:'Restauration, traiteur & livraison repas',   isDefault:true },
];

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState(DEFAULTS);
  const [showAdd, setShowAdd] = useState(false);
  const [nd, setNd] = useState({ name:'', icon:'', color:'#c0392b', description:'' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = ref(db, 'disciplines');
    return onValue(r, snap => {
      if (!snap.exists()) return;
      const data = snap.val();
      const fbMap = {};
      const extras = [];
      Object.entries(data).forEach(([fbKey, v]) => {
        if (v.isDefault && v.id) fbMap[v.id] = { fbKey, ...v };
        else extras.push({ fbKey, ...v });
      });
      setDisciplines([...DEFAULTS.map(d => ({ ...d, ...(fbMap[d.id]||{}) })), ...extras]);
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const r = ref(db, 'disciplines');
    onValue(r, snap => {
      if (!snap.exists()) DEFAULTS.forEach(d => push(r, d));
    }, { onlyOnce: true });
  }, [isAdmin]);

  const toggle = async (disc) => {
    setSaving(true);
    if (disc.fbKey) await update(ref(db, `disciplines/${disc.fbKey}`), { available: !disc.available });
    else await push(ref(db, 'disciplines'), { ...disc, isDefault:true, available:!disc.available });
    setSaving(false);
  };

  const addDisc = async () => {
    if (!nd.name.trim()) return;
    setSaving(true);
    await push(ref(db, 'disciplines'), { ...nd, available:false, isDefault:false });
    setNd({ name:'', icon:'', color:'#c0392b', description:'' });
    setShowAdd(false);
    setSaving(false);
  };

  const delDisc = async (disc) => {
    if (disc.isDefault) { alert('Impossible de supprimer une discipline par défaut.'); return; }
    if (!window.confirm(`Supprimer "${disc.name}" ?`)) return;
    if (disc.fbKey) await remove(ref(db, `disciplines/${disc.fbKey}`));
  };

  const go = (disc) => {
    if (disc.available) navigate(`/shop/${disc.fbKey || disc.id}`);
  };

  return (
    <div style={s.page} onClick={() => menuOpen && setMenuOpen(false)}>
      {/* HEADER */}
      <header style={s.header}>
        <RcomLogo size={44} showText textSize={22} />
        <div style={{ position:'relative' }}>
          {user ? (
            <>
              <button style={s.avatarBtn} onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                {user.photoURL
                  ? <img src={user.photoURL} style={s.avatar} alt="" />
                  : <div style={s.avatarFb}>{(user.displayName||user.email||'U')[0].toUpperCase()}</div>
                }
              </button>
              {menuOpen && (
                <div style={s.dd} onClick={e => e.stopPropagation()}>
                  <p style={s.ddName}>{user.displayName||user.email}</p>
                  {isAdmin && <span style={s.adminTag}>⭐ Admin</span>}
                  <hr style={s.hr}/>
                  <button style={s.ddBtn} onClick={() => signOut(auth)}>🚪 Déconnexion</button>
                </div>
              )}
            </>
          ) : (
            <button style={s.loginBtn} onClick={() => navigate('/login')}>Connexion / Inscription</button>
          )}
        </div>
      </header>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.heroT}>Bienvenue sur <span style={s.heroS}>R.COM</span></h1>
        <p style={s.heroSub}>Choisissez votre univers pour découvrir nos offres</p>
        {isAdmin && <p style={s.adminHint}>👑 Mode admin — tu peux activer / désactiver chaque univers</p>}
      </div>

      {/* UNIVERSES GRID */}
      <div style={s.grid}>
        {disciplines.map((d, i) => (
          <div key={d.fbKey||d.id||i} style={{ ...s.card, opacity: d.available ? 1 : 0.6 }}>
            <div style={{ cursor: d.available ? 'pointer' : 'not-allowed', flex:1 }} onClick={() => go(d)}>
              <div style={{ ...s.icon, background:(d.color||'#999')+'22', color:d.color||'#999' }}>
                <span style={{ fontSize:32 }}>{d.icon||'🏪'}</span>
              </div>
              <h3 style={s.cardName}>{d.name}</h3>
              <p style={s.cardDesc}>{d.description}</p>
              <span style={{ ...s.badge, background: d.available ? (d.color||'#27ae60') : '#bbb' }}>
                {d.available ? '✅ Disponible' : '🔒 Bientôt'}
              </span>
            </div>
            {isAdmin && (
              <div style={s.adminRow}>
                <button style={{ ...s.toggleBtn, background: d.available ? '#fdecea' : '#e8f8e8', color: d.available ? '#c0392b' : '#27ae60' }}
                  onClick={() => toggle(d)} disabled={saving}>
                  {d.available ? '🔴 Désactiver' : '🟢 Activer'}
                </button>
                {!d.isDefault && (
                  <button style={s.delBtn} onClick={() => delDisc(d)}>🗑️</button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ADD NEW UNIVERSE (admin) */}
        {isAdmin && (
          <div style={s.addCard} onClick={() => setShowAdd(true)}>
            <div style={{ fontSize:40, color:'#ddd' }}>＋</div>
            <p style={{ color:'#ccc', fontSize:14, marginTop:6, fontWeight:600 }}>Nouvel univers</p>
          </div>
        )}
      </div>

      {/* ADD DISCIPLINE MODAL */}
      {isAdmin && showAdd && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalT}>Nouvel Univers</h2>
            <input style={s.inp} placeholder="Nom * (ex: R.COM Sport)" value={nd.name} onChange={e=>setNd({...nd,name:e.target.value})}/>
            <input style={s.inp} placeholder="Icône emoji (ex: ⚽)" value={nd.icon} onChange={e=>setNd({...nd,icon:e.target.value})}/>
            <input style={s.inp} placeholder="Description courte" value={nd.description} onChange={e=>setNd({...nd,description:e.target.value})}/>
            <label style={{ fontSize:13, color:'#666', marginBottom:6, display:'block' }}>Couleur</label>
            <input type="color" value={nd.color} onChange={e=>setNd({...nd,color:e.target.value})}
              style={{ width:56, height:36, border:'none', cursor:'pointer', marginBottom:16, borderRadius:8 }}/>
            <p style={{ fontSize:12, color:'#aaa', marginBottom:14 }}>Sera désactivé par défaut. Tu pourras l'activer depuis l'accueil.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button style={s.saveBtn} onClick={addDisc} disabled={saving}>Ajouter</button>
              <button style={s.cancelBtn} onClick={() => setShowAdd(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{ minHeight:'100vh', background:'#f0f2f5' },
  header:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', background:'white', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', position:'sticky', top:0, zIndex:100 },
  avatarBtn:{ background:'none', border:'none', cursor:'pointer', padding:0 },
  avatar:{ width:38, height:38, borderRadius:'50%', objectFit:'cover' },
  avatarFb:{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16 },
  dd:{ position:'absolute', right:0, top:48, background:'white', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', padding:'14px 18px', minWidth:210, zIndex:200 },
  ddName:{ fontSize:14, fontWeight:600, marginBottom:6, wordBreak:'break-all' },
  adminTag:{ background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, display:'inline-block' },
  hr:{ border:'none', borderTop:'1px solid #eee', margin:'10px 0' },
  ddBtn:{ background:'none', border:'none', color:'#e74c3c', cursor:'pointer', fontSize:14, padding:'4px 0', width:'100%', textAlign:'left' },
  loginBtn:{ background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:20, padding:'9px 18px', fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:"'Outfit',sans-serif" },
  hero:{ textAlign:'center', padding:'48px 24px 24px' },
  heroT:{ fontFamily:"'Bebas Neue',cursive", fontSize:52, letterSpacing:2, color:'#1a1a2e', margin:0 },
  heroS:{ background:'linear-gradient(135deg,#c0392b,#e67e22)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  heroSub:{ color:'#888', fontSize:16, marginTop:10 },
  adminHint:{ marginTop:14, fontSize:13, color:'#e67e22', fontWeight:600, background:'#fff8f0', display:'inline-block', padding:'6px 16px', borderRadius:20 },
  grid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:22, padding:'20px 24px 48px', maxWidth:1100, margin:'0 auto' },
  card:{ background:'white', borderRadius:22, padding:'26px 22px 16px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', transition:'transform 0.2s' },
  icon:{ width:72, height:72, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  cardName:{ fontFamily:"'Bebas Neue',cursive", fontSize:24, letterSpacing:1, marginBottom:6 },
  cardDesc:{ color:'#888', fontSize:13, lineHeight:1.5, marginBottom:16 },
  badge:{ color:'white', fontSize:12, padding:'5px 14px', borderRadius:20, fontWeight:600, display:'inline-block' },
  adminRow:{ display:'flex', gap:8, marginTop:14, justifyContent:'center' },
  toggleBtn:{ border:'none', borderRadius:10, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif", flex:1 },
  delBtn:{ background:'#fdecea', border:'none', borderRadius:10, padding:'8px 10px', cursor:'pointer', fontSize:15 },
  addCard:{ border:'2px dashed #ddd', borderRadius:22, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:220, background:'transparent', transition:'background 0.2s' },
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 },
  modal:{ background:'white', borderRadius:22, padding:32, width:'90%', maxWidth:400 },
  modalT:{ fontFamily:"'Bebas Neue',cursive", fontSize:26, letterSpacing:1, marginBottom:18 },
  inp:{ display:'block', width:'100%', padding:'12px 14px', border:'2px solid #eee', borderRadius:10, fontSize:14, marginBottom:12, outline:'none', fontFamily:"'Outfit',sans-serif", boxSizing:'border-box' },
  saveBtn:{ flex:1, padding:12, background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
  cancelBtn:{ flex:1, padding:12, background:'#f0f2f5', color:'#666', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
};
