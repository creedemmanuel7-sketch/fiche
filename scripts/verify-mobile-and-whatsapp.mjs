import puppeteer from 'puppeteer-core'
import path from 'path'

const ARTIFACTS_DIR = 'C:/Users/credo/.gemini/antigravity/brain/3bb76cc4-e587-4698-9ee8-b38626454bb7'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const WHATSAPP_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24.5.77'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 375, height: 812, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    // -------------------------------------------------------------
    // TEST 1: Page de login avec User-Agent WhatsApp
    // -------------------------------------------------------------
    console.log('1. Test Login avec User-Agent WhatsApp WebView...')
    const loginPage = await browser.newPage()
    await loginPage.setUserAgent(WHATSAPP_UA)
    await loginPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))

    const isBannerVisible = await loginPage.$('#whatsapp-banner') !== null
    const isGoogleButtonHidden = await loginPage.$('#google-auth-container') === null
    const bannerText = await loginPage.$eval('#whatsapp-banner', (el) => el.textContent).catch(() => '')

    console.log('Bandeau WhatsApp visible :', isBannerVisible)
    console.log('Bouton Google masqué :', isGoogleButtonHidden)
    console.log('Contenu du bandeau :', bannerText)

    if (!isBannerVisible) {
      throw new Error('Le bandeau WhatsApp n\'est pas apparu avec le User-Agent WhatsApp.')
    }
    if (!isGoogleButtonHidden) {
      throw new Error('Le bouton Google OAuth ne doit PAS être visible dans WhatsApp.')
    }

    const loginScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-login-whatsapp-webview.png')
    await loginPage.screenshot({ path: loginScreenshotPath, fullPage: false })
    console.log('✓ Capture d\'écran Login WhatsApp enregistrée:', loginScreenshotPath)

    // Vérification de contre-épreuve : sans WhatsApp, le bouton Google est bien présent
    const normalPage = await browser.newPage()
    await normalPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 800))
    const normalHasGoogle = await normalPage.$('#google-auth-container') !== null
    console.log('Bouton Google visible sur navigateur normal :', normalHasGoogle)

    // -------------------------------------------------------------
    // TEST 2: Page /create sur Mobile (375px) avec Bottom Action Bar
    // -------------------------------------------------------------
    console.log('2. Test /create sur mobile (largeur 375px)...')
    const createPage = await browser.newPage()
    await createPage.setViewport({ width: 375, height: 812, isMobile: true })
    await createPage.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1200))

    const hasBottomBar = await createPage.$('#mobile-generate-action-bar') !== null
    const bottomBarStyles = await createPage.$eval('#mobile-generate-action-bar', (el) => {
      const cs = window.getComputedStyle(el)
      return {
        position: cs.position,
        bottom: cs.bottom,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
      }
    })
    console.log('Styles barre fixe mobile /create:', bottomBarStyles)

    if (bottomBarStyles.position !== 'fixed') {
      throw new Error('La barre d\'action mobile n\'est pas en position: fixed.')
    }

    const createScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-create-mobile-bottom-bar.png')
    await createPage.screenshot({ path: createScreenshotPath, fullPage: false })
    console.log('✓ Capture d\'écran /create mobile enregistrée:', createScreenshotPath)

    // -------------------------------------------------------------
    // TEST 3: Page /fiche/[id] sur Mobile avec Bottom Action Bar & Blocs de code
    // -------------------------------------------------------------
    console.log('3. Test /fiche/[id] sur mobile (Bottom Bar Utile/Partager + Code blocks)...')
    const fichePage = await browser.newPage()
    await fichePage.setViewport({ width: 375, height: 812, isMobile: true })

    // Trouver une fiche existante depuis l'accueil
    await fichePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' })
    const ficheHref = await fichePage.evaluate(() => {
      const link = document.querySelector('a[href^="/fiche/"]')
      return link ? link.getAttribute('href') : null
    })

    if (ficheHref) {
      await fichePage.goto(`http://localhost:3000${ficheHref}`, { waitUntil: 'networkidle2' })
      await new Promise((r) => setTimeout(r, 1200))

      const hasFicheBottomBar = await fichePage.$('#mobile-fiche-action-bar') !== null
      const buttonsHeight = await fichePage.$$eval('#mobile-fiche-action-bar button', (btns) =>
        btns.map((b) => ({
          text: b.textContent.trim(),
          height: b.getBoundingClientRect().height,
        }))
      )
      console.log('Hauteurs des boutons mobile fiche (norme Apple >= 44px):', buttonsHeight)

      for (const btn of buttonsHeight) {
        if (btn.height < 44) {
          throw new Error(`Le bouton "${btn.text}" a une hauteur de ${btn.height}px (< 44px).`)
        }
      }

      // Vérifier les règles de confinement des blocs de code
      const preStyles = await fichePage.evaluate(() => {
        const pre = document.querySelector('pre')
        if (!pre) {
          // Créer un pre de test pour vérifier computed styles selon les règles globals.css
          const testPre = document.createElement('pre')
          testPre.innerHTML = '<code>const token = "x".repeat(200);</code>'
          document.body.appendChild(testPre)
          const cs = window.getComputedStyle(testPre)
          const res = {
            overflowX: cs.overflowX,
            maxWidth: cs.maxWidth,
            border: cs.border,
          }
          testPre.remove()
          return res
        }
        const cs = window.getComputedStyle(pre)
        return {
          overflowX: cs.overflowX,
          maxWidth: cs.maxWidth,
          border: cs.border,
        }
      })
      console.log('Styles appliqués aux blocs <pre>:', preStyles)

      const ficheScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-fiche-mobile-bottom-bar.png')
      await fichePage.screenshot({ path: ficheScreenshotPath, fullPage: false })
      console.log('✓ Capture d\'écran /fiche mobile enregistrée:', ficheScreenshotPath)
    }

  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
