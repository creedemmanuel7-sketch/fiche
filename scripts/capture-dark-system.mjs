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

    console.log('1. Accès à la page d\'accueil (Mode Dark-First)...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))

    // Vérifier les tokens calculés sur le body
    const bodyStyles = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.body)
      return {
        bgColor: computed.backgroundColor,
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontFeatureSettings: computed.fontFeatureSettings,
      }
    })
    console.log('Styles calculés Body:', bodyStyles)

    // Vérifier les cartes de fiches (Surface 1 / Pas de drop shadows)
    const cardStyles = await page.evaluate(() => {
      const card = document.querySelector('a[href^="/fiche/"]')?.closest('div')
      if (!card) return null
      const computed = window.getComputedStyle(card)
      return {
        bgColor: computed.backgroundColor,
        border: computed.borderColor,
        boxShadow: computed.boxShadow,
      }
    })
    console.log('Styles calculés FicheCard:', cardStyles)

    const homeScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-dark-first-home.png')
    await page.screenshot({ path: homeScreenshotPath, fullPage: false })
    console.log('✓ Capture d\'écran Accueil enregistrée:', homeScreenshotPath)

    // Trouver un lien de fiche
    const ficheHref = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/fiche/"]')
      return link ? link.getAttribute('href') : null
    })

    if (ficheHref) {
      console.log(`2. Navigation vers la fiche ${ficheHref}...`)
      await page.goto(`http://localhost:3000${ficheHref}`, { waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, 1200))

      const ficheScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-dark-first-fiche.png')
      await page.screenshot({ path: ficheScreenshotPath, fullPage: false })
      console.log('✓ Capture d\'écran Fiche enregistrée:', ficheScreenshotPath)
    } else {
      console.log('⚠ Aucune fiche trouvée sur la page d\'accueil.')
    }

    // 3. Vérification mobile 16px sur les inputs
    console.log('3. Test sur mobile (largeur 375px) pour la règle des inputs à 16px...')
    const mobilePage = await browser.newPage()
    await mobilePage.setViewport({ width: 375, height: 812, isMobile: true })
    await mobilePage.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    const mobileInputStyles = await mobilePage.evaluate(() => {
      const textarea = document.querySelector('textarea')
      if (!textarea) return null
      const computed = window.getComputedStyle(textarea)
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
      }
    })
    console.log('Styles input/textarea mobile (< 768px):', mobileInputStyles)

    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-dark-first-mobile-input.png')
    await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false })
    console.log('✓ Capture mobile enregistrée:', mobileScreenshotPath)

  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error('Erreur:', err)
  process.exit(1)
})
