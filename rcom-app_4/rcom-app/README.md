# R.COM App

Application officielle du Groupe R.COM

## 🚀 Déploiement sur Vercel

### Étape 1 – Prépare ton code sur GitHub
1. Va sur [github.com](https://github.com) → crée un compte si nécessaire
2. Clique sur **"New repository"** → nomme-le `rcom-app` → clique **Create**
3. Sur ta machine, installe [Git](https://git-scm.com) puis exécute dans le dossier du projet :
```bash
git init
git add .
git commit -m "Initial R.COM app"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/rcom-app.git
git push -u origin main
```

### Étape 2 – Déploie sur Vercel
1. Va sur [vercel.com](https://vercel.com) → connecte-toi avec GitHub
2. Clique **"New Project"** → importe ton repo `rcom-app`
3. Framework Preset : **Vite**
4. Clique **Deploy** → attends 1-2 minutes

### Étape 3 – Configure Firebase (IMPORTANT)
Dans la console Firebase :
1. **Authentication** → Sign-in method → Active **Google** et **Email/Password**
2. **Storage** → Rules : change `allow read, write: if false;` en `allow read, write: if request.auth != null;`
3. **Realtime Database** → Rules :
```json
{
  "rules": {
    "articles": {
      ".read": "auth != null",
      ".write": "auth.uid === 'ImB6u7fpdZbibN3LyCaAnwbHZZq1'"
    },
    "disciplines": {
      ".read": "auth != null",
      ".write": "auth.uid === 'ImB6u7fpdZbibN3LyCaAnwbHZZq1'"
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```
4. Dans **Authentication** → Settings → Authorized domains → ajoute ton domaine Vercel (ex: `rcom-app.vercel.app`)

### ✅ C'est prêt !
- URL : `https://rcom-app.vercel.app` (ou le nom généré)
- Ton compte `rayan.compagnie@gmail.com` est automatiquement admin
- Les articles publiés sont permanents jusqu'à ce que tu les supprimes

## 📌 Fonctionnalités
- Connexion Google ou Email/Mot de passe
- Page d'accueil avec les disciplines (Market, Tech, Délice...)
- R.COM Market : affichage articles, prix, réductions, rupture de stock
- Admin : ajouter/modifier/supprimer articles, ajouter disciplines
- Logo R.COM fidèle à l'original
