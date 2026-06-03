import React, { useState, useEffect } from 'react';
import { db, ADMIN_UID } from '../firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RcomLogo from '../components/RcomLogo';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers]           = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [search, setSearch]         = useState('');
  const [saving, setSaving]         = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    // Charger tous les utilisateurs
    const ru = ref(db, 'users');
    const unsub = onValue(ru, snap => {
      if (!snap.exists()) return;
      const list = Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v }));
      setUsers(list.filter(u => u.uid !== ADMIN_UID));
    });
    // Charger les disciplines
    const rd = ref(db, 'disciplines');
    const unsub2 = onValue(rd, snap => {
      if (!snap.exists()) return;
      const list = Object.entries(snap.val()).map(([fbKey, v]) => ({ fbKey, ...v }));
      setDisciplines(list);
    });
    return () => { unsub(); unsub2(); };
  }, [isAdmin]);

  const grantPermission = async (uid, discId, maxArticles = 20) => {
    setSaving(uid);
    await update(ref(db, `users/${uid}/partnerPermission`), {
      discId,
      maxArticles,
      enabled: true,
      grantedAt: Date.now(),
    });
    setSaving('');
  };

  const updateQuota = async (uid, maxArticles) => {
    setSaving(uid + '_quota');
    await update(ref(db, `users/${uid}/partnerPermission`), { maxArticles: parseInt(maxArticles) || 20 });
    setSaving('');
  };

  const revokePermission = async (uid) => {
    if (!window.confirm('Révoquer la permission de ce partenaire ?')) return;
    setSaving(uid);
    await remove(ref(db, `users/${uid}/partnerPermission`));
    setSaving('');
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const partners  = filtered.filter(u => u.partnerPermission?.enabled);
  const others    = filtered.filter(u => !u.partnerPermission?.enabled);

  const discName = (discId) => {
    const d = disciplines.find(d => d.fbKey === discId || d.id === discId);
    return d ? `${d.icon || '🏪'} ${d.name}` : discId;
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button style={s.backBtn} onClick={() => navigate('/')}>← Accueil</button>
          <RcomLogo size={36} showText textSize={18} />
        </div>
        <span style={s.title}>👑 Panel Admin</span>
      </header>

      <div style={s.body}>
        {/* STATS */}
        <div style={s.statsRow}>
          <div style={s.stat}><span style={s.statN}>{users.length}</span><span style={s.statL}>Comptes</span></div>
          <div style={s.stat}><span style={s.statN}>{partners.length}</span><span style={s.statL}>Partenaires</span></div>
          <div style={s.stat}><span style={s.statN}>{disciplines.length}</span><span style={s.statL}>Univers</span></div>
        </div>

        {/* SEARCH */}
        <div style={s.searchBox}>
          <span>🔍</span>
          <input style={s.searchInp} placeholder="Rechercher un compte..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>

        {/* PARTNERS */}
        {partners.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>🤝 Partenaires actifs ({partners.length})</h2>
            {partners.map(u => (
              <PartnerCard key={u.uid} u={u} disciplines={disciplines} discName={discName}
                saving={saving} updateQuota={updateQuota} revoke={revokePermission} />
            ))}
          </section>
        )}

        {/* ALL USERS */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>👥 Tous les comptes ({others.length})</h2>
          {others.length === 0 && <p style={s.empty}>Aucun compte trouvé.</p>}
          {others.map(u => (
            <UserCard key={u.uid} u={u} disciplines={disciplines} saving={saving} grant={grantPermission} />
          ))}
        </section>
      </div>
    </div>
  );
}

