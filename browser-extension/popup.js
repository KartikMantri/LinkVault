const els = {
  unconfigured: document.getElementById('unconfigured'),
  form: document.getElementById('form'),
  pageTitle: document.getElementById('page-title'),
  pageUrl: document.getElementById('page-url'),
  note: document.getElementById('note'),
  save: document.getElementById('save'),
  status: document.getElementById('status'),
  openOptions: document.getElementById('open-options'),
}

let currentTab = null

async function init() {
  const { baseUrl, token } = await chrome.storage.local.get(['baseUrl', 'token'])
  if (!baseUrl || !token) {
    els.unconfigured.classList.remove('hidden')
    els.form.classList.add('hidden')
    return
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  currentTab = tab
  els.pageTitle.textContent = tab.title || ''
  els.pageUrl.textContent = tab.url || ''
}

els.openOptions.addEventListener('click', () => chrome.runtime.openOptionsPage())

els.save.addEventListener('click', async () => {
  if (!currentTab?.url) return

  els.save.disabled = true
  els.status.textContent = 'Saving…'

  const result = await saveToLinkVault(currentTab.url, els.note.value.trim() || undefined)

  if (result.ok) {
    els.status.textContent = 'Saved!'
    setTimeout(() => window.close(), 800)
  } else {
    els.status.textContent =
      result.error === 'not-configured' ? 'Not configured — check Options.' : `Failed: ${result.error}`
    els.save.disabled = false
  }
})

init()
