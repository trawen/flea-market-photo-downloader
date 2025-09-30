document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status')
  const btn = document.getElementById('downloadBtn')

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) {
    statusEl.textContent = 'Неактивная вкладка или нет URL.'
    return
  }

  const url = new URL(tab.url)
  let pageId = (url.pathname.match(/(\d{6,})/) || url.search.match(/itemId=(\d+)/) || []).pop?.() || url.pathname

  chrome.storage.sync.get(['downloaded'], (res) => {
    const downloaded = res.downloaded || {}
    if (downloaded[pageId]) {
      statusEl.textContent = `Картинки уже скачаны: ${downloaded[pageId]?.date}`
    } else {
      statusEl.textContent = 'Картинки ещё не скачаны.'
    }
    btn.style.display = 'inline-block'
  })

  btn.addEventListener('click', () => {
    btn.disabled = true
    statusEl.textContent = 'Запрос на скачивание отправлен...'

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'collectImages',
      },
      (result) => {
        if (chrome.runtime.lastError) {
          statusEl.textContent = 'Ошибка chrome.tabs.sendMessage: ' + chrome.runtime.lastError.message
          btn.disabled = false
          return
        }

        chrome.runtime.sendMessage({
          action: 'downloadImages',
          ...result,
          pageId,
          host: url.host,
        })

        setTimeout(() => {
          btn.disabled = false
          statusEl.textContent = 'Задание отправлено.'
        }, 1000)
      }
    )
  })
})
