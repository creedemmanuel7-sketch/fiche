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

    console.log('1. Navigation vers /create...')
    await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 1000))

    // Vérification état initial sain (aucun secret)
    const initialText = await page.$eval('#pii-status-bar', (el) => el.textContent)
    console.log('État initial status bar:', initialText)

    if (!initialText.includes('Aucun secret détecté')) {
      throw new Error(`État initial inattendu : "${initialText}"`)
    }
    console.log('✓ État initial sain vérifié.')

    // 2. Saisie d'un faux numéro de téléphone et d'une fausse clé API
    console.log('2. Saisie de données sensibles dans la Question brute et Réponse brute...')
    const textareas = await page.$$('textarea')
    if (textareas.length < 2) {
      throw new Error('Champs textarea introuvables')
    }

    const questionTextarea = textareas[0]
    const answerTextarea = textareas[1]

    await questionTextarea.type('Bonjour, contactez le support au +228 90 00 00 00 pour le webhook.')
    await answerTextarea.type('Configurez votre clé sk_live_9876543210abcdef dans les headers.')

    // Attente du debounce de 300ms + animation
    await new Promise((r) => setTimeout(r, 600))

    // Vérification de l'alerte
    const alertText = await page.$eval('#pii-status-bar', (el) => el.textContent)
    console.log('État alerte status bar:', alertText)

    const pills = await page.$$eval('#pii-preview-container span', (els) =>
      els.map((e) => e.textContent.trim()).filter(Boolean)
    )
    console.log('Pilules détectées:', pills)

    if (!alertText.includes('détecté')) {
      throw new Error('L\'alerte PII n\'a pas été déclenchée.')
    }

    // Capture d'écran de l'alerte avec faux numéro et fausse clé API
    const alertScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-pii-detector-alert.png')
    await page.screenshot({ path: alertScreenshotPath, fullPage: false })
    console.log('✓ Capture d\'écran Alerte PII enregistrée:', alertScreenshotPath)

    // 3. Test de réinitialisation : effacer le texte et vérifier le retour au vert
    console.log('3. Effacement du texte pour tester le retour à l\'état sain...')
    
    // Vider les champs en sélectionnant tout et en effaçant
    await questionTextarea.focus()
    await page.keyboard.down('Control')
    await page.keyboard.press('A')
    await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')

    await answerTextarea.focus()
    await page.keyboard.down('Control')
    await page.keyboard.press('A')
    await page.keyboard.up('Control')
    await page.keyboard.press('Backspace')

    // Attente du debounce 300ms
    await new Promise((r) => setTimeout(r, 600))

    const resetText = await page.$eval('#pii-status-bar', (el) => el.textContent)
    console.log('État après effacement status bar:', resetText)

    if (!resetText.includes('Aucun secret détecté')) {
      throw new Error(`L'état n'est pas redevenu sain après effacement : "${resetText}"`)
    }
    console.log('✓ Confirmation : après effacement du texte, la barre redevient verte et saine.')

    const healthyScreenshotPath = path.join(ARTIFACTS_DIR, 'screenshot-pii-detector-healthy.png')
    await page.screenshot({ path: healthyScreenshotPath, fullPage: false })
    console.log('✓ Capture d\'écran État Sain enregistrée:', healthyScreenshotPath)

  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
