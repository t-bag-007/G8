/**
 * Vercel Serverless Function — proxy Gemini pour le chatbot Léa.
 * La clé API reste côté serveur (variable d'environnement GEMINI_API_KEY),
 * elle n'est plus jamais visible dans le navigateur.
 *
 * Variables d'environnement Vercel :
 *   GEMINI_API_KEY  (obligatoire)  — clé Google AI Studio
 *   GEMINI_MODEL    (optionnel)    — ex. gemini-3.5-flash
 */

const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-2.5-flash',
].filter(Boolean);

const SYSTEM_PROMPT = `
Tu es Léa, l'assistante virtuelle du salon de coiffure "Studio !".
Tu réponds uniquement en français, avec un ton chaleureux, professionnel et bienveillant.
Tu utilises le tutoiement ou le vouvoiement selon comment l'utilisateur s'adresse à toi.

INFORMATIONS SUR LE SALON :
Nom        : Studio !
Type       : Salon de coiffure mixte
Adresse    : 12 rue des Artisans, 75011 Paris
Téléphone  : 01 23 45 67 89
Email      : contact@studio-coiffure.fr
Horaires   : Mardi–Vendredi 9h–19h | Samedi 9h–18h | Fermé dimanche et lundi
Accès      : Métro Voltaire (ligne 9) — 3 min à pied

SERVICES ET TARIFS :
- Coupe Femme         : 35€  (shampoing + coupe + coiffage)
- Coupe Homme         : 20€  (shampoing + coupe, dégradé possible)
- Balayage            : 70€+ (californien, ombré, baby lights)
- Coloration pleine   : 55€+ (couverture racines ou changement total)
- Kératine            : 90€  (lissage semi-permanent, dure 3-4 mois)
- Chignon de soirée   : 55€  (structuré, tressé ou romantique)
- Soin profond        : 30€  (nourrissant, restructurant ou hydratant)

ÉQUIPE :
- Sophie Marchand (fondatrice) — coupes structurées, colorations
- Karim Benali — coupe homme, dégradés, barbier certifié
- Inès Durand — coloriste, kératine, balayage
- Amara Diallo — cheveux bouclés, tresses, coiffures cérémonie

PRISE DE RDV : par téléphone (01 23 45 67 89) ou via le formulaire de contact du site.

COMPORTEMENT :
- Réponds uniquement aux questions liées au salon (services, prix, horaires, RDV, conseils coiffure, équipe)
- Si la question est hors sujet, redirige poliment vers ce que tu sais faire
- Sois concis et utile : 2 à 4 phrases maximum par réponse
- En cas de doute sur un prix, suggère d'appeler pour obtenir un devis personnalisé
- Ne promets jamais de choses qui ne sont pas listées ci-dessus
`.trim();

/** Nettoie et valide l'historique envoyé par le navigateur. */
function sanitize(messages) {
  if (!Array.isArray(messages)) return [];
  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
    .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 1000) }] }))
    .slice(-12);
  // Gemini exige que la conversation commence par un message "user"
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY manquante dans les variables d\'environnement Vercel');
    return res.status(500).json({ error: 'Chatbot non configuré' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const contents = sanitize(body && body.messages);
  if (!contents.length) return res.status(400).json({ error: 'Message manquant' });

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  let lastError = 'inconnue';
  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (!r.ok) {
        const detail = await r.text();
        lastError = `${model} → HTTP ${r.status} ${detail.slice(0, 300)}`;
        console.error('Gemini :', lastError);
        // Modèle retiré / introuvable : on essaie le suivant. Autre erreur (clé, quota) : inutile.
        if (r.status === 404) continue;
        break;
      }

      const data = await r.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const reply = parts.map(p => p.text || '').join('').trim();
      if (!reply) {
        lastError = `${model} → réponse vide (${data?.candidates?.[0]?.finishReason || 'raison inconnue'})`;
        console.error('Gemini :', lastError);
        continue;
      }
      return res.status(200).json({ reply });
    } catch (err) {
      lastError = `${model} → ${err.message}`;
      console.error('Gemini :', lastError);
    }
  }

  return res.status(502).json({ error: 'Service IA indisponible' });
};
