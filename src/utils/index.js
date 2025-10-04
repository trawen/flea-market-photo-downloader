export function delay(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

function animateClick(x, y) {
  const indicator = document.createElement('div')
  indicator.style.position = 'fixed'
  indicator.style.left = x - 10 + 'px'
  indicator.style.top = y - 10 + 'px'
  indicator.style.width = '20px'
  indicator.style.height = '20px'
  indicator.style.borderRadius = '50%'
  indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)'
  indicator.style.border = '2px solid red'
  indicator.style.zIndex = '999999'
  indicator.style.pointerEvents = 'none'
  indicator.style.animation = 'clickPulse 0.5s ease-out'

  if (!document.querySelector('#clickAnimationStyle')) {
    const style = document.createElement('style')
    style.id = 'clickAnimationStyle'
    style.textContent = `
          @keyframes clickPulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        `
    document.head.appendChild(style)
  }

  document.body.appendChild(indicator)
  setTimeout(() => indicator.remove(), 500)
}

export function simulateClickByCoordinates(x, y) {
  console.log('simulateClickByCoordinates', x, y)
  animateClick(x, y)
  const targetElement = document.elementFromPoint(x, y)
  console.log('targetElement', targetElement)
  if (targetElement) {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      detail: 1,
    })
    targetElement.dispatchEvent(clickEvent)
  }
}

export function sanitizeFolder(s) {
  return s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim()
}

export function getCleanUrl() {
  const url = new URL(window.location.href)
  return url.host + url.pathname
}
