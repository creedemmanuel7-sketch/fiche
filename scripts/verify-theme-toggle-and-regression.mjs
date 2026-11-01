import puppeteer from 'puppeteer-core'
import path from 'path'

const ARTIFACTS_DIR = 'C:/Users/credo/.gemini/antigravity/brain/3bb76cc4-e587-4698-9ee8-b38626454bb7'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function run() {
  console.log('--- Lancement des tests de non-régression et Theme Toggle ---')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })

    // -------------------------------------------------------------
    // TEST 1: Accueil en mode sombre par défaut
    // -------------------------------------------------------------
    console.log('1. Chargement de l\'accueil (mode sombre attendu)...')
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 1000))

    const isInitialDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark')
    })
    const initialBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    console.log(`Initial dark mode: ${isInitialDark}, body background: ${initialBg}`)
    if (!isInitialDark) {
      throw new Error('Le mode sombre devrait être actif par défaut !')
    }

    const darkScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-home-dark-mode.png')
    await page.screenshot({ path: darkScreenshotPath })
    console.log(`Capture Mode Sombre : ${darkScreenshotPath}`)

    // -------------------------------------------------------------
    // TEST 2: Clic sur le bouton de bascule vers le mode clair
    // -------------------------------------------------------------
    console.log('2. Clic sur #theme-toggle-btn...')
    await page.waitForSelector('#theme-toggle-btn', { visible: true })
    await page.click('#theme-toggle-btn')
    await new Promise(r => setTimeout(r, 600))

    const isDarkAfterClick = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark')
    })
    const lightBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    console.log(`Après toggle -> dark mode: ${isDarkAfterClick}, body background: ${lightBg}`)
    if (isDarkAfterClick) {
      throw new Error('document.documentElement.classList.contains("dark") devrait être FAUX après le clic !')
    }

    const lightScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-home-light-mode.png')
    await page.screenshot({ path: lightScreenshotPath })
    console.log(`Capture Mode Clair : ${lightScreenshotPath}`)

    // -------------------------------------------------------------
    // TEST 3: Clic pour revenir en sombre
    // -------------------------------------------------------------
    console.log('3. Deuxième clic pour revenir en mode sombre...')
    await page.click('#theme-toggle-btn')
    await new Promise(r => setTimeout(r, 600))
    const isDarkAgain = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark')
    })
    console.log(`Après 2ème toggle -> dark mode: ${isDarkAgain}`)
    if (!isDarkAgain) {
      throw new Error('Le retour au mode sombre a échoué !')
    }

    // -------------------------------------------------------------
    // TEST 4: Non-régression Palette Ctrl+K
    // -------------------------------------------------------------
    console.log('4. Test de la palette de commandes Ctrl+K...')
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyK')
    await page.keyboard.up('Control')
    await new Promise(r => setTimeout(r, 500))

    const isCommandMenuOpen = await page.evaluate(() => {
      const dialog = document.querySelector('[cmdk-root]') || document.querySelector('[cmdk-dialog]')
      return !!dialog
    })
    console.log(`Palette Ctrl+K ouverte avec succès : ${isCommandMenuOpen}`)
    if (!isCommandMenuOpen) {
      throw new Error('La palette de commandes Ctrl+K ne s\'ouvre plus !')
    }
    // Fermer avec Escape
    await page.keyboard.press('Escape')
    await new Promise(r => setTimeout(r, 300))

    // -------------------------------------------------------------
    // TEST 5: Non-régression Menu Hamburger Mobile et ThemeToggle mobile
    // -------------------------------------------------------------
    console.log('5. Test du Header Mobile et Hamburger Menu...')
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
    await new Promise(r => setTimeout(r, 500))

    const hamburgerBtn = await page.$('#mobile-menu-trigger-btn')
    if (!hamburgerBtn) {
      throw new Error('Le bouton hamburger #mobile-menu-trigger-btn est introuvable sur mobile !')
    }
    await hamburgerBtn.click()
    await new Promise(r => setTimeout(r, 600))

    const isDrawerVisible = await page.evaluate(() => {
      const drawer = document.querySelector('#mobile-navigation-drawer')
      return !!drawer
    })
    console.log(`Tiroir mobile ouvert avec succès : ${isDrawerVisible}`)
    if (!isDrawerVisible) {
      throw new Error('Le tiroir hamburger mobile ne s\'est pas ouvert !')
    }

    // Tester le bascule de thème dans le menu mobile
    const mobileThemeToggle = await page.$('#theme-toggle-mobile-btn')
    if (!mobileThemeToggle) {
      throw new Error('Le bouton #theme-toggle-mobile-btn est introuvable dans le menu mobile !')
    }
    await mobileThemeToggle.click()
    await new Promise(r => setTimeout(r, 500))
    const isDarkFromMobile = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark')
    })
    console.log(`Basculement depuis le menu mobile -> dark mode: ${isDarkFromMobile}`)
    if (isDarkFromMobile) {
      throw new Error('Le basculement de thème depuis le menu mobile a échoué !')
    }

    // -------------------------------------------------------------
    // TEST 6: Non-régression /create et anonymisation PII
    // -------------------------------------------------------------
    console.log('6. Test de non-régression sur /create (accès anonyme et détection PII)...')
    await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 800))

    const textareas = await page.$$('textarea')
    if (!textareas || textareas.length === 0) {
      throw new Error('Le formulaire de création est inaccessible aux anonymes !')
    }

    await textareas[0].type('Contactez Jean au +228 90 00 00 00 pour la configuration de sk_live_test_12345.')
    await new Promise(r => setTimeout(r, 600))

    const piiAlertVisible = await page.evaluate(() => {
      const bar = document.querySelector('#pii-status-bar')
      const preview = document.querySelector('#pii-preview-container')
      return !!bar || !!preview
    })
    console.log(`Détecteur PII actif et alerte affichée : ${piiAlertVisible}`)
    if (!piiAlertVisible) {
      throw new Error('L\'alerte PII locale devrait être affichée lors de la détection de données sensibles !')
    }

    console.log('=== TOUTES LES RÈGLES DE NON-RÉGRESSION ONT ÉTÉ RESPECTÉES ET VÉRIFIÉES ===')
  } catch (err) {
    console.error('Erreur test:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()
