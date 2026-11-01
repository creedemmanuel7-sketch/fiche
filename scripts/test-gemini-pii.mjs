import { GoogleGenAI } from '@google/genai'

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const rawQuestion = "Salut, c'est M. Kodjo de chez Ecobank. Comment intégrer CinetPay ? Mon numéro est le +228 90 12 34 56."
  const rawAnswer = "Bonjour M. Kodjo (+228 90 12 34 56), pour intégrer l'API CinetPay avec votre compte Ecobank, il faut générer vos clés API dans le dashboard et configurer le webhook avec signature HMAC. En cas de blocage, rappelez au +228 90 12 34 56."

  const prompt = `Tu es un assistant de structuration de connaissances. 
AVANT TOUTE CHOSE, tu dois anonymiser les données personnelles (PII) présentes dans le texte brut :
- Remplace tous les numéros de téléphone (ex: +228 90 00 00 00, 90000000) par le texte exact : [NUMÉRO MASQUÉ].
- Remplace tous les noms de personnes ou d'entreprises spécifiques par des termes génériques (ex: [NOM MASQUÉ], [ENTREPRISE LOCALE]).
- Ne conserve aucune adresse email personnelle (remplace par [EMAIL MASQUÉ]).
Ensuite, et seulement ensuite, structure la fiche selon le schéma JSON demandé. Si tu décris la demande ou le contexte dans le problème ou la solution, conserve la mention anonymisée avec [NOM MASQUÉ], [ENTREPRISE LOCALE] et [NUMÉRO MASQUÉ].

Tu dois être capable de traiter aussi bien du code (React, Node) que du savoir professionnel (carrière, gestion de projet, conseils, retours d'expérience).
Pour chaque fiche, tu dois déterminer une 'Catégorie' parmi les suivantes :
- 'Code' : Problèmes techniques, syntaxe, bugs, architecture.
- 'Carrière' : Négociation, entretiens, évolution, salaires.
- 'Méthodo' : Gestion de projet, agile, organisation d'équipe.
- 'Contexte Local' : Infos spécifiques à l'Afrique/Togo (Mobile Money, internet, entreprises locales).
- 'Soft Skills' : Communication, management, posture pro.

Réponds UNIQUEMENT en JSON valide selon le schéma fourni.

Question brute :
${rawQuestion}

Réponse brute :
${rawAnswer}`

  const SCHEMA = {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Titre court et clair de la fiche (max 80 caractères)' },
      problem: { type: 'string', description: 'Le problème reformulé. Tout nom ou contact doit être strictement anonymisé avec [NOM MASQUÉ], [ENTREPRISE LOCALE] et [NUMÉRO MASQUÉ]' },
      solution: { type: 'string', description: 'La solution technique expliquée clairement étape par étape. Tout nom ou contact doit être anonymisé avec [NOM MASQUÉ], [ENTREPRISE LOCALE] ou [NUMÉRO MASQUÉ]' },
      category: { type: 'string', enum: ['Code', 'Carrière', 'Méthodo', 'Contexte Local', 'Soft Skills'] },
      tags: { type: 'array', items: { type: 'string' } },
      stack: { type: 'array', items: { type: 'string' } }
    },
    required: ['title', 'problem', 'solution', 'category', 'tags', 'stack']
  }

  const res = await ai.interactions.create({
    model: 'gemini-3.5-flash-lite',
    input: prompt,
    response_format: { type: 'text', mime_type: 'application/json', schema: SCHEMA }
  })

  console.log('--- OUTPUT JSON ---')
  console.log(res.output_text)
}

main().catch(console.error)
