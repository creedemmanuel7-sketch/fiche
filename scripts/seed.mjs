import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

const RAW_ITEMS = [
  {
    rawQuestion: "Comment gérer les variables d'environnement dans Next.js 14+ sans les exposer au client ?",
    rawAnswer: "Dans Next.js, toutes les variables définies dans .env.local sont strictement réservées au serveur par défaut (process.env.SECRET_KEY). Pour qu'une variable soit accessible côté navigateur (client component), elle DOIT obligatoirement commencer par le préfixe NEXT_PUBLIC_ (ex: NEXT_PUBLIC_API_URL). Ne mets jamais de clés privées, tokens API ou mots de passe de base de données avec le préfixe NEXT_PUBLIC_, sinon ils apparaîtront en clair dans le bundle JavaScript téléchargé par l'utilisateur."
  },
  {
    rawQuestion: "Mon serveur Node.js crash avec l'erreur 'EADDRINUSE: address already in use :::3000', comment régler ça ?",
    rawAnswer: "L'erreur EADDRINUSE signifie qu'un processus utilise déjà le port 3000 (souvent une instance précédente de ton serveur qui est restée active en arrière-plan). Sur Linux ou macOS, tape 'lsof -i :3000' puis 'kill -9 <PID>' pour tuer le processus. Sur Windows PowerShell, tape 'Get-NetTCPConnection -LocalPort 3000' pour trouver l'OwningProcess, puis 'Stop-Process -Id <PID> -Force'. Tu peux aussi lancer ton serveur sur un autre port en définissant la variable d'environnement PORT=3001."
  },
  {
    rawQuestion: "Comment faire un déploiement gratuit sur Vercel depuis GitHub ?",
    rawAnswer: "1. Pousse ton projet sur un dépôt GitHub (public ou privé). 2. Rends-toi sur vercel.com et connecte-toi avec ton compte GitHub. 3. Clique sur 'Add New Project' et sélectionne ton dépôt. 4. Vercel détecte automatiquement Next.js ou React. 5. Ajoute tes variables d'environnement dans la section 'Environment Variables' si ton projet en utilise. 6. Clique sur 'Deploy'. À chaque nouveau 'git push origin main', Vercel redéploiera automatiquement ton site avec un certificat SSL gratuit."
  },
  {
    rawQuestion: "Quelle est la différence concrète entre let, const et var en JavaScript ?",
    rawAnswer: "var est une ancienne syntaxe à portée de fonction (function-scoped) avec un comportement de 'hoisting' qui cause souvent des bugs subtils. const et let sont introduits avec ES6 et ont une portée de bloc (block-scoped). Utilise 'const' par défaut pour toute variable dont la référence ne doit pas être réassignée (objets, tableaux, fonctions, valeurs fixes). Utilise 'let' uniquement lorsque la valeur doit être réassignée au fil du temps (comme un compteur de boucle ou un accumulateur). N'utilise plus jamais 'var'."
  },
  {
    rawQuestion: "Comment centrer parfaitement un élément horizontalement et verticalement en CSS moderne et Tailwind ?",
    rawAnswer: "En CSS pur moderne, la méthode la plus simple et robuste est le Grid sur le conteneur parent : 'display: grid; place-items: center; min-height: 100vh;'. Avec Flexbox, c'est 'display: flex; justify-content: center; align-items: center;'. En Tailwind CSS, applique simplement les classes 'flex items-center justify-center' ou 'grid place-items-center' sur l'élément parent. Assure-toi que le parent a une hauteur définie (ex: 'h-screen' ou 'min-h-[300px]') sinon l'alignement vertical ne se verra pas."
  },
  {
    rawQuestion: "Comment résoudre proprement un conflit de fusion (merge conflict) avec Git ?",
    rawAnswer: "Quand Git signale un conflit lors d'un 'git merge' ou 'git pull', il insère des balises <<<<<<< HEAD, ======= et >>>>>>> dans les fichiers concernés. 1. Fais 'git status' pour identifier les fichiers en conflit. 2. Ouvre chaque fichier dans VS Code (qui propose des boutons pratiques : 'Accept Current', 'Accept Incoming' ou 'Accept Both'). 3. Supprime les marqueurs de conflit et conserve le code correct. 4. Teste ton application pour vérifier qu'elle compile. 5. Marque le conflit comme résolu avec 'git add <fichier>'. 6. Termine la fusion avec 'git commit -m \"fix: resolve merge conflicts\"'."
  },
  {
    rawQuestion: "Mon frontend React bloque avec l'erreur 'Access-Control-Allow-Origin missing' (CORS), comment résoudre ça ?",
    rawAnswer: "L'erreur CORS (Cross-Origin Resource Sharing) est une sécurité appliquée par le navigateur, PAS par le frontend. Le navigateur bloque la réponse si l'API ne lui renvoie pas les bons en-têtes HTTP. La solution doit être faite côté backend : ajoute les headers 'Access-Control-Allow-Origin: *' (ou l'URL précise de ton frontend), 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS', et 'Access-Control-Allow-Headers: Content-Type, Authorization'. Si tu utilises Express.js, installe simplement le middleware 'cors' : 'app.use(cors())'. Pour le préflight, réponds HTTP 204 ou 200 à la méthode OPTIONS."
  },
  {
    rawQuestion: "Comment corriger l'erreur 'Hydration failed because the initial UI does not match' dans Next.js ?",
    rawAnswer: "Cette erreur d'hydratation survient quand le HTML généré côté serveur (SSR) diffère du premier rendu exécuté par React dans le navigateur (client). Causes fréquentes : 1. Utilisation de 'window', 'localStorage' ou 'navigator' directement dans le corps du composant avant le montage. 2. Affichage d'une date (new Date().toLocaleDateString()) où le fuseau horaire du serveur diffère de celui du client. 3. Balises HTML imbriquées invalides (ex: un <p> dans un <p>, ou une <div> dans un <p>). Solution : effectue les lectures client uniquement dans un useEffect() avec un state 'mounted', ou utilise 'suppressHydrationWarning' sur les éléments concernés."
  },
  {
    rawQuestion: "J'ai fait un git commit par erreur sans vouloir perdre mon travail, comment l'annuler ?",
    rawAnswer: "Pour annuler ton dernier commit tout en conservant toutes tes modifications intactes dans ton dossier de travail, utilise la commande : 'git reset --soft HEAD~1'. Tes fichiers resteront indexés dans la staging area. Si tu souhaites aussi désindexer les fichiers sans perdre le code, fais 'git reset HEAD~1'. N'utilise 'git reset --hard HEAD~1' que si tu es absolument certain de vouloir détruire définitivement le code écrit lors de ce commit."
  },
  {
    rawQuestion: "Pourquoi mes requêtes Supabase retournent un tableau vide [] alors que des données existent dans la table ?",
    rawAnswer: "Dans 99% des cas, cela est dû aux Row Level Security (RLS) activées sur la table Supabase sans politique (Policy) de lecture permissive. Par défaut, quand RLS est activé, Supabase bloque tous les accès pour la clé anonyme (anon key) et retourne un tableau vide sans déclencher d'erreur explicite. Solution : va dans le Dashboard Supabase -> Authentication -> Policies, et ajoute une politique 'FOR SELECT USING (true)' pour une lecture publique, ou 'USING (auth.uid() = user_id)' pour restreindre à l'utilisateur connecté."
  },
  {
    rawQuestion: "Comment sécuriser la réception d'un webhook de paiement Mobile Money (FedaPay, Paydunya, CinetPay) en Node.js ?",
    rawAnswer: "1. Récupère la signature secrète envoyée par la passerelle dans les headers (ex: X-Signature ou X-Paydunya-Token). 2. Calcule localement le HMAC-SHA256 du body brut avec ta clé secrète de webhook (webhook secret) et compare les signatures avec 'crypto.timingSafeEqual' pour éviter les attaques temporelles. 3. Ne te fie JAMAIS uniquement aux données envoyées dans le webhook : après réception d'un statut 'approved', fais toujours un appel sortant vers l'API officielle de la passerelle avec le transaction_id pour revérifier le montant et le statut réel avant de créditer l'utilisateur. 4. Retourne immédiatement un statut HTTP 200 à la passerelle."
  },
  {
    rawQuestion: "Comment dockeriser une application Next.js pour avoir une image ultra-légère de moins de 150 Mo ?",
    rawAnswer: "1. Dans ton fichier 'next.config.js' (ou next.config.ts), ajoute l'option : 'output: \"standalone\"'. 2. Crée un Dockerfile multi-stage avec 3 étapes : 'base', 'deps' (npm ci), 'builder' (npm run build) et 'runner' utilisant l'image officielle node:alpine. 3. Dans l'étape 'runner', copie uniquement le dossier '.next/standalone' et le dossier 'public'. Next.js ne copiera que les modules node_modules strictement nécessaires à l'exécution. Cela réduit l'image Docker de plus de 1 Go à environ 120-140 Mo."
  },
  {
    rawQuestion: "Quelle est la différence entre any et unknown en TypeScript et pourquoi privilégier unknown ?",
    rawAnswer: "'any' désactive complètement le vérificateur de types de TypeScript : tu peux tout faire avec (accéder à des propriétés inexistantes, l'appeler comme une fonction) sans aucune erreur à la compilation, ce qui détruit la sécurité du typage. 'unknown' représente une valeur dont le type n'est pas encore connu, mais TypeScript t'OBLIGE à vérifier son type (type narrowing avec typeof, instanceof ou zod) avant de pouvoir l'utiliser ou appeler ses méthodes. Utilise toujours 'unknown' pour typer des données provenant de sources externes (APIs, JSON.parse, catch(error))."
  },
  {
    rawQuestion: "Mon useEffect dans React s'exécute en boucle infinie et fait planter mon navigateur, d'où vient l'erreur ?",
    rawAnswer: "Une boucle infinie dans useEffect survient lorsque l'effet met à jour un state qui fait partie directe ou indirecte de son propre tableau de dépendances. Exemple typique : appeler setUsers(data) dans un useEffect qui a [users] en dépendance, ou passer un objet/tableau recréé à chaque render dans les dépendances (la référence mémoire change à chaque render). Solution : 1. Si l'effet ne doit tourner qu'au montage du composant, passe un tableau de dépendances vide '[]'. 2. Si tu dois mettre à jour un state en te basant sur sa valeur précédente, utilise la forme fonctionnelle : 'setCount(prev => prev + 1)'. 3. Mémorise les objets ou fonctions passés en dépendance avec 'useMemo' ou 'useCallback'."
  },
  {
    rawQuestion: "Git refuse mon push avec l'erreur '[rejected - non-fast-forward]', que faire sans écraser le travail de l'équipe ?",
    rawAnswer: "Cette erreur indique que des commits ont été poussés sur la branche distante depuis ton dernier 'git pull'. Git t'empêche de pousser pour ne pas écraser les commits de tes collègues. Ne fais SURTOUT PAS 'git push --force' ! La bonne pratique : 1. Tape 'git pull --rebase origin main'. Cela va récupérer les nouveaux commits distants et rejouer tes commits locaux par-dessus. 2. S'il y a des conflits, résous-les, puis fais 'git rebase --continue'. 3. Une fois terminé, pousse normalement avec 'git push origin main'."
  },
  {
    rawQuestion: "Pourquoi mon application Next.js / Supabase atteint l'erreur 'max_connections' sur Vercel et comment configurer le pooling ?",
    rawAnswer: "Vercel exécute tes Server Components et Serverless Functions dans des instances isolées. Si 50 visiteurs arrivent simultanément, 50 fonctions s'ouvrent et créent 50 connexions PostgreSQL directes, ce qui sature instantanément la limite de connexions de la base de données. Solution : utilise Supavisor (le connection pooler de Supabase). Dans tes variables d'environnement, utilise l'URL de pooling en mode 'Transaction' (port 6543) plutôt que la connexion directe (port 5432). Si tu utilises un ORM comme Prisma ou Drizzle, configure 'pgbouncer=true' et limite le pool client à 1 connexion par fonction."
  },
  {
    rawQuestion: "Comment éviter le flash blanc (FOUC) au rechargement de page quand l'utilisateur est en mode sombre ?",
    rawAnswer: "Le flash blanc survient quand le navigateur télécharge et peint le HTML par défaut (mode clair) avant que le code JavaScript client n'ait pu lire le 'localStorage' pour appliquer la classe '.dark'. Solution : insère un script synchrone inline bloquant dans le <head> de ton HTML (avant le body). Ce script vérifie immédiatement 'localStorage.getItem(\"theme\")' ou 'window.matchMedia(\"(prefers-color-scheme: dark)\").matches', et applique immédiatement la classe 'dark' sur l'élément <html> avant le premier rendu du body. Si tu utilises Next.js, utilise le package 'next-themes' avec 'enableSystem' et 'attribute=\"class\"'."
  },
  {
    rawQuestion: "Comment rafraîchir des données statiques dans Next.js avec Incremental Static Regeneration (ISR) ?",
    rawAnswer: "Next.js permet de générer des pages statiques ultra-rapides tout en les mettant à jour périodiquement en arrière-plan sans reconstruire tout le site. 1. Au niveau d'un appel fetch : passe l'option '{ next: { revalidate: 3600 } }' pour rafraîchir la donnée toutes les heures. 2. Au niveau de la route (page.tsx) : exporte la constante 'export const revalidate = 60;' pour régénérer la page chaque minute. 3. Pour un rafraîchissement à la demande (ex: après publication d'un article) : crée une API route appelant 'revalidatePath(\"/fiches\")' ou 'revalidateTag(\"articles\")'."
  },
  {
    rawQuestion: "Mon npm install échoue avec 'ENOSPC' ou manque de mémoire sur un VPS Linux à 1 Go de RAM, comment faire ?",
    rawAnswer: "Sur un VPS d'entrée de gamme (souvent 1 Go de RAM), les packages lourds saturent la mémoire vive et le kernel Linux tue le processus npm. Solution efficace en 2 étapes : 1. Crée un fichier de swap de 2 Go : 'sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile'. 2. Utilise 'npm ci --prefer-offline --no-audit' ou passe à 'pnpm' qui consomme jusqu'à 3 fois moins de mémoire et d'espace disque grâce au partage de hardlinks."
  },
  {
    rawQuestion: "Comment gérer automatiquement le rafraîchissement d'un token JWT expiré avec un refresh token ?",
    rawAnswer: "Utilise un intercepteur HTTP (ex: Axios Interceptors ou un wrapper Fetch). 1. À chaque requête, ajoute le header 'Authorization: Bearer <accessToken>'. 2. Si le serveur répond avec un statut HTTP 401 (token expiré), intercepte l'erreur. 3. Mets en pause les requêtes sortantes dans une file d'attente (queue). 4. Envoie une requête à '/api/auth/refresh' avec le refreshToken (idéalement stocké dans un cookie httpOnly sécurisé). 5. Reçois le nouvel accessToken, mets à jour ton client, et rejoue automatiquement toutes les requêtes qui étaient en attente. Si le refresh échoue, déconnecte l'utilisateur et redirige vers '/login'."
  },
  {
    rawQuestion: "Comment négocier son salaire quand on est un développeur junior à Lomé ?",
    rawAnswer: "Ne donne jamais le premier chiffre. Renseigne-toi sur les grilles locales. Mets en avant tes projets personnels (Fiche, GitHub) car les entreprises locales valorisent l'initiative. N'hésite pas à demander une période d'essai avec un salaire plus bas, puis une revalorisation après 3 mois."
  },
  {
    rawQuestion: "Quelle est la meilleure façon de gérer un client au Togo qui change tout le temps d'avis sur un projet ?",
    rawAnswer: "Facture les modifications. Bloque le périmètre (scope) dans un contrat simple. Utilise un outil de gestion de tâches (Trello) pour que le client voie l'impact de chaque ajout. Communique beaucoup à l'écrit."
  },
  {
    rawQuestion: "Comment intégrer Mobile Money (CinetPay) sur une app Next.js sans péter les plombs ?",
    rawAnswer: "Ne fais jamais confiance au frontend pour valider un paiement. Fais un webhook côté serveur qui vérifie la signature. Utilise des transactions de test. Prépare-toi à gérer les callbacks qui arrivent en retard."
  },
  {
    rawQuestion: "Comment gérer une équipe de juniors quand on est le seul senior dans une startup tech locale ?",
    rawAnswer: "Mets en place des revues de code systématiques (PR). Crée une doc interne (sur Fiche !). Apprends-leur à poser des questions après avoir cherché pendant 15 minutes. Délègue des petites tâches complètes, pas juste des bouts de code."
  },
  {
    rawQuestion: "Est-ce que les entreprises locales regardent les profils GitHub ?",
    rawAnswer: "De plus en plus. Un profil GitHub actif avec des projets comme Fiche (même petits) vaut plus qu'un CV avec 5 ans d'expérience non vérifiable. Les recruteurs techniques locaux vont regarder tes commits."
  }
]

