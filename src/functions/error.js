/**
 * Send a error message to the user with the figma.notify() API method.
 * @param {String} errorType The name of the error type
 * @param {String} emoji The emoji which is before the message
 */
export default (errorType, additionalData = {}, emoji = '⚠️') => {
	const errors = {
		NO_ITEM_SELECTED: 'You have nothing selected',
		PARENT_IS_INVALID: 'Your selected item must be inside a Frame / Group',
		NODE_IS_INVALID: `${additionalData['type'].toLowerCase().charAt(0).toUpperCase() + additionalData['type'].toLowerCase().slice(1)}-Items are not allowed`
  }

	figma.notify(`${emoji} ${errors[errorType]}`)
}