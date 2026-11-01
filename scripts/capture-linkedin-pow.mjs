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

  console.log('1. Connexion utilisateur test...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
  await page.type('input[type="email"]', 'test+1793460067554@example.com')
  await page.type('input[type="password"]', 'Password123!@#')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ])

  console.log('2. Accès au dashboard...')
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1000))

  console.log('3. Clic sur "Modifier mon profil"...')
  // Bouton Modifier mon profil
  const editBtn = await page.$('button[title="Modifier mon nom d\'affichage"]') || await page.$('button:has(svg.lucide-pencil)')
  if (editBtn) {
    await editBtn.click()
    await new Promise((r) => setTimeout(r, 600))
  } else {
    // Fallback: chercher par texte ou sélecteur
    const buttons = await page.$$('button')
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b)
      if (text && text.includes('Modifier')) {
        await b.click()
        break
      }
    }
    await new Promise((r) => setTimeout(r, 600))
  }

  // Vérifier et taper le profil LinkedIn si besoin
  const linkedinInput = await page.$('input[placeholder*="linkedin.com"]')
  if (linkedinInput) {
    await linkedinInput.click({ clickCount: 3 })
    await linkedinInput.type('https://www.linkedin.com/in/senior-dev-fiche')
  }

  console.log('Capture 1: Formulaire de profil avec champ LinkedIn...')
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-dashboard-profile-linkedin-field.png'),
    fullPage: false
  })

  // Enregistrer le profil
  console.log('4. Enregistrement du profil...')
  const saveBtn = await page.$('form button[type="submit"]')
  if (saveBtn) {
    await saveBtn.click()
    await new Promise((r) => setTimeout(r, 1500))
  }

  // 5. Chercher une fiche écrite par l'utilisateur ou une fiche existante
  console.log('5. Navigation vers une fiche pour visualiser le badge Proof-of-Work LinkedIn...')
  // D'abord regarder les fiches listées sur le dashboard
  const ficheLinks = await page.$$eval('a[href^="/fiche/"]', links => links.map(a => a.href))
  let targetFicheUrl = ficheLinks[0]

  if (!targetFicheUrl) {
    // Si pas de lien sur le dashboard, aller sur l'accueil ou explorer
    await page.goto('http://localhost:3000/explorer', { waitUntil: 'networkidle2' })
    const explorerLinks = await page.$$eval('a[href^="/fiche/"]', links => links.map(a => a.href))
    targetFicheUrl = explorerLinks[0]
  }

  console.log('Fiche ciblée :', targetFicheUrl)
  if (targetFicheUrl) {
    await page.goto(targetFicheUrl, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    // Vérifier si le badge LinkedIn est présent, ou simuler la vue
    console.log('Capture 2: Page de lecture avec badge LinkedIn auteur...')
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'screenshot-fiche-reading-linkedin-proof-of-work.png'),
      fullPage: false
    })
  }

  await browser.close()
  console.log('Terminé avec succès !')
}

main().catch(err => {
  console.error('Erreur :', err)
  process.exit(1)
})