function PartnerCard({ u, discName, saving, updateQuota, revoke }) {
  const [quota, setQuota] = useState(u.partnerPermission?.maxArticles || 20);
  const p = u.partnerPermission;
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.avatar}>{(u.name || u.email || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={s.userName}>{u.name || '(sans nom)'}</p>
          <p style={s.userEmail}>{u.email}</p>
          <span style={s.partnerBadge}>🤝 Partenaire — {discName(p.discId)}</span>
        </div>
      </div>
      <div style={s.quotaRow}>
        <label style={s.quotaLabel}>📦 Quota articles :</label>
        <input
          type="number" min={1} max={9999}
          style={s.quotaInp}
          value={quota}
          onChange={e => setQuota(e.target.value)}
        />
        <button style={s.quotaBtn}
          disabled={saving === u.uid + '_quota'}
          onClick={() => updateQuota(u.uid, quota)}>
          {saving === u.uid + '_quota' ? '...' : '✅ Appliquer'}
        </button>
      </div>
      <button style={s.revokeBtn} disabled={saving === u.uid} onClick={() => revoke(u.uid)}>
        {saving === u.uid ? '...' : '🚫 Révoquer la permission'}
      </button>
    </div>
  );
}

function UserCard({ u, disciplines, saving, grant }) {
  const [selDisc, setSelDisc] = useState('');
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.avatar}>{(u.name || u.email || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={s.userName}>{u.name || '(sans nom)'}</p>
          <p style={s.userEmail}>{u.email}</p>
        </div>
      </div>
      <div style={s.grantRow}>
        <select style={s.select} value={selDisc} onChange={e => setSelDisc(e.target.value)}>
          <option value="">— Choisir un univers —</option>
          {disciplines.map(d => (
            <option key={d.fbKey || d.id} value={d.fbKey || d.id}>
              {d.icon || '🏪'} {d.name}
            </option>
          ))}
        </select>
        <button style={s.grantBtn}
          disabled={!selDisc || saving === u.uid}
          onClick={() => grant(u.uid, selDisc)}>
          {saving === u.uid ? '...' : '🤝 Autoriser'}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight:'100vh', background:'#f0f2f5' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'white', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', position:'sticky', top:0, zIndex:100 },
  backBtn: { background:'#f0f2f5', border:'none', borderRadius:10, padding:'7px 12px', fontSize:13, fontWeight:700, cursor:'pointer', color:'#555', fontFamily:"'Outfit',sans-serif" },
  title: { fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:1, background:'linear-gradient(135deg,#c0392b,#e67e22)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  body: { maxWidth:760, margin:'0 auto', padding:'20px 16px 60px' },
  statsRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 },
  stat: { background:'white', borderRadius:16, padding:'16px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column' },
  statN: { fontSize:32, fontWeight:800, background:'linear-gradient(135deg,#c0392b,#e67e22)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  statL: { fontSize:12, color:'#999', marginTop:2 },
  searchBox: { background:'white', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:20 },
  searchInp: { border:'none', outline:'none', fontSize:15, flex:1, fontFamily:"'Outfit',sans-serif" },
  clearBtn: { background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:18 },
  section: { marginBottom:28 },
  sectionTitle: { fontFamily:"'Bebas Neue',cursive", fontSize:20, letterSpacing:1, marginBottom:12, color:'#1a1a2e' },
  empty: { color:'#aaa', fontSize:14, textAlign:'center', padding:20 },
  card: { background:'white', borderRadius:16, padding:'16px', marginBottom:10, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  cardTop: { display:'flex', alignItems:'center', gap:12, marginBottom:10 },
  avatar: { width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, flexShrink:0 },
  userName: { fontWeight:700, fontSize:15, marginBottom:2 },
  userEmail: { fontSize:12, color:'#888' },
  partnerBadge: { display:'inline-block', background:'#e8f8e8', color:'#27ae60', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:4 },
  quotaRow: { display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' },
  quotaLabel: { fontSize:13, fontWeight:600, color:'#555' },
  quotaInp: { width:70, padding:'7px 10px', border:'2px solid #eee', borderRadius:8, fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif" },
  quotaBtn: { padding:'7px 14px', background:'#e8f8e8', color:'#27ae60', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:"'Outfit',sans-serif" },
  revokeBtn: { width:'100%', padding:'10px', background:'#fdecea', color:'#c0392b', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:"'Outfit',sans-serif" },
  grantRow: { display:'flex', gap:8, flexWrap:'wrap' },
  select: { flex:1, padding:'9px 12px', border:'2px solid #eee', borderRadius:10, fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif", minWidth:180 },
  grantBtn: { padding:'9px 18px', background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' },
};
