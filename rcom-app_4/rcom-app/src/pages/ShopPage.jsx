import React, { useState, useEffect, useRef } from 'react';
import { db, WHATSAPP } from '../firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import RcomLogo from '../components/RcomLogo';

const MAX_PHOTOS = 4;

function compress(file, max=500) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w=img.width, h=img.height;
        if(w>max||h>max){ if(w>h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;} }
        c.width=w; c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        res(c.toDataURL('image/jpeg',0.78));
      };
      img.src=e.target.result;
    };
    r.readAsDataURL(file);
  });
}

function Countdown({ endTs }) {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = endTs - Date.now();
      if(d<=0){setT('Terminé');return;}
      const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000);
      setT(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[endTs]);
  return <span style={{fontFamily:'monospace',fontWeight:800,fontSize:14,color:'#fff',background:'rgba(0,0,0,0.35)',padding:'2px 8px',borderRadius:6,letterSpacing:1}}>{t}</span>;
}

// ── Category picker with suggestions ──
function CategoryPicker({ value, onChange, existingCategories }) {
  const [open, setOpen] = useState(false);
  const ref2 = useRef(null);

  useEffect(() => {
    const handler = (e) => { if(ref2.current && !ref2.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = existingCategories.filter(c => c.toLowerCase().includes(value.toLowerCase()) && c !== value);

  return (
    <div style={{position:'relative',marginBottom:10}} ref={ref2}>
      <input
        style={fS.inp}
        placeholder="Catégorie (ex: Électronique)"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && existingCategories.length > 0 && (
        <div style={fS.catDropdown}>
          {existingCategories.length > 0 && value === '' && (
            <p style={fS.catDropHint}>Catégories existantes :</p>
          )}
          {(value === '' ? existingCategories : filtered).map(c => (
            <button key={c} style={fS.catOption} onClick={() => { onChange(c); setOpen(false); }}>
              {c}
            </button>
          ))}
          {value && !existingCategories.includes(value) && (
            <button style={{...fS.catOption, color:'#e67e22', fontWeight:700}} onClick={() => setOpen(false)}>
              ＋ Créer "{value}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const fS = {
  inp:{display:'block',width:'100%',padding:'11px 14px',border:'2px solid #eee',borderRadius:10,fontSize:14,outline:'none',fontFamily:"'Outfit',sans-serif",boxSizing:'border-box'},
  catDropdown:{position:'absolute',top:'100%',left:0,right:0,background:'white',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.15)',zIndex:500,maxHeight:200,overflowY:'auto',border:'1px solid #eee'},
  catDropHint:{fontSize:11,color:'#aaa',padding:'8px 12px 4px',fontWeight:600,textTransform:'uppercase',letterSpacing:1},
  catOption:{display:'block',width:'100%',padding:'10px 14px',background:'none',border:'none',textAlign:'left',fontSize:14,cursor:'pointer',fontFamily:"'Outfit',sans-serif",borderBottom:'1px solid #f5f5f5'},
};

// ── About / Settings Modal ──
function SettingsModal({ onClose, color }) {
  const [tab, setTab] = useState('about');
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{...s.detailModal, maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,letterSpacing:1,marginBottom:16}}>⚙️ Paramètres</h2>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:'2px solid #eee'}}>
          {[{k:'about',l:'À propos'},{k:'how',l:'Comment ça marche'}].map(t=>(
            <button key={t.k} style={{flex:1,padding:'10px',background:'none',border:'none',cursor:'pointer',fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:tab===t.k?700:500,color:tab===t.k?color:'#888',borderBottom:tab===t.k?`3px solid ${color}`:'3px solid transparent',marginBottom:-2}}
              onClick={()=>setTab(t.k)}>{t.l}</button>
          ))}
        </div>

        {tab==='about' && (
          <div style={{fontSize:14,lineHeight:1.8,color:'#444'}}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <RcomLogo size={60} showText textSize={28}/>
            </div>
            <h3 style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:1,color,marginBottom:8}}>R.COM Market — La boutique du Groupe R.COM</h3>
            <p style={{marginBottom:12}}>
              <strong>R.COM Market</strong> est la marketplace officielle du Groupe R.COM, votre plateforme de confiance pour l'achat en ligne en Côte d'Ivoire. Nous proposons une large gamme de produits soigneusement sélectionnés : électronique, accessoires, mode, maison et bien plus encore.
            </p>
            <p style={{marginBottom:12}}>
              Notre engagement : vous offrir les <strong>meilleurs prix</strong>, une <strong>livraison rapide</strong> et un <strong>service client réactif</strong>. Chaque article mis en vente est vérifié par notre équipe avant publication.
            </p>
            <p style={{marginBottom:12}}>
              R.COM organise régulièrement des <strong>ventes à l'état</strong> — des articles neufs ou légèrement utilisés proposés à des prix imbattables. Restez connectés pour ne manquer aucune opportunité !
            </p>
            <p style={{marginBottom:0,color:'#888',fontSize:13}}>
              📍 Côte d'Ivoire &nbsp;|&nbsp; 📞 +225 01 60 67 29 66 &nbsp;|&nbsp; ✉️ rayan.compagnie@gmail.com
            </p>
          </div>
        )}

        {tab==='how' && (
          <div style={{fontSize:14,lineHeight:1.8,color:'#444'}}>
            <h3 style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:1,color,marginBottom:12}}>Comment passer une commande ?</h3>

            <div style={sM.step}>
              <div style={{...sM.stepNum,background:color}}>1</div>
              <div><strong>Choisissez vos articles</strong><br/>Parcourez la boutique, ajoutez vos articles au panier.</div>
            </div>
            <div style={sM.step}>
              <div style={{...sM.stepNum,background:color}}>2</div>
              <div><strong>Envoyez votre commande</strong><br/>Cliquez sur "Commander via WhatsApp". Votre commande détaillée est envoyée automatiquement à notre équipe.</div>
            </div>
            <div style={sM.step}>
              <div style={{...sM.stepNum,background:color}}>3</div>
              <div><strong>Confirmation & Dépôt</strong><br/>Un agent vous répond rapidement. Pour confirmer votre commande, vous payez <strong>1/4 du montant total</strong> de l'article comme acompte. Une fois ce dépôt effectué, l'article est <strong>réservé à votre nom</strong>.</div>
            </div>
            <div style={sM.step}>
              <div style={{...sM.stepNum,background:color}}>4</div>
              <div><strong>Livraison</strong><br/>La livraison est effectuée selon la disponibilité de l'article. Notre équipe vous tient informé à chaque étape.</div>
            </div>

            <div style={{background:'#fff8f0',borderRadius:12,padding:'14px 16px',marginTop:16,border:`1px solid ${color}33`}}>
              <p style={{fontWeight:700,color,marginBottom:6}}>⚠️ Important — Délai de retrait</p>
              <p style={{margin:0,fontSize:13}}>
                Une fois votre dépôt effectué, l'article vous est réservé. <strong>Au-delà de 2 semaines sans suite de votre part</strong>, nous nous réservons le droit de vendre l'article. Dans ce cas, <strong>20% du prix de l'article sera retenu comme frais</strong> et le reste vous sera remboursé.
              </p>
            </div>

            <div style={{background:'#f0f8ff',borderRadius:12,padding:'14px 16px',marginTop:12,border:'1px solid #2980b933'}}>
              <p style={{fontWeight:700,color:'#2980b9',marginBottom:6}}>💡 Ventes à l'état</p>
              <p style={{margin:0,fontSize:13}}>
                R.COM organise régulièrement des ventes d'articles à l'état (neufs ou très peu utilisés) à des prix réduits. Ces offres sont limitées — profitez-en rapidement !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const sM = {
  step:{display:'flex',gap:12,alignItems:'flex-start',marginBottom:14},
  stepNum:{width:28,height:28,borderRadius:'50%',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0,marginTop:2},
};

const DISC_DEFAULTS = {
  market: { name:'R.COM Market', icon:'🛒', color:'#c0392b' },
  tech:   { name:'R.COM Tech',   icon:'💻', color:'#2980b9' },
  delice: { name:'R.COM Délice', icon:'🍽️', color:'#e67e22' },
};

export default function ShopPage() {
  const { discId } = useParams();
  const { user, isAdmin } = useAuth();
  const { getCart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const cart = getCart(discId);

  const [disc, setDisc] = useState(DISC_DEFAULTS[discId] || null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [carIdx, setCarIdx] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showLoginWall, setShowLoginWall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [orderOk, setOrderOk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gridCols, setGridCols] = useState(2);

  // ── FAVORITES ──
  const [favIds, setFavIds] = useState({});

  useEffect(() => {
    if (!user) { setFavIds({}); return; }
    const r = ref(db, `users/${user.uid}/favs/${discId}`);
    return onValue(r, snap => { setFavIds(snap.exists() ? snap.val() : {}); });
  }, [user, discId]);

  const isFav = (id) => !!favIds[id];

  const toggleFav = async (art, e) => {
    e.stopPropagation();
    if (!user) { setShowLoginWall(true); return; }
    if (isFav(art.id)) {
      await remove(ref(db, `users/${user.uid}/favs/${discId}/${art.id}`));
    } else {
      await update(ref(db, `users/${user.uid}/favs/${discId}`), {
        [art.id]: { id: art.id, name: art.name, price: art.price, imageUrl: art.imageUrl||'', savedAt: Date.now() }
      });
    }
  };

  const favArticles = articles.filter(a => isFav(a.id));

  // Admin form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'',price:'',oldPrice:'',description:'',category:'',stock:'',returnDays:'',isFlash:false,flashEnd:'',isPromo:false });
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if(DISC_DEFAULTS[discId]){ setDisc(DISC_DEFAULTS[discId]); return; }
    const r = ref(db, `disciplines/${discId}`);
    return onValue(r, snap => { if(snap.exists()) setDisc(snap.val()); });
  }, [discId]);

  useEffect(() => {
    setLoading(true);
    let oldArts = [], newArts = [], loaded = 0;
    const total = discId === 'market' ? 2 : 1;
    const merge = () => {
      loaded++;
      const combined = [...oldArts, ...newArts];
      const seen = new Set();
      const deduped = combined.filter(a => { if(seen.has(a.id)) return false; seen.add(a.id); return true; });
      // Shuffle randomly each load
      for (let i = deduped.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
      }
      setArticles(deduped);
      if(loaded >= total) setLoading(false);
    };
    let unsubOld = ()=>{};
    if(discId === 'market') {
      unsubOld = onValue(ref(db,'articles'), snap => {
        oldArts = snap.exists() ? Object.entries(snap.val()).map(([id,v])=>({id,...v})) : [];
        merge();
      });
    }
    const unsubNew = onValue(ref(db,`shop/${discId}/articles`), snap => {
      newArts = snap.exists() ? Object.entries(snap.val()).map(([id,v])=>({id,...v})) : [];
      merge();
    });
    return () => { unsubOld(); unsubNew(); };
  }, [discId]);

  useEffect(() => { setCarIdx(0); }, [selected]);

  const existingCategories = Array.from(new Set(articles.map(a=>a.category).filter(Boolean)));
  const flashArts = articles.filter(a => a.isFlash && a.stock!==0);
  const promoArts = articles.filter(a => a.isPromo && !a.isFlash && a.stock!==0);
  const categories = ['Tous', ...existingCategories];

  const baseList = activeTab==='flash' ? flashArts : activeTab==='promo' ? promoArts : activeTab==='favs' ? favArticles : articles;
  const filtered = baseList.filter(a => {
    const ms = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase());
    const mc = activeCategory==='Tous' || a.category===activeCategory;
    return ms && mc;
  });

  const getDiscount = (a) => (!a.oldPrice||a.oldPrice<=a.price)?null:Math.round((1-a.price/a.oldPrice)*100);
  const getImgs = (a) => a.images?.length?a.images:(a.imageUrl?[a.imageUrl]:[]);
  const getQty = (id) => { const i=cart.find(i=>i.article.id===id); return i?i.quantity:0; };

  const doAdd = (art) => { if(!user){setShowLoginWall(true);return;} addToCart(discId,art); };

  const handleOrder = () => {
    if(!user){setShowCart(false);setShowLoginWall(true);return;}
    const lines = cart.map(i=>`• ${i.article.name} x${i.quantity} = ${(i.article.price*i.quantity).toLocaleString()} FCFA`).join('\n');
    const msg = `Bonjour R.COM 👋\n\nCommande *${disc?.name||'R.COM'}* :\n\n${lines}\n\n💰 *TOTAL : ${totalPrice(discId).toLocaleString()} FCFA*\n\nClient : ${user.displayName||user.email}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank');
    clearCart(discId); setShowCart(false);
    setOrderOk(true); setTimeout(()=>setOrderOk(false),4000);
  };

  const handleImg = async (e) => {
    const files = Array.from(e.target.files).slice(0,MAX_PHOTOS-previews.length);
    const comp = await Promise.all(files.map(f=>compress(f)));
    setPreviews(p=>[...p,...comp]);
  };

  const handleSubmit = async () => {
    if(!form.name.trim()||!form.price){alert('Nom et prix obligatoires.');return;}
    setUploading(true);
    try {
      const data = {
        name:form.name.trim(), category:form.category?.trim()||'',
        price:parseFloat(form.price), oldPrice:form.oldPrice?parseFloat(form.oldPrice):null,
        stock:form.stock?parseInt(form.stock):999, description:form.description?.trim()||'',
        returnDays:form.returnDays?parseInt(form.returnDays):0,
        isFlash:!!form.isFlash, flashEnd:form.isFlash&&form.flashEnd?new Date(form.flashEnd).getTime():null,
        isPromo:!!form.isPromo, images:previews, imageUrl:previews[0]||'',
        createdAt:editId?(form.createdAt||Date.now()):Date.now(), updatedAt:Date.now(),
      };
      if(editId){ await update(ref(db,`shop/${discId}/articles/${editId}`),data); }
      else { await push(ref(db,`shop/${discId}/articles`),data); }
      resetForm();
    } catch(e){alert('Erreur : '+e.message);}
    setUploading(false);
  };

  const handleDelete = async (a) => {
    if(!window.confirm('Supprimer cet article ?')) return;
    try{await remove(ref(db,`shop/${discId}/articles/${a.id}`));}catch(_){}
    try{await remove(ref(db,`articles/${a.id}`));}catch(_){}
  };

  const handleEdit = (a) => {
    setForm({...a,isFlash:!!a.isFlash,isPromo:!!a.isPromo,
      flashEnd:a.flashEnd?new Date(a.flashEnd).toISOString().slice(0,16):'',
      returnDays:a.returnDays||''});
    setPreviews(a.images||(a.imageUrl?[a.imageUrl]:[]));
    setEditId(a.id); setShowForm(true);
  };

  const handleOutOfStock = async (a) => {
    try{await update(ref(db,`shop/${discId}/articles/${a.id}`),{stock:0});}catch(_){}
    try{await update(ref(db,`articles/${a.id}`),{stock:0});}catch(_){}
  };

  const resetForm = () => {
    setForm({name:'',price:'',oldPrice:'',description:'',category:'',stock:'',returnDays:'',isFlash:false,flashEnd:'',isPromo:false});
    setPreviews([]); setEditId(null); setShowForm(false);
  };

  const color = disc?.color||'#c0392b';
  const tItems = totalItems(discId);
  const tPrice = totalPrice(discId);

  // Grid columns style
  const gridStyle = {
    1: 'repeat(1,1fr)',
    2: 'repeat(2,1fr)',
    4: 'repeat(auto-fill,minmax(150px,1fr))',
  };

  return (
    <div style={s.page} onClick={()=>menuOpen&&setMenuOpen(false)}>

      {/* ── HEADER ── */}
      <header style={{...s.header,borderBottom:`3px solid ${color}`}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button style={s.backBtn} onClick={()=>navigate('/')}>← Univers</button>
          <RcomLogo size={28} showText={false}/>
          <span style={{...s.headerTitle,color}}>{disc?.name||'Boutique'}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button style={s.cartBtn} onClick={()=>setShowCart(true)}>
            🛒{tItems>0&&<span style={s.cartBadge}>{tItems}</span>}
          </button>
          {/* Settings */}
          <button style={s.iconBtn} onClick={()=>setShowSettings(true)} title="Paramètres">⚙️</button>
          {user ? (
            <div style={{position:'relative'}}>
              <button style={s.avatarBtn} onClick={e=>{e.stopPropagation();setMenuOpen(!menuOpen);}}>
                {user.photoURL?<img src={user.photoURL} style={s.avatar} alt=""/>
                  :<div style={{...s.avatarFb,background:color}}>{(user.displayName||user.email||'U')[0].toUpperCase()}</div>}
              </button>
              {menuOpen&&(
                <div style={s.dd} onClick={e=>e.stopPropagation()}>
                  <p style={s.ddName}>{user.displayName||user.email}</p>
                  {isAdmin&&<span style={{...s.adminTag,background:color}}>⭐ Admin</span>}
                  <hr style={s.hr}/>
                  <button style={s.ddBtn} onClick={()=>signOut(auth)}>🚪 Déconnexion</button>
                </div>
              )}
            </div>
          ):(
            <button style={{...s.loginBtn,background:color}} onClick={()=>navigate('/login')}>Connexion</button>
          )}
          {isAdmin&&<button style={{...s.addBtn,background:color}} onClick={()=>{resetForm();setShowForm(true);}}>+ Article</button>}
        </div>
      </header>

      {/* ── FLASH BANNER ── */}
      {flashArts.length>0&&(
        <div style={{...s.flashBanner,background:`linear-gradient(135deg,${color},${color}bb)`}}>
          <div style={s.flashTop}>
            <span style={s.flashTitle}>⚡ VENTES FLASH</span>
            {flashArts[0]?.flashEnd&&<Countdown endTs={flashArts[0].flashEnd}/>}
          </div>
          <div style={s.flashScroll}>
            {flashArts.map(a=>{const ii=getImgs(a);const d=getDiscount(a);return(
              <div key={a.id} style={s.flashCard} onClick={()=>setSelected(a)}>
                <div style={s.flashImgW}>{ii[0]?<img src={ii[0]} style={s.flashImg} alt=""/>:<div style={s.flashImgPh}>📦</div>}
                {d&&<span style={s.flashDisc}>-{d}%</span>}</div>
                <p style={s.flashName}>{a.name}</p>
                <p style={s.flashPrice}>{Number(a.price).toLocaleString()} FCFA</p>
                {a.oldPrice&&<p style={s.flashOld}>{Number(a.oldPrice).toLocaleString()} FCFA</p>}
              </div>);})}
          </div>
        </div>
      )}

      {/* ── PROMO BANNER ── */}
      {promoArts.length>0&&(
        <div style={{...s.promoBanner,borderLeft:`4px solid ${color}`}}>
          <span style={{...s.promoLabel,color}}>🏷️ PROMOTIONS EN COURS</span>
          <div style={s.flashScroll}>
            {promoArts.map(a=>{const ii=getImgs(a);const d=getDiscount(a);return(
              <div key={a.id} style={{...s.flashCard,background:'white',border:'1px solid #eee'}} onClick={()=>setSelected(a)}>
                <div style={s.flashImgW}>{ii[0]?<img src={ii[0]} style={s.flashImg} alt=""/>:<div style={{...s.flashImgPh,color:'#ddd',background:'#f5f5f5'}}>📦</div>}
                {d&&<span style={{...s.flashDisc,background:color}}>-{d}%</span>}</div>
                <p style={{...s.flashName,color:'#111'}}>{a.name}</p>
                <p style={{...s.flashPrice,color}}>{Number(a.price).toLocaleString()} FCFA</p>
                {a.oldPrice&&<p style={s.flashOld}>{Number(a.oldPrice).toLocaleString()} FCFA</p>}
              </div>);})}
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={s.tabRow}>
          {[{k:'all',l:'🏪 Tous'},...(flashArts.length>0?[{k:'flash',l:`⚡ Flash (${flashArts.length})`}]:[]),...(promoArts.length>0?[{k:'promo',l:`🏷️ Promos (${promoArts.length})`}]:[]),...(user&&favArticles.length>0?[{k:'favs',l:`❤️ Favoris (${favArticles.length})`}]:[])].map(t=>(
            <button key={t.k} style={{...s.tabBtn,borderBottom:activeTab===t.k?`3px solid ${color}`:'3px solid transparent',color:activeTab===t.k?color:'#888',fontWeight:activeTab===t.k?700:500}}
              onClick={()=>setActiveTab(t.k)}>{t.l}</button>
          ))}
        </div>
      )}

      {/* ── SEARCH + GRID TOGGLE ── */}
      <div style={s.searchW}>
        <div style={s.searchBox}>
          <span style={{fontSize:18,color:'#aaa'}}>🔍</span>
          <input style={s.searchInp} placeholder="Rechercher un article..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button style={s.clearSearch} onClick={()=>setSearch('')}>✕</button>}
        </div>
        {/* Grid toggle buttons */}
        <div style={s.gridToggle}>
          {[{n:1,icon:'▬'},{n:2,icon:'⊞'},{n:4,icon:'⊟'}].map(g=>(
            <button key={g.n} style={{...s.gridBtn,background:gridCols===g.n?color:'#f0f2f5',color:gridCols===g.n?'white':'#666'}}
              onClick={()=>setGridCols(g.n)} title={`${g.n} colonne(s)`}>
              {g.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      {categories.length>2&&(
        <div style={s.catRow}>
          {categories.map(c=>(
            <button key={c} style={{...s.catBtn,background:activeCategory===c?color:'white',color:activeCategory===c?'white':'#555'}}
              onClick={()=>setActiveCategory(c)}>{c}</button>
          ))}
        </div>
      )}

      {/* ── GUEST NOTICE ── */}
      {!user&&(
        <div style={s.guestBar}>
          👁️ Vous naviguez en tant que visiteur —
          <button style={{...s.guestBtn,color}} onClick={()=>navigate('/login')}>Connectez-vous</button>
          pour commander
        </div>
      )}

      {/* ── LOADING ── */}
      {loading&&(
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:32,marginBottom:12}}>⏳</div>
          <p style={{color:'#aaa'}}>Chargement des articles...</p>
        </div>
      )}

      {/* ── EMPTY ── */}
      {!loading&&filtered.length===0&&(
        <div style={s.empty}>
          <div style={{fontSize:52,marginBottom:12}}>{disc?.icon||'🛒'}</div>
          <p style={{color:'#999',fontSize:16}}>
            {isAdmin?'Aucun article. Cliquez sur "+ Article" pour commencer.':'Aucun article disponible pour le moment.'}
          </p>
        </div>
      )}

      {/* ── ARTICLES GRID ── */}
      {!loading&&filtered.length>0&&(
        <div style={{...s.grid, gridTemplateColumns: gridStyle[gridCols]}}>
          {filtered.map(a=>{
            const ii=getImgs(a); const d=getDiscount(a); const q=getQty(a.id);
            const compact = gridCols === 4;
            return(
              <div key={a.id} style={s.card}>
                <div style={{...s.imgW, height: compact?120:gridCols===1?220:170}} onClick={()=>setSelected(a)}>
                  {ii[0]?<img src={ii[0]} alt={a.name} style={s.img}/>:<div style={s.imgPh}>📦</div>}
                  {ii.length>1&&<span style={s.photoCount}>📷 {ii.length}</span>}
                  {d&&<span style={s.discBadge}>-{d}%</span>}
                  {a.isFlash&&<span style={{...s.tag,background:'#e74c3c'}}>⚡</span>}
                  {a.isPromo&&!a.isFlash&&<span style={{...s.tag,background:color}}>🏷️</span>}
                  {a.stock===0&&<div style={s.outStock}>Rupture</div>}
                  {/* Favorite button */}
                  <button style={{...s.favBtn, color: isFav(a.id)?'#e74c3c':'rgba(255,255,255,0.8)', background: isFav(a.id)?'white':'rgba(0,0,0,0.25)'}}
                    onClick={(e)=>toggleFav(a,e)}>
                    {isFav(a.id)?'❤️':'🤍'}
                  </button>
                </div>
                <div style={{...s.cardBody, padding: compact?'8px':gridCols===1?'14px 16px':'10px 12px'}}>
                  {a.category&&!compact&&<span style={{...s.catLabel,color}}>{a.category}</span>}
                  <h3 style={{...s.artName, fontSize:compact?12:gridCols===1?16:14}} onClick={()=>setSelected(a)}>{a.name}</h3>
                  <div style={s.priceRow}>
                    <span style={{...s.price,color,fontSize:compact?12:15}}>{Number(a.price).toLocaleString()} FCFA</span>
                    {a.oldPrice&&!compact&&<span style={s.oldPrice}>{Number(a.oldPrice).toLocaleString()} FCFA</span>}
                  </div>
                  {a.returnDays>0&&!compact&&<p style={s.returnTag}>↩️ Retour sous {a.returnDays}j</p>}
                  {a.stock!==0&&(
                    q===0?(
                      <button style={{...s.addCartBtn,background:color,padding:compact?'6px':'9px',fontSize:compact?11:13}} onClick={()=>doAdd(a)}>
                        {compact?'🛒':'🛒 Ajouter au panier'}
                      </button>
                    ):(
                      <div style={{...s.qtyRow,gap:compact?4:7}}>
                        <button style={{...s.qtyBtn,width:compact?26:32,height:compact?26:32}} onClick={()=>updateQuantity(discId,a.id,q-1)}>−</button>
                        <span style={{...s.qtyN,fontSize:compact?11:13}}>{q}</span>
                        <button style={{...s.qtyBtn,width:compact?26:32,height:compact?26:32}} onClick={()=>updateQuantity(discId,a.id,q+1)}>+</button>
                        {!compact&&<button style={s.remBtn} onClick={()=>removeFromCart(discId,a.id)}>🗑️</button>}
                      </div>
                    )
                  )}
                  {isAdmin&&!compact&&(
                    <div style={s.adminBtns}>
                      <button style={s.editBtn} onClick={()=>handleEdit(a)}>✏️</button>
                      <button style={s.epuisBtn} onClick={()=>handleOutOfStock(a)}>📦 Épuisé</button>
                      <button style={s.delBtn2} onClick={()=>handleDelete(a)}>🗑️</button>
                    </div>
                  )}
                  {isAdmin&&compact&&(
                    <div style={{display:'flex',gap:3,marginTop:4}}>
                      <button style={{...s.editBtn,padding:'2px 4px',fontSize:10}} onClick={()=>handleEdit(a)}>✏️</button>
                      <button style={{...s.delBtn2,padding:'2px 4px',fontSize:10}} onClick={()=>handleDelete(a)}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FLOATING CART ── */}
      {tItems>0&&(
        <button style={{...s.floatingCart,background:`linear-gradient(135deg,${color},${color}bb)`}} onClick={()=>setShowCart(true)}>
          🛒 Panier ({tItems}) — {tPrice.toLocaleString()} FCFA
        </button>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected&&(()=>{
        const ii=getImgs(selected); const d=getDiscount(selected); const q=getQty(selected.id);
        return(
          <div style={s.overlay} onClick={()=>setSelected(null)}>
            <div style={s.detailModal} onClick={e=>e.stopPropagation()}>
              <button style={s.closeBtn} onClick={()=>setSelected(null)}>✕</button>
              <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                {selected.isFlash&&<span style={{background:'#e74c3c',color:'white',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:8}}>⚡ Vente Flash</span>}
                {selected.isPromo&&<span style={{background:color,color:'white',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:8}}>🏷️ Promotion</span>}
                {selected.isFlash&&selected.flashEnd&&<Countdown endTs={selected.flashEnd}/>}
              </div>
              {ii.length>0&&(
                <div style={s.carousel}>
                  <img src={ii[carIdx]} alt="" style={s.carImg}/>
                  {ii.length>1&&(
                    <><button style={{...s.carArrow,left:8}} onClick={()=>setCarIdx((carIdx-1+ii.length)%ii.length)}>‹</button>
                    <button style={{...s.carArrow,right:8}} onClick={()=>setCarIdx((carIdx+1)%ii.length)}>›</button>
                    <div style={s.carDots}>{ii.map((_,i)=><span key={i} style={{...s.dot,background:i===carIdx?'white':'rgba(255,255,255,0.4)'}} onClick={()=>setCarIdx(i)}/>)}</div></>
                  )}
                </div>
              )}
              {ii.length>1&&<div style={s.thumbRow}>{ii.map((u,i)=><img key={i} src={u} alt="" style={{...s.thumb,outline:i===carIdx?`3px solid ${color}`:'3px solid transparent'}} onClick={()=>setCarIdx(i)}/>)}</div>}
              {/* Favorite in detail */}
              <button style={{...s.favBtnLarge, background: isFav(selected.id)?'#fdecea':'#f8f8f8', color: isFav(selected.id)?'#e74c3c':'#888'}}
                onClick={(e)=>toggleFav(selected,e)}>
                {isFav(selected.id)?'❤️ Retiré des favoris':'🤍 Ajouter aux favoris'}
              </button>
              {selected.stock===0&&<div style={s.outStockBig}>Rupture de stock</div>}
              {selected.category&&<span style={{...s.catLabel,color,display:'inline-block',marginBottom:6}}>{selected.category}</span>}
              <h2 style={s.detailName}>{selected.name}</h2>
              <div style={s.detailPriceRow}>
                <span style={{...s.detailPrice,color}}>{Number(selected.price).toLocaleString()} FCFA</span>
                {selected.oldPrice&&<span style={s.oldPrice}>{Number(selected.oldPrice).toLocaleString()} FCFA</span>}
                {d&&<span style={{background:'#e74c3c',color:'white',fontSize:13,fontWeight:700,padding:'3px 8px',borderRadius:8}}>-{d}%</span>}
              </div>
              {selected.description&&<p style={s.detailDesc}>{selected.description}</p>}
              {selected.stock>0&&<p style={s.stockInfo}>{selected.stock>900?'✅ En stock':`📦 ${selected.stock} restant(s)`}</p>}
              <div style={s.returnBox}>
                {selected.returnDays>0
                  ?<span>↩️ <strong>Retour accepté sous {selected.returnDays} jours</strong></span>
                  :<span>❌ <strong>Cet article n'est pas éligible au retour</strong></span>}
              </div>
              {selected.stock!==0&&(q===0?(
                <button style={{...s.addCartBtn,width:'100%',padding:14,fontSize:16,marginTop:14,background:color}} onClick={()=>{doAdd(selected);if(user)setSelected(null);}}>🛒 Ajouter au panier</button>
              ):(
                <div style={{...s.qtyRow,justifyContent:'center',marginTop:14}}>
                  <button style={s.qtyBtn} onClick={()=>updateQuantity(discId,selected.id,q-1)}>−</button>
                  <span style={s.qtyN}>{q} dans le panier</span>
                  <button style={s.qtyBtn} onClick={()=>updateQuantity(discId,selected.id,q+1)}>+</button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── CART MODAL ── */}
      {showCart&&(
        <div style={s.overlay} onClick={()=>setShowCart(false)}>
          <div style={s.cartModal} onClick={e=>e.stopPropagation()}>
            <div style={s.cartHeader}>
              <h2 style={s.cartTitle}>🛒 Mon Panier</h2>
              <button style={s.closeBtn} onClick={()=>setShowCart(false)}>✕</button>
            </div>
            {cart.length===0?(
              <div style={{textAlign:'center',padding:'48px 0',color:'#aaa'}}><div style={{fontSize:48}}>🛒</div><p style={{marginTop:12}}>Votre panier est vide</p></div>
            ):(
              <>
                <div style={s.cartItems}>
                  {cart.map(item=>(
                    <div key={item.article.id} style={s.cartItem}>
                      {item.article.imageUrl&&<img src={item.article.imageUrl} style={s.cartImg} alt=""/>}
                      <div style={{flex:1}}>
                        <p style={s.cartItemName}>{item.article.name}</p>
                        <p style={s.cartItemPriceUnit}>{Number(item.article.price).toLocaleString()} FCFA/u</p>
                        <div style={s.qtyRow}>
                          <button style={s.qtyBtn} onClick={()=>updateQuantity(discId,item.article.id,item.quantity-1)}>−</button>
                          <span style={s.qtyN}>{item.quantity}</span>
                          <button style={s.qtyBtn} onClick={()=>updateQuantity(discId,item.article.id,item.quantity+1)}>+</button>
                          <button style={s.remBtn} onClick={()=>removeFromCart(discId,item.article.id)}>🗑️</button>
                        </div>
                      </div>
                      <p style={{fontWeight:800,fontSize:15,color,whiteSpace:'nowrap'}}>{(item.article.price*item.quantity).toLocaleString()} FCFA</p>
                    </div>
                  ))}
                </div>
                <div style={s.cartFooter}>
                  <div style={s.totalRow}>
                    <span style={{fontWeight:700,fontSize:16}}>Total</span>
                    <span style={{fontWeight:800,fontSize:20,color}}>{tPrice.toLocaleString()} FCFA</span>
                  </div>
                  <div style={{background:'#f0f8ff',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#555'}}>
                    💡 <strong>Acompte à payer :</strong> {Math.ceil(tPrice/4).toLocaleString()} FCFA (1/4 du total)
                  </div>
                  {user?(
                    <button style={{...s.waBtn,background:'#25D366'}} onClick={handleOrder}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{marginRight:8,flexShrink:0}}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.524 5.855L.057 23.714a.5.5 0 00.614.614l5.858-1.467A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.742-.524-5.295-1.437l-.378-.222-3.927.983.982-3.927-.222-.378A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Commander via WhatsApp
                    </button>
                  ):(
                    <div style={s.loginWallCart}>
                      <p style={{fontWeight:700,marginBottom:6}}>🔐 Connexion requise</p>
                      <button style={{...s.waBtn,background:color}} onClick={()=>navigate('/login')}>Se connecter / S'inscrire</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── LOGIN WALL ── */}
      {showLoginWall&&(
        <div style={s.overlay} onClick={()=>setShowLoginWall(false)}>
          <div style={{background:'white',borderRadius:24,padding:36,width:'100%',maxWidth:360,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:52,marginBottom:10}}>🔐</div>
            <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,letterSpacing:1,marginBottom:8}}>Connexion requise</h2>
            <p style={{color:'#666',fontSize:14,lineHeight:1.6,marginBottom:22}}>Pour commander, vous devez avoir un compte R.COM. C'est <strong>gratuit</strong> !</p>
            <button style={{...s.waBtn,background:color,marginBottom:10}} onClick={()=>navigate('/login')}>Se connecter / S'inscrire</button>
            <button style={{...s.waBtn,background:'#f0f2f5',color:'#555'}} onClick={()=>setShowLoginWall(false)}>Continuer à naviguer</button>
          </div>
        </div>
      )}

      {/* ── SETTINGS / ABOUT MODAL ── */}
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)} color={color}/>}

      {/* ── SUCCESS TOAST ── */}
      {orderOk&&<div style={s.toast}>✅ Commande envoyée sur WhatsApp !</div>}

      {/* ── ADMIN FORM ── */}
      {isAdmin&&showForm&&(
        <div style={s.overlay}>
          <div style={s.formModal}>
            <h2 style={s.formTitle}>{editId?'Modifier':'Nouvel'} Article — <span style={{color}}>{disc?.name}</span></h2>
            <div style={s.formScroll}>
              <p style={{fontSize:13,fontWeight:700,color:'#555',marginBottom:8}}>Photos ({previews.length}/{MAX_PHOTOS})</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
                {previews.map((u,i)=>(
                  <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:10,overflow:'hidden',background:'#f0f0f0'}}>
                    <img src={u} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    <button style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.6)',color:'white',border:'none',borderRadius:50,width:20,height:20,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                      onClick={()=>setPreviews(p=>p.filter((_,j)=>j!==i))}>✕</button>
                    {i===0&&<span style={{position:'absolute',bottom:3,left:3,background:color,color:'white',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4}}>Principale</span>}
                  </div>
                ))}
                {previews.length<MAX_PHOTOS&&(
                  <label style={{aspectRatio:'1',borderRadius:10,border:'2px dashed #ddd',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'#fafafa'}}>
                    <div style={{fontSize:26,color:'#ccc'}}>＋</div>
                    <div style={{fontSize:11,color:'#bbb',marginTop:3}}>Photo</div>
                    <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleImg}/>
                  </label>
                )}
              </div>

              <input style={fS.inp} placeholder="Nom de l'article *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>

              {/* ── CATEGORY PICKER ── */}
              <CategoryPicker
                value={form.category}
                onChange={v=>setForm({...form,category:v})}
                existingCategories={existingCategories}
              />

              <input style={fS.inp} type="number" placeholder="Prix en FCFA *" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
              <input style={fS.inp} type="number" placeholder="Ancien prix (affiche la réduction)" value={form.oldPrice} onChange={e=>setForm({...form,oldPrice:e.target.value})}/>
              <input style={fS.inp} type="number" placeholder="Stock (vide = illimité)" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
              <input style={fS.inp} type="number" placeholder="Jours de retour (vide = pas de retour)" value={form.returnDays} onChange={e=>setForm({...form,returnDays:e.target.value})}/>
              <textarea style={{...fS.inp,height:80,resize:'vertical'}} placeholder="Description de l'article" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
              <div style={{background:'#f8f8f8',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
                <label style={{fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center'}}>
                  <input type="checkbox" checked={!!form.isFlash} onChange={e=>setForm({...form,isFlash:e.target.checked})} style={{marginRight:8}}/>⚡ Vente Flash
                </label>
                {form.isFlash&&<input style={{...fS.inp,marginTop:8}} type="datetime-local" value={form.flashEnd} onChange={e=>setForm({...form,flashEnd:e.target.value})}/>}
              </div>
              <div style={{background:'#f8f8f8',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
                <label style={{fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center'}}>
                  <input type="checkbox" checked={!!form.isPromo} onChange={e=>setForm({...form,isPromo:e.target.checked})} style={{marginRight:8}}/>🏷️ Mettre en promotion
                </label>
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button style={{flex:1,padding:'13px',background:color,color:'white',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif",fontSize:15,opacity:uploading?0.7:1}}
                onClick={handleSubmit} disabled={uploading}>
                {uploading?'⏳ Publication...':editId?'✅ Modifier':'🚀 Publier'}
              </button>
              <button style={{flex:1,padding:'13px',background:'#f0f2f5',color:'#666',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}
                onClick={resetForm}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{minHeight:'100vh',background:'#f0f2f5',paddingBottom:100},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',background:'white',boxShadow:'0 2px 12px rgba(0,0,0,0.07)',position:'sticky',top:0,zIndex:100},
  backBtn:{background:'#f0f2f5',border:'none',borderRadius:10,padding:'6px 10px',fontSize:12,fontWeight:700,cursor:'pointer',color:'#555',fontFamily:"'Outfit',sans-serif",whiteSpace:'nowrap'},
  headerTitle:{fontFamily:"'Bebas Neue',cursive",fontSize:18,letterSpacing:1},
  cartBtn:{position:'relative',background:'none',border:'none',fontSize:22,cursor:'pointer',padding:'4px 6px'},
  cartBadge:{position:'absolute',top:0,right:0,background:'#e74c3c',color:'white',fontSize:10,fontWeight:700,width:16,height:16,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'},
  iconBtn:{background:'none',border:'none',fontSize:20,cursor:'pointer',padding:'4px 6px'},
  avatarBtn:{background:'none',border:'none',cursor:'pointer',padding:0},
  avatar:{width:32,height:32,borderRadius:'50%',objectFit:'cover'},
  avatarFb:{width:32,height:32,borderRadius:'50%',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14},
  dd:{position:'absolute',right:0,top:42,background:'white',borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,0.15)',padding:'14px 18px',minWidth:200,zIndex:200},
  ddName:{fontSize:14,fontWeight:600,marginBottom:6,wordBreak:'break-all'},
  adminTag:{color:'white',fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:700,display:'inline-block'},
  hr:{border:'none',borderTop:'1px solid #eee',margin:'10px 0'},
  ddBtn:{background:'none',border:'none',color:'#e74c3c',cursor:'pointer',fontSize:14,padding:'4px 0',width:'100%',textAlign:'left'},
  loginBtn:{border:'none',borderRadius:20,padding:'7px 14px',fontWeight:700,cursor:'pointer',color:'white',fontSize:12,fontFamily:"'Outfit',sans-serif"},
  addBtn:{color:'white',border:'none',borderRadius:10,padding:'6px 12px',fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'Outfit',sans-serif"},
  flashBanner:{padding:'12px 14px'},
  flashTop:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10},
  flashTitle:{color:'white',fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:2},
  flashScroll:{display:'flex',gap:10,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4},
  flashCard:{background:'rgba(0,0,0,0.25)',borderRadius:12,overflow:'hidden',minWidth:110,maxWidth:110,cursor:'pointer',flexShrink:0},
  flashImgW:{height:80,overflow:'hidden',position:'relative'},
  flashImg:{width:'100%',height:'100%',objectFit:'cover'},
  flashImgPh:{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:24,color:'rgba(255,255,255,0.4)',background:'rgba(0,0,0,0.2)'},
  flashDisc:{position:'absolute',top:4,right:4,background:'#f39c12',color:'white',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:5},
  flashName:{color:'white',fontSize:10,fontWeight:700,padding:'4px 8px 0',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  flashPrice:{color:'#ffd700',fontWeight:800,fontSize:11,padding:'2px 8px 4px'},
  flashOld:{color:'rgba(255,255,255,0.45)',fontSize:9,textDecoration:'line-through',padding:'0 8px 5px',marginTop:-4},
  promoBanner:{background:'#fffbf0',padding:'12px 14px'},
  promoLabel:{fontFamily:"'Bebas Neue',cursive",fontSize:16,letterSpacing:1,display:'block',marginBottom:8},
  tabRow:{display:'flex',background:'white',borderBottom:'1px solid #eee'},
  tabBtn:{flex:1,padding:'10px 0',background:'none',border:'none',cursor:'pointer',fontSize:12,fontFamily:"'Outfit',sans-serif",transition:'all 0.2s'},
  searchW:{padding:'10px 12px 6px',display:'flex',gap:8,alignItems:'center'},
  searchBox:{background:'white',borderRadius:14,padding:'9px 12px',display:'flex',alignItems:'center',gap:8,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',flex:1},
  searchInp:{border:'none',outline:'none',fontSize:14,flex:1,fontFamily:"'Outfit',sans-serif"},
  clearSearch:{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:16},
  gridToggle:{display:'flex',gap:4},
  gridBtn:{border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,transition:'all 0.2s'},
  catRow:{display:'flex',gap:6,padding:'4px 12px 8px',overflowX:'auto',scrollbarWidth:'none'},
  catBtn:{border:'none',borderRadius:20,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Outfit',sans-serif",boxShadow:'0 2px 6px rgba(0,0,0,0.08)',flexShrink:0,transition:'all 0.2s'},
  guestBar:{background:'#fff8e1',padding:'8px 14px',fontSize:12,color:'#795548',display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'},
  guestBtn:{background:'none',border:'none',fontWeight:700,cursor:'pointer',fontSize:12,textDecoration:'underline',padding:'0 3px'},
  empty:{textAlign:'center',padding:'80px 20px'},
  grid:{display:'grid',gap:10,padding:'8px 12px',maxWidth:1200,margin:'0 auto'},
  card:{background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.08)'},
  imgW:{position:'relative',overflow:'hidden',background:'#f8f8f8',cursor:'pointer'},
  img:{width:'100%',height:'100%',objectFit:'cover'},
  imgPh:{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:36,color:'#ddd'},
  photoCount:{position:'absolute',bottom:6,right:6,background:'rgba(0,0,0,0.55)',color:'white',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:6},
  discBadge:{position:'absolute',top:6,left:6,background:'#e74c3c',color:'white',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:6},
  tag:{position:'absolute',bottom:6,left:6,color:'white',fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:6},
  outStock:{position:'absolute',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:11},
  outStockBig:{background:'#e74c3c',color:'white',textAlign:'center',padding:'9px',fontSize:14,fontWeight:700,borderRadius:10,marginBottom:14},
  cardBody:{},
  catLabel:{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1},
  artName:{fontWeight:700,margin:'2px 0 5px',lineHeight:1.3,cursor:'pointer'},
  priceRow:{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:5},
  price:{fontWeight:800},
  oldPrice:{fontSize:11,color:'#bbb',textDecoration:'line-through'},
  returnTag:{fontSize:10,color:'#27ae60',fontWeight:600,margin:'0 0 6px'},
  addCartBtn:{width:'100%',color:'white',border:'none',borderRadius:9,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif"},
  qtyRow:{display:'flex',alignItems:'center',gap:6},
  qtyBtn:{border:'2px solid #eee',borderRadius:7,background:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700},
  qtyN:{fontWeight:700,fontSize:12,minWidth:16,textAlign:'center'},
  remBtn:{background:'#fdecea',border:'none',borderRadius:7,width:28,height:28,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'},
  adminBtns:{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'},
  editBtn:{background:'#f0f2f5',border:'none',borderRadius:6,padding:'3px 7px',cursor:'pointer',fontSize:11,fontWeight:600},
  epuisBtn:{background:'#fff3e0',border:'none',borderRadius:6,padding:'3px 6px',cursor:'pointer',fontSize:10,fontWeight:600},
  delBtn2:{background:'#fdecea',border:'none',borderRadius:6,padding:'3px 7px',cursor:'pointer',fontSize:11},
  floatingCart:{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',color:'white',border:'none',borderRadius:30,padding:'13px 22px',fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:'0 8px 30px rgba(0,0,0,0.25)',zIndex:99,fontFamily:"'Outfit',sans-serif",whiteSpace:'nowrap'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:14},
  detailModal:{background:'white',borderRadius:22,padding:22,width:'100%',maxWidth:480,maxHeight:'92vh',overflowY:'auto',position:'relative'},
  closeBtn:{position:'absolute',top:12,right:12,background:'#f0f2f5',border:'none',borderRadius:50,width:30,height:30,cursor:'pointer',fontSize:14,zIndex:10,display:'flex',alignItems:'center',justifyContent:'center'},
  carousel:{position:'relative',borderRadius:14,overflow:'hidden',marginBottom:10,background:'#111'},
  carImg:{width:'100%',height:240,objectFit:'cover',display:'block'},
  carArrow:{position:'absolute',top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.45)',color:'white',border:'none',borderRadius:50,width:34,height:34,fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'},
  carDots:{position:'absolute',bottom:8,left:0,right:0,display:'flex',justifyContent:'center',gap:5},
  dot:{width:7,height:7,borderRadius:'50%',cursor:'pointer',display:'inline-block'},
  thumbRow:{display:'flex',gap:7,marginBottom:12,overflowX:'auto'},
  thumb:{width:50,height:50,objectFit:'cover',borderRadius:9,cursor:'pointer',flexShrink:0},
  detailName:{fontFamily:"'Bebas Neue',cursive",fontSize:24,letterSpacing:1,marginBottom:7},
  detailPriceRow:{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'},
  detailPrice:{fontSize:20,fontWeight:800},
  detailDesc:{color:'#555',fontSize:14,lineHeight:1.6,marginBottom:10},
  stockInfo:{color:'#27ae60',fontSize:13,fontWeight:600,marginBottom:8},
  returnBox:{background:'#f8f8f8',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#444',marginTop:4},
  cartModal:{background:'white',borderRadius:22,width:'100%',maxWidth:480,maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'},
  cartHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px 12px',borderBottom:'1px solid #f0f2f5',position:'relative'},
  cartTitle:{fontFamily:"'Bebas Neue',cursive",fontSize:24,letterSpacing:1},
  cartItems:{flex:1,overflowY:'auto',padding:'6px 22px'},
  cartItem:{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px solid #f5f5f5',alignItems:'flex-start'},
  cartImg:{width:52,height:52,borderRadius:9,objectFit:'cover',flexShrink:0},
  cartItemName:{fontWeight:700,fontSize:13,marginBottom:2},
  cartItemPriceUnit:{color:'#888',fontSize:11,marginBottom:5},
  cartFooter:{padding:'12px 22px 22px',borderTop:'1px solid #f0f2f5'},
  totalRow:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  loginWallCart:{background:'#fff8f0',borderRadius:12,padding:14,textAlign:'center',marginBottom:10,border:'1px solid #fde0c0'},
  waBtn:{width:'100%',padding:'13px',color:'white',border:'none',borderRadius:12,fontWeight:700,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',sans-serif"},
  toast:{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:'#27ae60',color:'white',padding:'12px 20px',borderRadius:12,fontWeight:700,fontSize:13,zIndex:400,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',whiteSpace:'nowrap'},
  formModal:{background:'white',borderRadius:22,padding:22,width:'100%',maxWidth:440,maxHeight:'95vh',display:'flex',flexDirection:'column'},
  formTitle:{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:1,marginBottom:12},
  formScroll:{overflowY:'auto',flex:1,paddingRight:2},
};
