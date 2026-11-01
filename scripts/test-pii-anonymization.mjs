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

  const page = await browser.newPage()

  console.log('1. Connexion utilisateur...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
  await page.type('input[type="email"]', 'test+1793460067554@example.com')
  await page.type('input[type="password"]', 'Password123!@#')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ])

  console.log('2. Accès à /create et capture de l\'avertissement de confidentialité...')
  await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-create-privacy-warning.png'),
    fullPage: false
  })
  console.log('✓ screenshot-create-privacy-warning.png sauvegardée')

  console.log('3. Test réel de l\'API /api/structure avec le texte contenant PII...')
  const rawQuestion = "Salut, c'est M. Kodjo de chez Ecobank. Comment intégrer CinetPay ? Mon numéro est le +228 90 12 34 56."
  const rawAnswer = "Bonjour M. Kodjo, pour intégrer CinetPay sur votre système, suivez la documentation officielle. Configurez un webhook sécurisé avec clé secrète côté backend pour valider les notifications de paiement. Vous pouvez joindre notre équipe technique à tout moment."

  const apiResult = await page.evaluate(async (q, a) => {
    const res = await fetch('/api/structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawQuestion: q, rawAnswer: a })
    })
    const data = await res.json()
    return { status: res.status, data }
  }, rawQuestion, rawAnswer)

  console.log('Résultat API /api/structure :', JSON.stringify(apiResult, null, 2))

  // Remplir le formulaire avec le texte PII pour voir le résultat en UI et faire une seconde capture
  const textareas = await page.$$('textarea')
  if (textareas.length >= 2) {
    await textareas[0].type(rawQuestion)
    await textareas[1].type(rawAnswer)
  }

  const generateBtn = await page.$('button[type="submit"]')
  if (generateBtn) {
    await generateBtn.click()
    console.log('Génération UI en cours...')
    await page.waitForSelector('#generated-fiche-form', { timeout: 25000 })
    await new Promise((r) => setTimeout(r, 1200))
  }

  await page.evaluate(() => {
    const el = document.getElementById('generated-fiche-form')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await new Promise((r) => setTimeout(r, 600))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-create-pii-redacted-result.png'),
    fullPage: false
  })
  console.log('✓ screenshot-create-pii-redacted-result.png sauvegardée')

  await browser.close()
  console.log('=== TEST ET CAPTURES TERMINÉS ===')
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
