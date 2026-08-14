let deferredPrompt: any = null

export function initInstallPromptListener() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

export function canPrompt() {
  return deferredPrompt !== null
}

export async function promptInstall() {
  if (!deferredPrompt) return
  try {
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    deferredPrompt = null
    return choice
  } catch (e) {
    console.warn('Install prompt failed', e)
  }
}

export default { initInstallPromptListener, canPrompt, promptInstall }
