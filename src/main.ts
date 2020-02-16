import error from './helpers/error.js'
import { NAMES, VALUES } from './helpers/store'


figma.showUI(__html__, { 
	width: 296, 
	height: 417
})

		
let currSelParentWiderThanHigh = null,
		manuallyRotatedDirection = false

	
/**
 * round a number
 */
const roundNumber = async (num) => {
	// if setting is set to true, round it to 8px Grid, if not just normally round it to the next pixel
	const roundBy8px = await figma.clientStorage.getAsync(NAMES.userSettings.roundBy8px)
	return roundBy8px 
					? (Math.round(num / 8) * 8) 
					: Math.round(num)
}


/**
 * Helper function to set the position of a node.
 * @param {FigmaNode} node The node which is currently selected.
 * @param {Number} pos The new position
 * @param {Boolean} widerThanHigh Indicates whether the parent frame is wider than high or the other way.
 */
const setPos = async (node, pos, widerThanHigh) => {
	// Imagine, the parent node of the curr selected el is a group. And this group is not on position x = 0, y = 0 on the frame. So, that's why we are adding node.parent.x / y here
	if (widerThanHigh) 
		node.x = pos + ((node.parent.type === 'GROUP') ? node.parent.x : 0)
	else 
		node.y = pos + ((node.parent.type === 'GROUP') ? node.parent.y : 0)
}


/**
 * Check if the parent frame is wider than high.
 */
const checkWiderThanHigh = () => {
	// If the user has manually rotated the direction since the plugin opened
	if (manuallyRotatedDirection)
		return

	for (const node of figma.currentPage.selection) {
		switch (node.parent.type) {
			case 'FRAME': case 'GROUP': case 'COMPONENT': {
				currSelParentWiderThanHigh = (node.parent.width - node.parent.height >= 0)

				figma.ui.postMessage({ 
					type: NAMES.automaticallyRotateDirection, 
					value: currSelParentWiderThanHigh
				})

				break
			}
		}
	}
}


figma.on('selectionchange', () => { 
	checkWiderThanHigh()
});


/**
 * On plugin load
 */
(async () => {
	checkWiderThanHigh()

	// check the round by 8px setting and send the current setting back to UI
	figma.ui.postMessage({ 
		type: NAMES.userSettings.roundBy8px, 
		value: await figma.clientStorage.getAsync(NAMES.userSettings.roundBy8px)
	})
})()


/**
 * on message from ui.js
 */
figma.ui.onmessage = async (msg) => {
	switch (msg.type) {
		// If user changes the "Round by 8px" setting
		case NAMES.userSettings.roundBy8px: {
			await figma.clientStorage.setAsync(NAMES.userSettings.roundBy8px, msg.action)
			break
		}


		// If user clicks on "Change rotate direction button"
		case NAMES.manuallyRotateDirection: {
			currSelParentWiderThanHigh = !currSelParentWiderThanHigh
			manuallyRotatedDirection = true
			break
		}


		// User clicked on one of the options.
		case NAMES.doAction: {
			const currSel	= figma.currentPage.selection 

			if (currSel.length === 0) {
				// User hasn't selected any node.
				error('NO_ITEM_SELECTED')
				break
			}

			for (const node of currSel) {
				if (!VALUES.allowedNodeTypes.includes(node.type)) {
					// The user's selected node type is NOT allowed.
					error('NODE_IS_INVALID', { type: node.type })
					break
				} 

				switch (node.parent.type) {
					case 'FRAME':
					case 'GROUP': 
					case 'COMPONENT': {
						const nodeParentSize = { width: node.parent.width, height: node.parent.height }
		
						// check if the parent is wider than high
						const nodeParentWiderThanHigh = currSelParentWiderThanHigh

						// the selected node's parent frame is wider than high. 
						// So, the width as the calculating base. Otherwise, use height.
						// the word "base" is the equivalent of either width or height
						const getBase = (nodeParentWiderThanHigh) ? nodeParentSize.width : nodeParentSize.height

						switch (msg.action) {
							case 'RESIZE_TOP':
							case 'RESIZE_BOTTOM': {
								const newSize = (msg.action === 'RESIZE_TOP') 
									? await roundNumber(getBase * VALUES.goldenRatio) 
									: Math.round(getBase * VALUES.goldenRatio)
	
								// resize the node
								const nodeNewWidth = (nodeParentWiderThanHigh) ? newSize : node.width,
											nodeNewHeight = (nodeParentWiderThanHigh) ? node.height : newSize
								node.resize(nodeNewWidth, nodeNewHeight)

								// reposition the node
								const getResizedNodeBase  = (nodeParentWiderThanHigh) ? node.width : node.height,
											getFrameBase				= (nodeParentWiderThanHigh) ? nodeParentSize.width : nodeParentSize.height
								const newPos = (msg.action === 'RESIZE_TOP') ? 0 : (getFrameBase - getResizedNodeBase),
											newPosRounded = (msg.action === 'RESIZE_TOP') 
												? await roundNumber(newPos)
												: Math.round(newPos)

								setPos(node, newPosRounded, nodeParentWiderThanHigh)

								break
							}

							case 'ALIGN_TOP':
							case 'ALIGN_BOTTOM': {
								const modifiedGoldenRatio = (msg.action === 'ALIGN_TOP') ? (1 - VALUES.goldenRatio) : VALUES.goldenRatio
								const newAmount = getBase * modifiedGoldenRatio

								// reposition the node
								const majorPartWidth = (nodeParentWiderThanHigh) ? newAmount : nodeParentSize.width,
											majorPartHeight = (nodeParentWiderThanHigh) ? nodeParentSize.height : newAmount
								const getNewAmount = (nodeParentWiderThanHigh) ? majorPartWidth : majorPartHeight,
											newPos = getNewAmount - (((nodeParentWiderThanHigh) ? node.width : node.height) / 2),
											newPosRounded = await roundNumber(newPos)

								setPos(node, newPosRounded, nodeParentWiderThanHigh)

								break
							}
						} // end switch msg.action

						break
					} // end CASE 'FRAME': CASE 'GROUP':
				
					default: {
						// The parent type of the user's selected node is not allowed
						error('PARENT_IS_INVALID')
						break
					}
				} // end switch node.parent.type
			} // end for ... of ... loop

			break
		}
	} // end switch msg.type
} // end figma.ui.onMessage()