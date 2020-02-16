import './style.scss'
import { NAMES } from './helpers/store'

const $roundBy8pxSettingToggle = document.querySelector('#setting_roundBy8px')
const $rotateDirectionSettingToggle = document.getElementById('setting_rotateDirection')


/**
 * If the UI is loading and should not be visible
 */
const changeLoadingState = (isLoading = true) => {
  if (isLoading)
    document.body.classList.add('is-loading')
  else
    document.body.classList.remove('is-loading')
}


/**
 * Posts a message to the main.entry.ts
 * @param {string} action The action name.
 * @param {string} type The action type.
 */
const postMsg = (type, action) => {
  parent.postMessage({ pluginMessage: { action, type } }, '*')
}


/**
 * Sets a CSS Variable on the html root.
 * @param {String} key CSS variable (e.g. "--color-green").
 * @param {String} value The new Value for that variable.
 */
const setCSSVariable = (key, value) => {
  document.documentElement.style.setProperty(key, value)
}


// Action Button onclick post message to main.entry.ts
for (const el of document.getElementsByClassName('item')) {
  el.addEventListener('click', () => {
    postMsg(NAMES.doAction, el.dataset.action)
  })
}


// On plugin load, change the loading state to true
changeLoadingState(true)


// If round by 8px grid setting changes
$roundBy8pxSettingToggle.addEventListener('change', () => {
  const msg = $roundBy8pxSettingToggle.checked
  postMsg(NAMES.userSettings.roundBy8px, msg)
})


// Toggle rotation manually
$rotateDirectionSettingToggle.addEventListener('click', () => {
  // Get current value
  const currVal = getComputedStyle(document.documentElement).getPropertyValue('--button-rotate'),
        newVal  = currVal === '-90deg' ? '0deg' : '-90deg'

  // Set new value
  setCSSVariable('--button-rotate', newVal)

  // Post message to main.entry.ts
  postMsg(NAMES.manuallyRotateDirection, null)
})


/**
 * getting a message from main.entry.ts
 */
let pluginInitDone = false

onmessage = (event) => {
  const msg = event.data.pluginMessage

  switch (msg.type) {
    case NAMES.automaticallyRotateDirection: {
      const isWiderThanHigh = msg.value
      setCSSVariable('--button-rotate', (isWiderThanHigh ? -90 : 0 ) + "deg")
      break
    }

    case NAMES.userSettings.roundBy8px: {
      if (!pluginInitDone) {
        changeLoadingState(false)
        pluginInitDone = true
      }
      
      $roundBy8pxSettingToggle.checked = !!msg.value

      break
    }
  }
}