import React, { useState, useEffect } from 'react';
import { db, ADMIN_UID } from '../firebase';
import { ref, onValue, update, remove, push } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RcomLogo from '../components/RcomLogo';

function compress(file, max = 600) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers]             = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [search, setSearch]           = useState('');
  const [saving, setSaving]           = useState('');
  const [tab, setTab]                 = useState('users'); // 'users' | 'universes'

  // Nouvel univers
  const [showNewDisc, setShowNewDisc] = useState(false);
  const [nd, setNd] = useState({ name:'', icon:'', color:'#c0392b', description:'', available:false });
  const [ndPhoto, setNdPhoto] = useState('');
  const [ndSaving, setNdSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    const ru = ref(db, 'users');
    const unsub1 = onValue(ru, snap => {
      if (!snap.exists()) { setUsers([]); return; }
      const list = Object.entries(snap.val())
        .map(([uid, v]) => ({ uid, ...v }))
        .filter(u => u.uid !== ADMIN_UID);
      list.sort((a, b) => (b.lastSeen || b.createdAt || 0) - (a.lastSeen || a.createdAt || 0));
      setUsers(list);
    });
    const rd = ref(db, 'disciplines');
    const unsub2 = onValue(rd, snap => {
      if (!snap.exists()) return;
      const list = Object.entries(snap.val()).map(([fbKey, v]) => ({ fbKey, ...v }));
      setDisciplines(list);
    });
    return () => { unsub1(); unsub2(); };
  }, [isAdmin]);

  /* ── Permissions partenaire ── */
  const grantPermission = async (uid, discId, maxArticles, maxUniverses) => {
    setSaving(uid);
    await update(ref(db, `users/${uid}/partnerPermission`), {
      discId,
      maxArticles:  parseInt(maxArticles)  || 20,
      maxUniverses: parseInt(maxUniverses) || 1,
      enabled: true,
      grantedAt: Date.now(),
    });
    setSaving('');
  };

  const updatePermission = async (uid, fields) => {
    setSaving(uid + '_upd');
    await update(ref(db, `users/${uid}/partnerPermission`), fields);
    setSaving('');
  };

  const revokePermission = async (uid) => {
    if (!window.confirm('Révoquer la permission de ce partenaire ?')) return;
    setSaving(uid);
    await remove(ref(db, `users/${uid}/partnerPermission`));
    setSaving('');
  };

  /* ── Univers ── */
  const toggleDisc = async (disc) => {
    await update(ref(db, `disciplines/${disc.fbKey}`), { available: !disc.available });
  };

  const deleteDisc = async (disc) => {
    if (disc.isDefault) { alert('Impossible de supprimer un univers par défaut.'); return; }
    if (!window.confirm(`Supprimer "${disc.name}" ?`)) return;
    await remove(ref(db, `disciplines/${disc.fbKey}`));
  };

  const handleNdPhoto = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const c = await compress(f);
    setNdPhoto(c);
  };

  const addDisc = async () => {
    if (!nd.name.trim()) return;
    setNdSaving(true);
    await push(ref(db, 'disciplines'), { ...nd, photo: ndPhoto, isDefault: false });
    setNd({ name:'', icon:'', color:'#c0392b', description:'', available:false });
    setNdPhoto('');
    setShowNewDisc(false);
    setNdSaving(false);
  };

  const updateDiscPhoto = async (disc, file) => {
    const c = await compress(file);
    await update(ref(db, `disciplines/${disc.fbKey}`), { photo: c });
  };

  /* ── Filtres ── */
  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const partners = filtered.filter(u => u.partnerPermission?.enabled);
  const others   = filtered.filter(u => !u.partnerPermission?.enabled);

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

      {/* STATS */}
      <div style={s.statsRow}>
        <div style={s.stat}><span style={s.statN}>{users.length}</span><span style={s.statL}>Comptes</span></div>
        <div style={s.stat}><span style={s.statN}>{partners.length}</span><span style={s.statL}>Partenaires</span></div>
        <div style={s.stat}><span style={s.statN}>{disciplines.length}</span><span style={s.statL}>Univers</span></div>
      </div>

      {/* TABS */}
      <div style={s.tabRow}>
        <button style={{...s.tabBtn, borderBottom: tab==='users' ? '3px solid #c0392b' : '3px solid transparent', color: tab==='users' ? '#c0392b' : '#888'}} onClick={() => setTab('users')}>
          👥 Comptes ({users.length})
        </button>
        <button style={{...s.tabBtn, borderBottom: tab==='universes' ? '3px solid #c0392b' : '3px solid transparent', color: tab==='universes' ? '#c0392b' : '#888'}} onClick={() => setTab('universes')}>
          🌐 Univers ({disciplines.length})
        </button>
      </div>

      <div style={s.body}>

        {/* ── TAB COMPTES ── */}
        {tab === 'users' && (
          <>
            <div style={s.searchBox}>
              <span>🔍</span>
              <input style={s.searchInp} placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
            </div>

            {partners.length > 0 && (
              <section style={s.section}>
                <h2 style={s.sectionTitle}>🤝 Partenaires actifs ({partners.length})</h2>
                {partners.map(u => (
                  <PartnerCard key={u.uid} u={u} disciplines={disciplines} discName={discName}
                    saving={saving} updatePermission={updatePermission} revoke={revokePermission} />
                ))}
              </section>
            )}

            <section style={s.section}>
              <h2 style={s.sectionTitle}>👥 Comptes sans permission ({others.length})</h2>
              {others.length === 0 && <p style={s.empty}>Aucun compte trouvé. Les utilisateurs apparaissent ici dès leur prochaine connexion.</p>}
              {others.map(u => (
                <UserCard key={u.uid} u={u} disciplines={disciplines} saving={saving} grant={grantPermission} />
              ))}
            </section>

            {users.length === 0 && (
              <div style={s.emptyBig}>
                <div style={{fontSize:52}}>👥</div>
                <p style={{fontWeight:700, fontSize:16, marginTop:12}}>Aucun compte enregistré pour l'instant</p>
                <p style={{color:'#aaa', fontSize:13, marginTop:6, lineHeight:1.6}}>
                  Les comptes apparaissent ici dès que les utilisateurs se connectent.<br/>
                  Les anciens comptes seront visibles à leur prochaine connexion.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── TAB UNIVERS ── */}
        {tab === 'universes' && (
          <>
            <div style={s.univGrid}>
              {disciplines.map(d => (
                <div key={d.fbKey} style={s.univCard}>
                  {/* Photo de l'univers */}
                  <div style={s.univImgW}>
                    {d.photo
                      ? <img src={d.photo} alt={d.name} style={s.univImg} />
                      : <div style={{...s.univImgPh, background: (d.color||'#999')+'22', color: d.color||'#999'}}>
                          {d.icon || '🏪'}
                        </div>
                    }
                    <label style={s.univImgEdit}>
                      📷
                      <input type="file" accept="image/*" style={{display:'none'}}
                        onChange={e => e.target.files[0] && updateDiscPhoto(d, e.target.files[0])} />
                    </label>
                  </div>
                  <div style={s.univBody}>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}>
                      <span style={{fontSize:20}}>{d.icon||'🏪'}</span>
                      <span style={{fontWeight:700, fontSize:15}}>{d.name}</span>
                      <span style={{...s.availBadge, background: d.available ? '#27ae60' : '#bbb'}}>
                        {d.available ? '✅ Actif' : '🔒 Inactif'}
                      </span>
                    </div>
                    {d.description && <p style={{fontSize:12, color:'#888', marginBottom:8}}>{d.description}</p>}
                    <div style={{display:'flex', gap:8}}>
                      <button style={{...s.univBtn, background: d.available?'#fdecea':'#e8f8e8', color: d.available?'#c0392b':'#27ae60'}}
                        onClick={() => toggleDisc(d)}>
                        {d.available ? '🔴 Désactiver' : '🟢 Activer'}
                      </button>
                      {!d.isDefault && (
                        <button style={{...s.univBtn, background:'#fdecea', color:'#c0392b'}}
                          onClick={() => deleteDisc(d)}>🗑️ Supprimer</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Ajouter un univers */}
              <div style={s.addUnivCard} onClick={() => setShowNewDisc(true)}>
                <div style={{fontSize:36, color:'#ddd'}}>＋</div>
                <p style={{color:'#ccc', fontSize:13, marginTop:6}}>Nouvel univers</p>
              </div>
            </div>

            {/* Modal Nouvel Univers */}
            {showNewDisc && (
              <div style={s.overlay}>
                <div style={s.modal}>
                  <h2 style={s.modalT}>Nouvel Univers</h2>

                  {/* Photo */}
                  <div style={s.photoZone}>
                    {ndPhoto
                      ? <img src={ndPhoto} alt="" style={s.photoPreview} />
                      : <div style={s.photoEmpty}>
                          <span style={{fontSize:32}}>🖼️</span>
                          <p style={{fontSize:12,color:'#aaa',marginTop:4}}>Photo de l'univers</p>
                        </div>
                    }
                    <label style={s.photoBtn}>
                      📷 {ndPhoto ? 'Changer' : 'Ajouter une photo'}
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={handleNdPhoto} />
                    </label>
                  </div>

                  <input style={s.inp} placeholder="Nom * (ex: R.COM Sport)" value={nd.name} onChange={e=>setNd({...nd,name:e.target.value})}/>
                  <input style={s.inp} placeholder="Icône emoji (ex: ⚽)" value={nd.icon} onChange={e=>setNd({...nd,icon:e.target.value})}/>
                  <input style={s.inp} placeholder="Description courte" value={nd.description} onChange={e=>setNd({...nd,description:e.target.value})}/>
                  <label style={{fontSize:13,color:'#666',marginBottom:6,display:'block'}}>Couleur</label>
                  <input type="color" value={nd.color} onChange={e=>setNd({...nd,color:e.target.value})}
                    style={{width:56,height:36,border:'none',cursor:'pointer',marginBottom:16,borderRadius:8}}/>
                  <div style={{display:'flex', gap:10}}>
                    <button style={s.saveBtn} onClick={addDisc} disabled={ndSaving}>
                      {ndSaving ? '...' : 'Créer'}
                    </button>
                    <button style={s.cancelBtn} onClick={() => setShowNewDisc(false)}>Annuler</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Carte partenaire actif ── */
function PartnerCard({ u, disciplines, discName, saving, updatePermission, revoke }) {
  const p = u.partnerPermission || {};
  const [articles,  setArticles]  = useState(p.maxArticles  || 20);
  const [universes, setUniverses] = useState(p.maxUniverses || 1);
  const [discId,    setDiscId]    = useState(p.discId || '');

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.avatar}>{(u.name||u.email||'?')[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <p style={s.userName}>{u.name || '(sans nom)'}</p>
          <p style={s.userEmail}>{u.email}</p>
          <span style={s.partnerBadge}>🤝 {discName(p.discId)}</span>
        </div>
      </div>

      {/* Univers assigné */}
      <div style={s.fieldRow}>
        <label style={s.fieldLabel}>🌐 Univers assigné</label>
        <select style={s.select} value={discId} onChange={e => setDiscId(e.target.value)}>
          <option value="">— Choisir —</option>
          {disciplines.map(d => (
            <option key={d.fbKey||d.id} value={d.fbKey||d.id}>{d.icon||'🏪'} {d.name}</option>
          ))}
        </select>
      </div>

      {/* Quota articles */}
      <div style={s.fieldRow}>
        <label style={s.fieldLabel}>📦 Max articles</label>
        <input type="number" min={1} max={9999} style={s.numInp} value={articles} onChange={e => setArticles(e.target.value)} />
      </div>

      {/* Quota univers */}
      <div style={s.fieldRow}>
        <label style={s.fieldLabel}>🌐 Max univers</label>
        <input type="number" min={1} max={99} style={s.numInp} value={universes} onChange={e => setUniverses(e.target.value)} />
      </div>

      <div style={{display:'flex', gap:8, marginTop:10}}>
        <button style={s.applyBtn}
          disabled={saving === u.uid + '_upd'}
          onClick={() => updatePermission(u.uid, { discId, maxArticles: parseInt(articles)||20, maxUniverses: parseInt(universes)||1 })}>
          {saving === u.uid + '_upd' ? '...' : '✅ Enregistrer'}
        </button>
        <button style={s.revokeBtn} disabled={saving === u.uid} onClick={() => revoke(u.uid)}>
          {saving === u.uid ? '...' : '🚫 Révoquer'}
        </button>
      </div>
    </div>
  );
}

/* ── Carte utilisateur sans permission ── */
function UserCard({ u, disciplines, saving, grant }) {
  const [selDisc,    setSelDisc]    = useState('');
  const [maxArt,     setMaxArt]     = useState(20);
  const [maxUniv,    setMaxUniv]    = useState(1);
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.avatar}>{(u.name||u.email||'?')[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <p style={s.userName}>{u.name || '(sans nom)'}</p>
          <p style={s.userEmail}>{u.email}</p>
          <p style={{fontSize:11, color:'#bbb', marginTop:2}}>
            Vu le {u.lastSeen ? new Date(u.lastSeen).toLocaleDateString('fr-FR') : '?'}
          </p>
        </div>
        <button style={s.configBtn} onClick={() => setShowConfig(!showConfig)}>
          {showConfig ? '▲' : '🤝 Autoriser'}
        </button>
      </div>

      {showConfig && (
        <div style={{marginTop:12, borderTop:'1px solid #f0f0f0', paddingTop:12}}>
          <div style={s.fieldRow}>
            <label style={s.fieldLabel}>🌐 Univers</label>
            <select style={s.select} value={selDisc} onChange={e => setSelDisc(e.target.value)}>
              <option value="">— Choisir —</option>
              {disciplines.map(d => (
                <option key={d.fbKey||d.id} value={d.fbKey||d.id}>{d.icon||'🏪'} {d.name}</option>
              ))}
            </select>
          </div>
          <div style={s.fieldRow}>
            <label style={s.fieldLabel}>📦 Max articles</label>
            <input type="number" min={1} max={9999} style={s.numInp} value={maxArt} onChange={e => setMaxArt(e.target.value)} />
          </div>
          <div style={s.fieldRow}>
            <label style={s.fieldLabel}>🌐 Max univers</label>
            <input type="number" min={1} max={99} style={s.numInp} value={maxUniv} onChange={e => setMaxUniv(e.target.value)} />
          </div>
          <button style={{...s.applyBtn, marginTop:8, width:'100%'}}
            disabled={!selDisc || saving === u.uid}
            onClick={() => grant(u.uid, selDisc, maxArt, maxUniv)}>
            {saving === u.uid ? '...' : '🤝 Accorder la permission'}
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{ minHeight:'100vh', background:'#f0f2f5' },
  header:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'white', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', position:'sticky', top:0, zIndex:100 },
  backBtn:{ background:'#f0f2f5', border:'none', borderRadius:10, padding:'7px 12px', fontSize:13, fontWeight:700, cursor:'pointer', color:'#555', fontFamily:"'Outfit',sans-serif" },
  title:{ fontFamily:"'Bebas Neue',cursive", fontSize:22, letterSpacing:1, background:'linear-gradient(135deg,#c0392b,#e67e22)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  statsRow:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, padding:'16px 16px 0', maxWidth:760, margin:'0 auto' },
  stat:{ background:'white', borderRadius:16, padding:'14px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column' },
  statN:{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg,#c0392b,#e67e22)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  statL:{ fontSize:11, color:'#999', marginTop:2 },
  tabRow:{ display:'flex', background:'white', borderBottom:'1px solid #eee', marginTop:14 },
  tabBtn:{ flex:1, padding:'12px 0', background:'none', border:'none', cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif", transition:'all 0.2s' },
  body:{ maxWidth:760, margin:'0 auto', padding:'16px 16px 60px' },
  searchBox:{ background:'white', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:16 },
  searchInp:{ border:'none', outline:'none', fontSize:15, flex:1, fontFamily:"'Outfit',sans-serif" },
  clearBtn:{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:18 },
  section:{ marginBottom:24 },
  sectionTitle:{ fontFamily:"'Bebas Neue',cursive", fontSize:19, letterSpacing:1, marginBottom:10, color:'#1a1a2e' },
  empty:{ color:'#aaa', fontSize:13, padding:'12px 0', lineHeight:1.6 },
  emptyBig:{ textAlign:'center', padding:'48px 20px', background:'white', borderRadius:18, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  card:{ background:'white', borderRadius:16, padding:'14px', marginBottom:10, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  cardTop:{ display:'flex', alignItems:'center', gap:12 },
  avatar:{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, flexShrink:0 },
  userName:{ fontWeight:700, fontSize:14, marginBottom:1 },
  userEmail:{ fontSize:12, color:'#888' },
  partnerBadge:{ display:'inline-block', background:'#e8f8e8', color:'#27ae60', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:4 },
  fieldRow:{ display:'flex', alignItems:'center', gap:10, marginTop:10, flexWrap:'wrap' },
  fieldLabel:{ fontSize:13, fontWeight:600, color:'#555', minWidth:110 },
  numInp:{ width:80, padding:'7px 10px', border:'2px solid #eee', borderRadius:8, fontSize:14, outline:'none', fontFamily:"'Outfit',sans-serif" },
  select:{ flex:1, padding:'8px 12px', border:'2px solid #eee', borderRadius:10, fontSize:13, outline:'none', fontFamily:"'Outfit',sans-serif", minWidth:160 },
  applyBtn:{ flex:1, padding:'9px 14px', background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:"'Outfit',sans-serif" },
  revokeBtn:{ padding:'9px 14px', background:'#fdecea', color:'#c0392b', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:"'Outfit',sans-serif" },
  configBtn:{ padding:'7px 12px', background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:12, fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap' },
  // Univers tab
  univGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 },
  univCard:{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' },
  univImgW:{ position:'relative', height:120, overflow:'hidden', background:'#f8f8f8' },
  univImg:{ width:'100%', height:'100%', objectFit:'cover' },
  univImgPh:{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 },
  univImgEdit:{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'white', borderRadius:8, padding:'4px 10px', fontSize:12, cursor:'pointer', fontWeight:600 },
  univBody:{ padding:'12px 14px 14px' },
  availBadge:{ color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, marginLeft:'auto' },
  univBtn:{ border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
  addUnivCard:{ border:'2px dashed #ddd', borderRadius:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:160, cursor:'pointer', background:'transparent' },
  // Modal
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 },
  modal:{ background:'white', borderRadius:22, padding:28, width:'90%', maxWidth:420, maxHeight:'90vh', overflowY:'auto' },
  modalT:{ fontFamily:"'Bebas Neue',cursive", fontSize:24, letterSpacing:1, marginBottom:16 },
  photoZone:{ marginBottom:14 },
  photoPreview:{ width:'100%', height:120, objectFit:'cover', borderRadius:12, marginBottom:8 },
  photoEmpty:{ width:'100%', height:100, borderRadius:12, background:'#f8f8f8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginBottom:8 },
  photoBtn:{ display:'inline-block', padding:'8px 16px', background:'#f0f2f5', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
  inp:{ display:'block', width:'100%', padding:'11px 14px', border:'2px solid #eee', borderRadius:10, fontSize:14, marginBottom:10, outline:'none', fontFamily:"'Outfit',sans-serif", boxSizing:'border-box' },
  saveBtn:{ flex:1, padding:12, background:'linear-gradient(135deg,#c0392b,#e67e22)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
  cancelBtn:{ flex:1, padding:12, background:'#f0f2f5', color:'#666', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" },
};
