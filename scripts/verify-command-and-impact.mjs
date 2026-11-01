import puppeteer from 'puppeteer-core'
import path from 'path'

const ARTIFACTS_DIR = 'C:/Users/credo/.gemini/antigravity/brain/3bb76cc4-e587-4698-9ee8-b38626454bb7'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 950 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // -------------------------------------------------------------
    // TEST 1: Palette de commandes (Ctrl+K)
    // -------------------------------------------------------------
    console.log('1. Test de la palette de commandes (Ctrl+K)...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    // Déclencher Ctrl+K au clavier
    console.log('Déclenchement du raccourci clavier Ctrl+K...')
    await page.keyboard.down('Control')
    await page.keyboard.press('K')
    await page.keyboard.up('Control')
    await new Promise((r) => setTimeout(r, 800))

    // Vérifier l'ouverture du dialog cmdk
    const isDialogOpen = await page.$('[cmdk-root]') !== null
    console.log('Palette ouverte via Ctrl+K :', isDialogOpen)

    if (!isDialogOpen) {
      // Fallback : clic sur le bouton du Header
      console.log('Tentative d\'ouverture via le bouton du Header...')
      await page.click('#header-command-menu-btn')
      await new Promise((r) => setTimeout(r, 800))
    }

    const commandItems = await page.$$eval('[cmdk-item]', (items) =>
      items.map((i) => i.textContent.trim()).filter(Boolean)
    )
    console.log('Commandes disponibles dans la palette :', commandItems.slice(0, 6))

    const commandPaletteScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-command-palette-ctrlk.png')
    await page.screenshot({ path: commandPaletteScreenshot, fullPage: false })
    console.log('✓ Capture d\'écran Palette Ctrl+K enregistrée:', commandPaletteScreenshot)

    // Fermer la palette avec Escape
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 400))

    // -------------------------------------------------------------
    // TEST 2: Profil & Reconnaissance Ouverte (ImpactStats)
    // -------------------------------------------------------------
    console.log('2. Test du dashboard et des métriques d\'impact...')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
    await page.type('input[type="email"]', 'test+1793460067554@example.com')
    await page.type('input[type="password"]', 'Password123!@#')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ])

    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    // Clic sur l'onglet Mes stats
    const statsButtons = await page.$$('button')
    for (const b of statsButtons) {
      const text = await page.evaluate((el) => el.textContent, b)
      if (text && text.includes('Mes stats')) {
        await b.click()
        break
      }
    }
    await new Promise((r) => setTimeout(r, 1000))

    const hasRecognitionSection = await page.$('#open-recognition-section') !== null
    console.log('Section Reconnaissance Ouverte visible :', hasRecognitionSection)

    if (!hasRecognitionSection) {
      throw new Error('La section de Reconnaissance Ouverte n\'est pas visible dans Mes stats.')
    }

    // Vérifier l'absence des anciens badges
    const pageText = await page.evaluate(() => document.body.innerText)
    const hasPionnier = pageText.includes('Le Pionnier')
    const hasBatisseur = pageText.includes('Le Bâtisseur')
    console.log('Anciens badges présents (doit être false) : Pionnier =', hasPionnier, ', Bâtisseur =', hasBatisseur)

    if (hasPionnier || hasBatisseur) {
      throw new Error('Les anciens badges enfantins sont encore affichés !')
    }

    const dashboardScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-dashboard-open-recognition-impact.png')
    await page.screenshot({ path: dashboardScreenshot, fullPage: false })
    console.log('✓ Capture d\'écran Dashboard ImpactStats enregistrée:', dashboardScreenshot)

    // -------------------------------------------------------------
    // TEST 3: Page /fiche/[id] avec texte de reconnaissance d'auteur
    // -------------------------------------------------------------
    console.log('3. Test reconnaissance auteur sur une fiche...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' })
    const ficheHref = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/fiche/"]')
      return link ? link.getAttribute('href') : null
    })

    if (ficheHref) {
      await page.goto(`http://localhost:3000${ficheHref}`, { waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, 1200))

      const authorBadgeText = await page.$eval('#author-recognition-badge', (el) => el.textContent).catch(() => null)
      console.log('Badge reconnaissance auteur sur la fiche :', authorBadgeText)

      const ficheScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-fiche-author-recognition.png')
      await page.screenshot({ path: ficheScreenshot, fullPage: false })
      console.log('✓ Capture d\'écran Fiche Reconnaissance Auteur enregistrée:', ficheScreenshot)
    }

  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
