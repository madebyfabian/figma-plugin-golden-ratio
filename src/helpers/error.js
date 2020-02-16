/**
 * Send a error message to the user with the figma.notify() API method.
 * @param {String} errorType The name of the error type
 * @param {String} emoji The emoji which is before the message
 */
export default (errorType, additionalData = {}, emoji = '😏') => {
	let msg

	switch (errorType) {
		case 'NO_ITEM_SELECTED':
			msg = 'Please select something'
			break

		case 'PARENT_IS_INVALID':
			msg = 'Your selected item must be inside a Frame, Group or Component'
			break

		case 'NODE_IS_INVALID': 
			if ('type' in additionalData) {
				let itemName = additionalData['type'].toLowerCase().charAt(0).toUpperCase() + additionalData['type'].toLowerCase().slice(1)
				msg = `${itemName}-Items are not allowed`
				break
			}
	
		default:
			msg = 'Plugin Error'
			break
	}

	figma.notify(`${emoji?`${emoji} `:''}${msg}`)
}