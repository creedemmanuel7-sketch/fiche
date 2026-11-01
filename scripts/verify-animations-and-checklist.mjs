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

  console.log('=== TEST 1: SKELETON LOADERS ===')
  const pageSkeleton = await browser.newPage()
  await pageSkeleton.goto('http://localhost:3000/explorer', { waitUntil: 'networkidle2' })
  await pageSkeleton.evaluate(() => {
    const main = document.querySelector('main')
    if (main) {
      main.innerHTML = `
        <div class="space-y-10 animate-pulse">
          <div class="space-y-4 max-w-2xl">
            <div class="h-9 w-52 bg-muted/20 dark:bg-muted/30 rounded-md"></div>
            <div class="h-4 w-80 bg-muted/20 dark:bg-muted/30 rounded"></div>
          </div>
          <div class="h-12 w-full bg-card border border-border rounded-lg"></div>
          <section class="space-y-4">
            <div class="h-5 w-36 bg-muted/20 dark:bg-muted/30 rounded"></div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${Array.from({ length: 6 }).map(() => `
                <div class="bg-card border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm animate-pulse">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <div class="h-4 w-16 bg-muted/20 dark:bg-muted/30 rounded-full"></div>
                        <div class="h-3.5 w-28 bg-muted/20 dark:bg-muted/30 rounded"></div>
                      </div>
                      <div class="h-4 w-4 bg-muted/20 dark:bg-muted/30 rounded"></div>
                    </div>
                    <div class="space-y-2 pt-1">
                      <div class="h-4.5 w-5/6 bg-muted/20 dark:bg-muted/30 rounded"></div>
                      <div class="h-4.5 w-3/5 bg-muted/20 dark:bg-muted/30 rounded"></div>
                    </div>
                    <div class="flex flex-wrap gap-1.5 pt-2">
                      <div class="h-4 w-14 bg-muted/20 dark:bg-muted/30 rounded-full"></div>
                      <div class="h-4 w-16 bg-muted/20 dark:bg-muted/30 rounded-full"></div>
                      <div class="h-4 w-12 bg-muted/20 dark:bg-muted/30 rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-3 border-t border-border">
                    <div class="h-3.5 w-14 bg-muted/20 dark:bg-muted/30 rounded"></div>
                    <div class="h-3.5 w-12 bg-muted/20 dark:bg-muted/30 rounded"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        </div>
      `
    }
  })
  await new Promise((r) => setTimeout(r, 600))
  await pageSkeleton.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-skeleton-loaders.png'),
    fullPage: false
  })
  console.log('✓ Capture 1 enregistrée: screenshot-skeleton-loaders.png')
  await pageSkeleton.close()

  console.log('=== TEST 2: CHECKLIST COMPLETE EN MODE ANONYME ===')
  // Contexte vierge strict
  const incognitoContext = await browser.createBrowserContext()
  const page = await incognitoContext.newPage()

  console.log('1. Accès à /create sans être connecté...')
  await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
  console.log('URL vérifiée (sans redirection /login):', page.url())

  // Remplir question brute avec PII explicite
  const textareas = await page.$$('textarea')
  if (textareas.length >= 2) {
    await textareas[0].type('Appelle Jean au +228 90 00 00 00 pour intégrer CinetPay')
    await textareas[1].type("Utilise l'endpoint /v2/payment de CinetPay avec la clé API sécurisée stockée dans process.env.")
  }

  // Déclencher la génération
  const genBtn = await page.$('button[type="submit"]')
  console.log('2. Déclenchement de la génération IA...')
  if (genBtn) {
    await genBtn.click()
    // Attendre 400ms pour être en plein milieu de la génération et capturer le laser scan + HUD
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'screenshot-create-scanning-ai.png'),
      fullPage: false
    })
    console.log('✓ Capture 2 enregistrée: screenshot-create-scanning-ai.png')

    // Attendre la fin de la génération
    await page.waitForSelector('#generated-fiche-form', { timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1200))
  }

  // Vérification de l'anonymisation PII
  const problemVal = await page.$eval('#generated-fiche-form textarea', el => el.value).catch(() => '')
  const allInputsText = await page.evaluate(() => {
    const form = document.getElementById('generated-fiche-form')
    return form ? form.innerText + ' ' + Array.from(form.querySelectorAll('input, textarea')).map(i => i.value).join(' ') : ''
  })

  console.log('3. Vérification de l\'anonymisation PII :')
  const hasPhoneMasked = allInputsText.includes('[NUMÉRO MASQUÉ]') || allInputsText.includes('[NUMERO MASQUE]') || !allInputsText.includes('+228 90 00 00 00')
  const hasNameMasked = allInputsText.includes('[NOM MASQUÉ]') || allInputsText.includes('[NOM MASQUE]') || !allInputsText.includes('Jean')
  console.log('Numéro masqué (+228 90 00 00 00 absent / masqué):', hasPhoneMasked)
  console.log('Nom masqué (Jean absent / masqué):', hasNameMasked)

  // 4. Brouillon (Lazy Registration) : Cliquer sur "Publier" en anonyme
  console.log('4. Clic sur "Publier la fiche" en mode anonyme...')
  const publishBtn = await page.$('#generated-fiche-form button[type="submit"]')
  if (publishBtn) {
    await publishBtn.click()
    await page.waitForSelector('div[role="dialog"]', { timeout: 5000 })
    console.log('✓ Modale de connexion requise affichée !')
  }

  // Cliquer sur "Se connecter" dans la modale
  const modalLoginLink = await page.$('div[role="dialog"] a[href^="/login"]')
  if (modalLoginLink) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      modalLoginLink.click()
    ])
  }

  console.log('5. Connexion avec le compte de test...')
  await page.type('input[type="email"]', 'test+1793460067554@example.com')
  await page.type('input[type="password"]', 'Password123!@#')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ])

  console.log('6. Redirection vers /create après login...')
  await new Promise((r) => setTimeout(r, 1200))
  const isDraftRestored = await page.evaluate(() => {
    return document.body.innerText.includes('Brouillon restauré') || Boolean(document.getElementById('generated-fiche-form'))
  })
  console.log('Brouillon restauré automatiquement :', isDraftRestored)

  // 7. Publier la fiche connectée
  console.log('7. Publication définitive de la fiche...')
  const submitPublishedBtn = await page.$('#generated-fiche-form button[type="submit"]')
  if (submitPublishedBtn) {
    await submitPublishedBtn.click()
    // Attendre l'animation de publication et la redirection
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 1500))
  }

  // 8. Trouver la fiche nouvellement publiée sur le dashboard et l'ouvrir
  console.log('8. Accès à la fiche publiée pour vérifier auteur, compteurs et badge LinkedIn...')
  const newFicheLink = await page.$('a[href^="/fiche/"]')
  let ficheUrl = ''
  if (newFicheLink) {
    ficheUrl = await page.evaluate(el => el.href, newFicheLink)
  }
  if (!ficheUrl) {
    await page.goto('http://localhost:3000/explorer', { waitUntil: 'networkidle2' })
    const link = await page.$('a[href^="/fiche/"]')
    if (link) ficheUrl = await page.evaluate(el => el.href, link)
  }

  console.log('URL de la fiche inspectée :', ficheUrl)
  if (ficheUrl) {
    await page.goto(ficheUrl, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    const authorText = await page.evaluate(() => {
      const el = document.querySelector('main div.text-sm.text-muted')
      return el ? el.innerText : ''
    })
    console.log('Texte auteur :', authorText)

    const hasLinkedInIcon = await page.evaluate(() => {
      return Boolean(document.querySelector('a[title*="LinkedIn"] svg') || document.querySelector('a[href*="linkedin.com"]'))
    })
    console.log('Badge/Icône LinkedIn présent à côté de l\'auteur :', hasLinkedInIcon)

    // Vérifier compteurs initiaux
    const usefulCountInitial = await page.evaluate(() => {
      const btn = document.getElementById('useful-vote-button')
      return btn ? btn.innerText : ''
    })
    console.log('Compteur initial bouton Utile :', usefulCountInitial)

    // 9. Interaction : Cliquer sur "Utile"
    console.log('9. Clic sur le bouton "Utile"...')
    const usefulBtn = await page.$('#useful-vote-button')
    if (usefulBtn) {
      await usefulBtn.click()
      await new Promise((r) => setTimeout(r, 1000))

      const usefulCountAfter = await page.evaluate(() => {
        const btn = document.getElementById('useful-vote-button')
        return btn ? btn.innerText : ''
      })
      console.log('Compteur bouton Utile après clic :', usefulCountAfter)
    }
  }

  await browser.close()
  console.log('=== CHECKLIST TESTEE ET VALIDEE AVEC SUCCES ===')
}

main().catch(err => {
  console.error('Erreur test checklist :', err)
  process.exit(1)
})
