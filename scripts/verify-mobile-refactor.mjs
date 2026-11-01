import puppeteer from 'puppeteer-core'
import path from 'path'

const ARTIFACTS_DIR = 'C:/Users/credo/.gemini/antigravity/brain/3bb76cc4-e587-4698-9ee8-b38626454bb7'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 375, height: 812, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })

    // -------------------------------------------------------------
    // TEST 1: Header Mobile avec bouton Menu (sans débordement)
    // -------------------------------------------------------------
    console.log('1. Test du Header mobile sur écran 375px...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    const hasMobileMenuTrigger = await page.$('#mobile-menu-trigger-btn') !== null
    const hasDesktopNav = await page.evaluate(() => {
      const nav = document.querySelector('header nav.hidden.md\\:flex')
      return nav ? window.getComputedStyle(nav).display !== 'none' : false
    })

    console.log('Bouton Menu Hamburger présent :', hasMobileMenuTrigger)
    console.log('Navigation Desktop affichée (doit être false) :', hasDesktopNav)

    if (!hasMobileMenuTrigger) {
      throw new Error('Le bouton Hamburger #mobile-menu-trigger-btn est introuvable sur mobile.')
    }
    if (hasDesktopNav) {
      throw new Error('La navigation desktop ne doit pas s\'afficher sur mobile.')
    }

    // Vérifier l'absence de scroll horizontal sur l'accueil
    const homeScroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }))
    console.log('Scroll horizontal Accueil :', homeScroll)

    const headerScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-mobile-header-menu.png')
    await page.screenshot({ path: headerScreenshot, fullPage: false })
    console.log('✓ Capture d\'écran Header Mobile enregistrée:', headerScreenshot)

    // -------------------------------------------------------------
    // TEST 2: Ouverture du menu Hamburger (MobileMenu)
    // -------------------------------------------------------------
    console.log('2. Clic sur le bouton Hamburger pour ouvrir MobileMenu...')
    await page.click('#mobile-menu-trigger-btn')
    await new Promise((r) => setTimeout(r, 600))

    const isDrawerVisible = await page.$('#mobile-navigation-drawer') !== null
    console.log('Drawer mobile visible :', isDrawerVisible)

    if (!isDrawerVisible) {
      throw new Error('Le tiroir MobileMenu ne s\'est pas ouvert au clic.')
    }

    const drawerScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-mobile-menu-opened.png')
    await page.screenshot({ path: drawerScreenshot, fullPage: false })
    console.log('✓ Capture d\'écran Menu Hamburger Ouvert enregistrée:', drawerScreenshot)

    // Fermer le tiroir
    await page.click('#mobile-menu-close-btn')
    await new Promise((r) => setTimeout(r, 500))

    // -------------------------------------------------------------
    // TEST 3: Page /create et Bottom Action Bar (100% largeur sans débordement)
    // -------------------------------------------------------------
    console.log('3. Test de la page /create sur mobile (largeur 375px)...')
    await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    const barMetrics = await page.evaluate(() => {
      const bar = document.querySelector('#mobile-bottom-action-bar')
      if (!bar) return null
      const rect = bar.getBoundingClientRect()
      const button = bar.querySelector('button')
      const btnRect = button ? button.getBoundingClientRect() : null
      return {
        barWidth: rect.width,
        barLeft: rect.left,
        barRight: rect.right,
        btnWidth: btnRect ? btnRect.width : null,
        viewportWidth: window.innerWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
        pageClientWidth: document.documentElement.clientWidth,
      }
    })
    console.log('Métriques Barre d\'action /create mobile :', barMetrics)

    if (!barMetrics) {
      throw new Error('La barre d\'action mobile #mobile-bottom-action-bar est absente.')
    }

    if (barMetrics.barWidth > barMetrics.viewportWidth || barMetrics.pageScrollWidth > barMetrics.pageClientWidth) {
      throw new Error(`Débordement horizontal détecté sur /create : barWidth=${barMetrics.barWidth}, viewport=${barMetrics.viewportWidth}`)
    }

    const createScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-mobile-create-fixed-button.png')
    await page.screenshot({ path: createScreenshot, fullPage: false })
    console.log('✓ Capture d\'écran /create mobile enregistrée:', createScreenshot)

    // -------------------------------------------------------------
    // TEST 4: Page /explorer sans scroll horizontal
    // -------------------------------------------------------------
    console.log('4. Test de la page /explorer sur mobile...')
    await page.goto('http://localhost:3000/explorer', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    const explorerScroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }))
    console.log('Scroll horizontal Explorer :', explorerScroll)

    if (explorerScroll.hasHorizontalScroll) {
      throw new Error(`Scroll horizontal détecté sur /explorer : scrollWidth=${explorerScroll.scrollWidth}, clientWidth=${explorerScroll.clientWidth}`)
    }

    // -------------------------------------------------------------
    // TEST 5: Page /login - Vérification masquage Google OAuth
    // -------------------------------------------------------------
    console.log('5. Test de la page /login (Google OAuth masqué)...')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))

    const googleBtnPresent = await page.$('#google-auth-container') !== null
    const pageHasGoogleText = await page.evaluate(() => document.body.innerText.includes('Continuer avec Google'))
    console.log('Google Auth container présent (doit être false) :', googleBtnPresent)
    console.log('Texte Google présent (doit être false) :', pageHasGoogleText)

    if (googleBtnPresent || pageHasGoogleText) {
      throw new Error('Le bouton Google OAuth doit être masqué pour éviter l\'erreur 400.')
    }
    console.log('✓ Confirmation : Bouton Google OAuth masqué avec succès.')

  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
