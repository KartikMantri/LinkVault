// Shared save logic, loaded by both background.js (importScripts) and
// popup.html (<script>) so the fetch/error handling lives in one place.

async function getConfig() {
  const { baseUrl, token } = await chrome.storage.local.get(['baseUrl', 'token'])
  return { baseUrl: baseUrl ? baseUrl.replace(/\/$/, '') : null, token: token || null }
}

async function saveToLinkVault(url, note) {
  const { baseUrl, token } = await getConfig()
  if (!baseUrl || !token) {
    return { ok: false, error: 'not-configured' }
  }

  let res
  try {
    res = await fetch(`${baseUrl}/api/save`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note ? { url, note } : { url }),
    })
  } catch {
    return { ok: false, error: 'Could not reach LinkVault — check the deployment URL in Options.' }
  }

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { ok: false, error: body.error || `Request failed (${res.status})` }
  }

  return { ok: true }
}
