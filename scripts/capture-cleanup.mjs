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

  console.log('1. Capture page d\'accueil avec Équipe Fiche et compteurs à 0...')
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1200))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-home-cleanup-equipe-fiche.png'),
    fullPage: false
  })
  console.log('✓ screenshot-home-cleanup-equipe-fiche.png sauvegardée')

  console.log('2. Capture page /explorer...')
  await page.goto('http://localhost:3000/explorer', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1200))

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'screenshot-explorer-cleanup.png'),
    fullPage: false
  })
  console.log('✓ screenshot-explorer-cleanup.png sauvegardée')

  await browser.close()
  console.log('Terminé avec succès !')
}

main().catch((err) => {
  console.error('Erreur:', err)
  process.exit(1)
})
