# R.COM — Plateforme Digitale Multi-Univers 🛍️

> Une marketplace africaine moderne regroupant commerce, technologie, alimentation et services dans une seule application.

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 📌 Présentation

**R.COM** est une plateforme digitale multi-univers qui regroupe plusieurs disciplines et services dans une seule application moderne, rapide et responsive. Inspirée de plateformes telles que Jumia, elle intègre un système complet de gestion d'articles, de boutiques, de catégories, de promotions et de commandes via WhatsApp.

---

## 🌍 Univers disponibles

| Univers | Description |
|---|---|
| 🛒 R.COM Market | Commerce général |
| 💻 R.COM Tech | Produits technologiques |
| 🍽️ R.COM Délice | Alimentation et restauration |
| ➕ Autres univers | À venir selon évolution |

> Les univers fermés apparaissent en bas de la liste.

---

## ✨ Fonctionnalités principales

### Pour les utilisateurs
- 🔓 Consultation des articles **sans connexion**
- ❤️ Système de **favoris** (ajout, suppression, synchronisation)
- 📦 Commande directe via **WhatsApp**
- 🔍 Affichage en 1, 2 ou 4 colonnes
- 🔔 Notifications : ventes flash, promotions, nouveaux articles

### Pour les vendeurs
- 🏪 Boutique personnelle avec limite d'articles (15 par défaut)
- ✏️ Publication, modification et suppression d'articles
- 📂 Sélection de catégories existantes ou création de nouvelles

### Pour l'administrateur
- 👑 Gestion complète des univers, vendeurs, boutiques et articles
- 📊 Approbation / suspension des vendeurs
- 🏷️ Gestion des promotions et ventes flash
- 👥 Accès à tous les comptes utilisateurs

---

## 🛒 Système de commande

Lorsqu'un utilisateur clique sur **"Commander"** :

1. Le système vérifie si l'utilisateur est connecté
2. La commande est générée automatiquement
3. Un message est envoyé vers WhatsApp

**Numéro WhatsApp officiel :** `+225 0160672966`

**Format du message généré :**
```
Bonjour R.COM 👋

Je souhaite commander :
- Chaussure Nike
  Quantité : 2

Prix total : 20 000 FCFA

Merci.
```

> ⚠️ Avant validation, le client paie **1/4 du montant** comme confirmation de commande.

---

## 🗂️ Structure des articles

Chaque article contient :

- Nom, prix, ancien prix, réduction
- Description et images
- Stock et disponibilité
- Catégorie, univers, vendeur
- Date de publication

---

## 🔐 Authentification

Connexion via **Firebase Authentication** :

- 🔵 Google
- 📱 Numéro de téléphone
- 📧 Email et mot de passe

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js + React + Tailwind CSS |
| Backend | Firebase (Firestore / Realtime Database) |
| Auth | Firebase Authentication |
| Hébergement | Vercel |

---

## 🚀 Installation et lancement

### Prérequis

- Node.js v18+
- Compte Firebase
- Compte Vercel

### Cloner le projet

```bash
git clone https://github.com/ton-username/r-com.git
cd r-com
```

### Installer les dépendances

```bash
npm install
```

### Configurer Firebase

Créer un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Lancer en développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de production

```bash
npm run build
npm start
```

---

## ☁️ Déploiement sur Vercel

1. Connecte ton dépôt GitHub à [Vercel](https://vercel.com)
2. Ajoute les variables d'environnement Firebase dans les paramètres Vercel
3. Vercel déploie automatiquement à chaque push sur `main`

---

## 📁 Structure du projet (recommandée)

```
r-com/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx            # Page d'accueil / univers
│   ├── [univers]/          # Pages dynamiques par univers
│   └── admin/              # Interface administrateur
├── components/             # Composants React réutilisables
├── lib/                    # Configuration Firebase, helpers
├── hooks/                  # Custom React hooks
├── public/                 # Assets statiques (logo, images)
├── styles/                 # Styles globaux
├── .env.local              # Variables d'environnement (non versionné)
└── README.md
```

---

## 🔒 Sécurité

- Règles Firebase sécurisées par rôle (admin / vendeur / utilisateur)
- Protection des données utilisateurs
- Modifications autorisées uniquement pour les propriétaires
- Aucun vendeur ne peut modifier les articles d'un autre

---

## 📱 Compatibilité

L'application est responsive et fonctionne sur :

- ✅ Android
- ✅ iPhone
- ✅ Tablette
- ✅ Ordinateur

---

## 🌟 Vision du projet

R.COM a pour ambition de devenir un véritable **écosystème numérique africain** moderne et évolutif, regroupant :

- Commerce
- Technologie
- Alimentation
- Services
- Innovation
- Boutiques & vente digitale

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © R.COM.

---

## 📞 Contact

Pour toute question ou commande : **WhatsApp +225 0160672966**
