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
├── api/chat.js       ← Fonction Vercel (proxy Gemini)
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

La clé Gemini n'est plus dans `script.js`. Le navigateur appelle `/api/chat`
(fonction serverless Vercel dans `api/chat.js`) qui détient la clé.

1. Créer une clé sur https://aistudio.google.com/apikey
2. Vercel → Project → Settings → Environment Variables :
   - `GEMINI_API_KEY` = votre clé
   - `GEMINI_MODEL` (optionnel, défaut `gemini-3.5-flash`)
3. Redéployer (Deployments → Redeploy), les variables ne s'appliquent qu'aux nouveaux déploiements.

Si l'API est indisponible (ou si le site est ouvert en local via `file://`),
Léa répond avec des réponses locales de secours (horaires, prix, adresse, RDV).

Test local complet : `npx vercel dev` avec un fichier `.env` contenant `GEMINI_API_KEY=...`

---

## Carte Google Maps

`contact.html` contient une carte intégrée de **Pigier Bénin** (Carré 1270, Rue 320,
Agontinkon-Ayidoté, Cotonou), sans clé API. Pour changer de lieu, modifier le
paramètre `q=` dans les trois URL Google Maps de la section `#localisation`.

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
