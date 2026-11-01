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

  console.log('2. Capture page /create avec dropdown des catégories...')
  await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })

  // Remplir question et réponse brutes
  const textareas = await page.$$('textarea')
  if (textareas.length >= 2) {
    await textareas[0].type('Comment bien négocier son salaire de dev junior à Lomé ?')
    await textareas[1].type("Renseigne-toi sur les grilles salariales locales et mets en avant tes projets GitHub personnels. Ne donne pas le premier chiffre et demande une réévaluation après 3 mois d'essai.")
  }

  // Cliquer sur "Générer la fiche"
  const generateBtn = await page.$('button[type="submit"]')
  if (generateBtn) {
    await generateBtn.click()
    console.log('Génération IA en cours...')
    await page.waitForSelector('#generated-fiche-form', { timeout: 25000 })
    await new Promise((r) => setTimeout(r, 1200))
  }

  // Faire défiler vers le formulaire structuré
  await page.evaluate(() => {
    const el = document.getElementById('generated-fiche-form')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await new Promise((r) => setTimeout(r, 500))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-create-category-dropdown.png'),
    fullPage: false
  })
  console.log('✓ screenshot-create-category-dropdown.png sauvegardée')

  console.log('3. Capture page d\'accueil avec badges de catégorie...')
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1000))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-home-category-badges.png'),
    fullPage: false
  })
  console.log('✓ screenshot-home-category-badges.png sauvegardée')

  console.log('3b. Capture page /explorer avec filtre par catégorie...')
  await page.goto('http://localhost:3000/explorer', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1000))
  // Choisir la catégorie 'Carrière' dans le filtre
  const selectCat = await page.$('select[aria-label="Filtrer par catégorie"]')
  if (selectCat) {
    await selectCat.select('Carrière')
    await new Promise((r) => setTimeout(r, 600))
  }
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-explorer-category-filter.png'),
    fullPage: false
  })
  console.log('✓ screenshot-explorer-category-filter.png sauvegardée')

  console.log('4. Capture page de lecture fiche Carrière / Contexte Local...')
  // Naviguer vers la fiche de négociation salariale ou CinetPay
  await page.goto('http://localhost:3000/fiche/176d1955-559a-4cbd-8c2d-315d22ca3e2c', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 800))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-fiche-carriere-reading.png'),
    fullPage: false
  })
  console.log('✓ screenshot-fiche-carriere-reading.png sauvegardée')

  await browser.close()
  console.log('\n=== CAPTURES RÉUSSIES ===')
}

main().catch((err) => {
  console.error('Erreur captures:', err)
  process.exit(1)
})
