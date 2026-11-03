# Studio ! — Site vitrine salon de coiffure

Projet Hackathon — XHTML & CSS - Projet 1  
Auteur : [Étudiant]  
Encadrant : Ing. Lewis HOUNNAHIN

---

## Description

Site web professionnel et responsive pour le salon de coiffure fictif **Studio !**, situé à Paris 11e.  
Réalisé en HTML5, CSS3, Bootstrap 5 et JavaScript, avec intégration d'un chatbot IA (Gemini).

---

## Structure

```
studio-coiffure/
├── index.html        ← Accueil
├── about.html        ← À propos
├── services.html     ← Services & Tarifs
├── contact.html      ← Contact & RDV
├── style.css         ← Styles custom
├── script.js         ← JS (chatbot, validation, scroll)
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

---

## Technologies

- HTML5 sémantique
- CSS3 (variables, animations, Flexbox, Grid, Media Queries)
- Bootstrap 5.3
- JavaScript ES6+ (vanilla)
- Google Gemini API (chatbot)
- Hébergement : Vercel

---

## Lancer en local

Ouvrir `index.html` dans un navigateur.  
Aucune dépendance à installer (Bootstrap via CDN).

---

## Déploiement Vercel

1. Pousser le dossier sur GitHub
2. Importer le repo sur [vercel.com](https://vercel.com)
3. Déploiement automatique

---

## Chatbot — Configuration

Dans `script.js`, remplacer :
```js
const GEMINI_API_KEY = 'VOTRE_CLE_GEMINI_ICI';
```
par votre clé Google AI Studio.  
**⚠️ En production : utiliser une Vercel Serverless Function pour ne pas exposer la clé.**

---

## Critères couverts

| Critère | Statut |
|---|---|
| 4 pages obligatoires | ✅ |
| Navbar responsive | ✅ |
| Carrousel Bootstrap | ✅ |
| Cards Bootstrap | ✅ |
| Animations CSS | ✅ |
| Responsive mobile/tablette/desktop | ✅ |
| CSS custom séparé | ✅ |
| JS séparé (bonus) | ✅ |
| Chatbot IA Gemini (bonus) | ✅ |
