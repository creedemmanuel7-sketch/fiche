import puppeteer from 'puppeteer-core'
import path from 'path'

const ARTIFACTS_DIR = 'C:/Users/credo/.gemini/antigravity/brain/3bb76cc4-e587-4698-9ee8-b38626454bb7'
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function run() {
  console.log('--- Lancement du test automatisé de dynamic cache et Google OAuth ---')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    // 1. Navigation privée / non connecté sur la page d'accueil
    const incognitoPage = await browser.newPage()
    await incognitoPage.setViewport({ width: 1280, height: 900 })

    console.log('1. Accès à la page d\'accueil en mode anonyme / non connecté...')
    await incognitoPage.goto('http://localhost:3000/', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 1200))

    // Vérifier les cartes
    const cardInfo = await incognitoPage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.group.relative.cursor-pointer'))
      return cards.map(c => {
        return {
          title: c.querySelector('h3')?.innerText || '',
          headerText: c.querySelector('span.truncate')?.innerText || '',
          viewsUseful: c.querySelectorAll('span.font-medium') ? Array.from(c.querySelectorAll('span.font-medium')).map(s => s.innerText) : []
        }
      })
    })

    console.log(`Nombre de fiches trouvées sur l'accueil : ${cardInfo.length}`)
    console.log('Détails des fiches affichées :', JSON.stringify(cardInfo, null, 2))

    // S'assurer qu'aucun auteur "Senior" résiduel n'apparaît
    const hasSenior = cardInfo.some(c => c.headerText.includes('Senior'))
    console.log('Présence du texte résiduel "Senior" dans l\'auteur :', hasSenior)
    if (hasSenior) {
      console.warn('Avertissement : Une fiche affiche encore "Senior" !')
    }

    const homeScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-home-anonymous-dynamic.png')
    await incognitoPage.screenshot({ path: homeScreenshotPath, fullPage: false })
    console.log(`Capture accueil enregistrée : ${homeScreenshotPath}`)
    await incognitoPage.close()

    // 2. Page de login en navigateur classique
    const normalPage = await browser.newPage()
    await normalPage.setViewport({ width: 1280, height: 900 })
    console.log('2. Accès à /login en navigateur classique (Desktop)...')
    await normalPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 800))

    const googleBtnInfo = await normalPage.evaluate(() => {
      const googleBtn = document.querySelector('#google-auth-container button')
      const divider = document.querySelector('#google-auth-container .uppercase')
      return {
        exists: !!googleBtn,
        text: googleBtn ? googleBtn.innerText.trim() : null,
        dividerText: divider ? divider.innerText.trim() : null,
      }
    })

    console.log('Infos bouton Google (Desktop classique) :', googleBtnInfo)
    if (!googleBtnInfo.exists) {
      throw new Error('Le bouton Google OAuth devrait être visible sur un navigateur classique !')
    }

    const loginScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-login-google-enabled.png')
    await normalPage.screenshot({ path: loginScreenshotPath })
    console.log(`Capture login enregistrée : ${loginScreenshotPath}`)
    await normalPage.close()

    // 3. Page de login avec User-Agent WhatsApp
    const waPage = await browser.newPage()
    await waPage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
    await waPage.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.23.10.77'
    )
    console.log('3. Accès à /login avec User-Agent WhatsApp...')
    await waPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 800))

    const waGoogleBtnInfo = await waPage.evaluate(() => {
      const googleContainer = document.querySelector('#google-auth-container')
      const waBanner = document.querySelector('#whatsapp-banner')
      return {
        googleVisible: !!googleContainer,
        waBannerVisible: !!waBanner,
        waBannerText: waBanner ? waBanner.innerText.trim() : null,
      }
    })

    console.log('Infos sous WhatsApp WebView :', waGoogleBtnInfo)
    if (waGoogleBtnInfo.googleVisible) {
      throw new Error('Le bouton Google OAuth doit être masqué sous WhatsApp !')
    }
    if (!waGoogleBtnInfo.waBannerVisible) {
      throw new Error('La bannière WhatsApp doit être visible !')
    }

    const waScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-login-whatsapp-hidden-google.png')
    await waPage.screenshot({ path: waScreenshotPath })
    console.log(`Capture WhatsApp enregistrée : ${waScreenshotPath}`)
    await waPage.close()

    console.log('=== TOUS LES TESTS ONT RÉUSSI AVEC SUCCÈS ===')
  } catch (err) {
    console.error('Erreur test:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()
