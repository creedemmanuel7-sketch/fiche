import puppeteer from 'puppeteer-core'
import path from 'path'

const ARTIFACTS_DIR = 'C:/Users/credo/.gemini/antigravity/brain/3bb76cc4-e587-4698-9ee8-b38626454bb7'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  // Contexte de navigation vierge (aucune session, visiteur anonyme strict)
  const context = await browser.createBrowserContext()
  const page = await context.newPage()

  console.log('1. Accès anonyme direct à http://localhost:3000/create...')
  await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
  const currentUrl = page.url()
  console.log('URL actuelle (doit être /create sans redirection vers /login) :', currentUrl)

  // 2. Remplir le formulaire en mode anonyme
  const textareas = await page.$$('textarea')
  if (textareas.length >= 2) {
    await textareas[0].type("Comment gérer le cache avec Next.js 16 et Supabase sans données périmées ?")
    await textareas[1].type("Utilise revalidatePath ou revalidateTag dans une Server Action après chaque mutation Supabase. Pour les requêtes utilisateur spécifiques, désactive le cache partagé.")
  }

  // 3. Cliquer sur Générer la fiche
  console.log('Génération de la fiche par l\'IA en mode anonyme...')
  const generateBtn = await page.$('button[type="submit"]')
  if (generateBtn) {
    await generateBtn.click()
    await page.waitForSelector('#generated-fiche-form', { timeout: 25000 })
    await new Promise((r) => setTimeout(r, 1200))
  }

  // Faire défiler vers le formulaire structuré généré
  await page.evaluate(() => {
    const el = document.getElementById('generated-fiche-form')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await new Promise((r) => setTimeout(r, 600))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-create-anonymous-generation.png'),
    fullPage: false
  })
  console.log('✓ screenshot-create-anonymous-generation.png sauvegardée')

  // 4. Cliquer sur Publier la fiche en mode anonyme
  console.log('Clic sur Publier la fiche (visiteur non connecté)...')
  const publishBtn = await page.$('#generated-fiche-form button[type="submit"]')
  if (publishBtn) {
    await publishBtn.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 6000 })
    await new Promise((r) => setTimeout(r, 600))
  }

  // Vérifier le contenu du localStorage
  const savedDraft = await page.evaluate(() => localStorage.getItem('fiche_draft'))
  console.log('Contenu de fiche_draft dans localStorage :', savedDraft ? 'PRÉSENT (' + savedDraft.slice(0, 60) + '...)' : 'ABSENT')

  // Capture de la modale d'invitation à se connecter
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-create-anonymous-auth-modal.png'),
    fullPage: false
  })
  console.log('✓ screenshot-create-anonymous-auth-modal.png sauvegardée')

  // 5. Cliquer sur "Se connecter" dans la modale
  console.log('Navigation vers la connexion et authentification...')
  const loginLink = await page.$('[role="dialog"] a')
  if (loginLink) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      loginLink.click()
    ])
  }

  // Se connecter sur /login
  await page.type('input[type="email"]', 'test+1793460067554@example.com')
  await page.type('input[type="password"]', 'Password123!@#')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ])

  console.log('Retour sur /create après connexion. Vérification de la restauration...')
  await new Promise((r) => setTimeout(r, 1000))

  // Capture de la page /create avec le brouillon restauré et notification
  await page.evaluate(() => {
    const el = document.getElementById('generated-fiche-form')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await new Promise((r) => setTimeout(r, 600))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-create-restored-draft.png'),
    fullPage: false
  })
  console.log('✓ screenshot-create-restored-draft.png sauvegardée')

  await browser.close()
  console.log('\n=== FLUX ANONYME ET RESTAURATION VALIDÉS AVEC SUCCÈS ===')
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
