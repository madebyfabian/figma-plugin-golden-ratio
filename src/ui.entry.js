import './style.scss';


/**
 * Posts a message to the main.entry.ts
 * @param {string} action The action name.
 * @param {string} type The action type.
 */
const postMsg = (type, action) => {
  parent.postMessage({ pluginMessage: { action, type } }, '*')
}


/**
 * Sets a CSS Variable on the html root
 */
const setCSSVariable = (key, value) => {
  document.documentElement.style.setProperty(key, value)
}


/**
 * Action Button onclick listener
 */
const actionBtns = document.getElementsByClassName('item')
for (let i = 0; i < actionBtns.length; i++) {
  const el = actionBtns[i]
  el.addEventListener('click', () => {
    postMsg('doAction', el.dataset.action)
  })
}


/**
 * setting_roundBy8px listener
 */
const item__setting_roundBy8px = document.getElementById('setting_roundBy8px')
item__setting_roundBy8px.addEventListener('change', () => {
  postMsg('setting_roundBy8px', item__setting_roundBy8px.checked)
})


/**
 * setting_rotateDirection
 */
const item__setting_rotateDirection = document.getElementById('setting_rotateDirection')
item__setting_rotateDirection.addEventListener('click', () => {
  postMsg('setting_rotateDirection')
})


/**
 * getting a message from main.entry.ts
 */
onmessage = (event) => {
  const msg = event.data.pluginMessage

  switch (msg.type) {
    case 'widerThanHigh': {
      const isWiderThanHigh = msg.value
      setCSSVariable('--button-rotate', ((isWiderThanHigh) ? -90 : 0 ) + "deg")

      break
    }

    case 'sync__setting_roundBy8px': {
      const setting_roundBy8px = msg.value
      if (setting_roundBy8px)
        document.getElementById('setting_roundBy8px').checked = true

      break
    }
  }
}