const STRUCTURE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Titre court et clair de la fiche (max 80 caractères)' },
    problem: { type: 'string', description: 'Le problème reformulé de manière générale et compréhensible' },
    solution: { type: 'string', description: 'La solution technique expliquée clairement, étape par étape si besoin' },
    category: {
      type: 'string',
      enum: ['Code', 'Carrière', 'Méthodo', 'Contexte Local', 'Soft Skills'],
      description: 'La catégorie de la fiche selon le type de savoir'
    },
    tags: { type: 'array', items: { type: 'string' }, description: '3 à 5 mots-clés en minuscules (ex: react, css, git)' },
    stack: { type: 'array', items: { type: 'string' }, description: 'Les technologies concernées (ex: Next.js, Tailwind, Python)' }
  },
  required: ['title', 'problem', 'solution', 'category', 'tags', 'stack']
}

async function main() {
  console.log('=== INITIALISATION DU SCRIPT DE SEED (20 FICHES) ===')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Variables Supabase manquantes dans .env.local')
  }
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY manquante dans .env.local')
  }

  // 1. Initialisation de Gemini
  const ai = new GoogleGenAI({ apiKey: geminiApiKey })

  // 2. Initialisation Supabase & Auteur
  let supabase
  let authorId = null

  if (serviceKey && serviceKey !== '[SENSITIVE]') {
    console.log('Utilisation de SUPABASE_SERVICE_ROLE_KEY...')
    supabase = createClient(supabaseUrl, serviceKey)

    // Trouver un profil existant
    const { data: profiles } = await supabase.from('profiles').select('id, email').limit(1)
    if (profiles && profiles.length > 0) {
      authorId = profiles[0].id
      console.log(`Auteur assigné depuis profiles : ${profiles[0].email} (${authorId})`)
    }
  }

  if (!authorId) {
    console.log('Connexion via le compte principal pour obtenir author_id...')
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
      email: 'test+1793460067554@example.com',
      password: 'Password123!@#'
    })

    if (authErr || !authData?.user) {
      throw new Error('Échec de connexion utilisateur principal: ' + (authErr?.message || 'Inconnu'))
    }

    supabase = anonClient
    authorId = authData.user.id
    console.log(`Auteur authentifié avec succès : ${authData.user.email} (${authorId})`)
  }

  console.log(`\nDébut de la transformation et insertion de ${RAW_ITEMS.length} fiches...\n`)

  const generatedTitles = []

  for (let i = 0; i < RAW_ITEMS.length; i++) {
    const item = RAW_ITEMS[i]

    // Vérifier si la fiche a déjà été insérée
    const { data: existingFiche } = await supabase
      .from('fiches')
      .select('id, title')
      .eq('original_question', item.rawQuestion)
      .maybeSingle()

    if (existingFiche) {
      console.log(`[${i + 1}/${RAW_ITEMS.length}] Déjà présente en base : "${existingFiche.title}"`)
      continue
    }

    console.log(`[${i + 1}/${RAW_ITEMS.length}] Transformation par Gemini : "${item.rawQuestion.slice(0, 45)}..."`)

    const prompt = `Tu es un assistant qui transforme des échanges bruts (WhatsApp, Slack, forums) en fiches de connaissance capitalisées. 
Tu dois être capable de traiter aussi bien du code (React, Node) que du savoir professionnel (carrière, gestion de projet, conseils, retours d'expérience).
Pour chaque fiche, tu dois déterminer une 'Catégorie' parmi les suivantes :
- 'Code' : Problèmes techniques, syntaxe, bugs, architecture.
- 'Carrière' : Négociation, entretiens, évolution, salaires.
- 'Méthodo' : Gestion de projet, agile, organisation d'équipe.
- 'Contexte Local' : Infos spécifiques à l'Afrique/Togo (Mobile Money, internet, entreprises locales).
- 'Soft Skills' : Communication, management, posture pro.

Réponds UNIQUEMENT en JSON valide selon le schéma fourni.

Question brute :
${item.rawQuestion}

Réponse brute :
${item.rawAnswer}`

    let outputText = null
    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash']

    for (const m of models) {
      try {
        const interaction = await ai.interactions.create({
          model: m,
          input: prompt,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: STRUCTURE_SCHEMA,
          },
        })
        outputText = interaction.output_text
        if (outputText) break
      } catch (err) {
        continue
      }
    }

    if (!outputText) {
      console.warn(`Avertissement : Échec Gemini sur l'élément ${i + 1}, repli sur données brutes`)
      outputText = JSON.stringify({
        title: item.rawQuestion.slice(0, 75),
        problem: item.rawQuestion,
        solution: item.rawAnswer,
        category: 'Contexte Local',
        tags: ['technique', 'senior', 'conseil'],
        stack: ['Expérience', 'Management']
      })
    }

    const structured = JSON.parse(outputText)
    generatedTitles.push(structured.title)

    // Insérer dans Supabase
    const insertPayload = {
      title: structured.title,
      problem: structured.problem,
      solution: structured.solution,
      category: structured.category || 'Code',
      original_question: item.rawQuestion,
      tags: structured.tags || [],
      stack: structured.stack || [],
      author_id: authorId,
      view_count: 0,
      useful_count: 0,
    }

    let { error: insertError } = await supabase.from('fiches').insert(insertPayload)

    if (insertError && (insertError.message?.includes('category') || insertError.code === '42703')) {
      delete insertPayload.category
      const retry = await supabase.from('fiches').insert(insertPayload)
      insertError = retry.error
    }

    if (insertError) {
      console.error(`Erreur insertion fiche ${i + 1}:`, insertError.message)
    } else {
      console.log(`✓ Insérée avec succès [${structured.category || 'Code'}] : "${structured.title}"`)
    }

    // Petite pause pour respecter le rate limiting de l'API Gemini
    await new Promise((r) => setTimeout(r, 600))
  }

  console.log('\n=== SEEDING TERMINÉ AVEC SUCCÈS ===')
  console.log(`Total fiches générées et insérées : ${generatedTitles.length}`)
  console.log('\nListe des 20 titres de fiches :')
  generatedTitles.forEach((title, idx) => {
    console.log(`${idx + 1}. ${title}`)
  })
}

main().catch((err) => {
  console.error('\nErreur fatale script seed:', err)
  process.exit(1)
})
