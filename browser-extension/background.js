importScripts('api.js')

const MENU_ID = 'save-to-linkvault'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Save to LinkVault',
    contexts: ['page', 'link'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return
  // Prefer the right-clicked link's URL; fall back to the page itself.
  const url = info.linkUrl || info.pageUrl
  const result = await saveToLinkVault(url)
  notify(result, url)
})

function notify(result, url) {
  if (!result.ok && result.error === 'not-configured') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'LinkVault not configured',
      message: 'Set your deployment URL and API token in the extension options.',
    })
    chrome.runtime.openOptionsPage()
    return
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: result.ok ? 'Saved to LinkVault' : 'Save failed',
    message: result.ok ? url : result.error,
  })
}
