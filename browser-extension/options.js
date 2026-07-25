const baseUrlInput = document.getElementById('baseUrl')
const tokenInput = document.getElementById('token')
const status = document.getElementById('status')

async function load() {
  const { baseUrl, token } = await chrome.storage.local.get(['baseUrl', 'token'])
  if (baseUrl) baseUrlInput.value = baseUrl
  if (token) tokenInput.value = token
}

document.getElementById('save').addEventListener('click', async () => {
  const baseUrl = baseUrlInput.value.trim().replace(/\/$/, '')
  const token = tokenInput.value.trim()

  if (!baseUrl || !token) {
    status.textContent = 'Both fields are required.'
    return
  }

  let origin
  try {
    origin = `${new URL(baseUrl).origin}/*`
  } catch {
    status.textContent = 'Enter a valid URL, e.g. https://your-app.vercel.app'
    return
  }

  // Requests permission only for this specific deployment's origin, rather
  // than the broad "https://*/*" declared as optional in the manifest.
  const granted = await chrome.permissions.request({ origins: [origin] })
  if (!granted) {
    status.textContent = 'Permission is required to save links to this URL.'
    return
  }

  await chrome.storage.local.set({ baseUrl, token })
  status.textContent = 'Saved.'
})

load()
