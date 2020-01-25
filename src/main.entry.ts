import error from './functions/error.js'

// v1: Written at Figma Plugins API Version 1.1.0 @ 24. August 2019
// v2: Updated description and added new feature roundBy8pxGrid @ 01. September 2019
// v3: Bugfix caused by v2 @ 01. September 2019
// v4: Corrected typo in description @ 01. September 2019
// v5: Added new Option to rotate the direction, Improved Round-by-8px Option, Added Support for Slice-Items, General performance Improvements @ 17. November 2019


// Needs to be globally available
const goldenRatio 			= 0.61803398874989,
			allowedNodeTypes 	= ['RECTANGLE', 'GROUP', 'COMPONENT', 'INSTANCE', 'VECTOR', 'STAR', 'LINE', 'ELLIPSE', 'POLYGON', 'TEXT', 'FRAME', 'SLICE']
		
	let currSelParentWiderThanHigh = null

	
/**
 * round a number
 */
const roundNumber = async (num) => {
	// if setting is set to true, round it to 8px Grid, if not just normally round it to the next pixel
	return (await figma.clientStorage.getAsync('setting_roundBy8px')) 
		? Math.round(num / 8) * 8 
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


figma.showUI(__html__, { 
	width: 296, 
	height: 417
})


/**
 * Check if the parent frame is wider than high.
 */
const checkWiderThanHigh = () => {
	for (const node of figma.currentPage.selection) {
		switch (node.parent.type) {
			case 'FRAME': case 'GROUP': case 'COMPONENT': {
				currSelParentWiderThanHigh = (node.parent.width - node.parent.height >= 0)

				figma.ui.postMessage({ 
					type: 'widerThanHigh', 
					value: currSelParentWiderThanHigh
				})

				break
			}
		}
	}
}


/**
 * On change of the current selection
 */
figma.on("selectionchange", () => { 
	checkWiderThanHigh()
});


/**
 * On plugin load
 */
(async () => {
	checkWiderThanHigh()

	// check the setting_roundBy8px and send the current setting back to UI
	figma.ui.postMessage({ 
		type: 'sync__setting_roundBy8px', 
		value: await figma.clientStorage.getAsync('setting_roundBy8px')
	})
})()


/**
 * on message from ui.js
 */
figma.ui.onmessage = async (msg) => {
	switch (msg.type) {
		// If user changes the "Round by 8px" setting
		case 'setting_roundBy8px': {
			await figma.clientStorage.setAsync('setting_roundBy8px', msg.action)
			break
		}


		// If user clicks on "Change rotate direction button"
		case 'setting_rotateDirection': {
			currSelParentWiderThanHigh = !currSelParentWiderThanHigh

			figma.ui.postMessage({ 
				type: 'widerThanHigh', 
				value: currSelParentWiderThanHigh
			})

			break
		}


		// User clicked on one of the options.
		case 'doAction': {
			const currSel	= figma.currentPage.selection 

			if (currSel.length === 0) {
				// User hasn't selected any node.
				error('NO_ITEM_SELECTED')
				break
			}

			for (const node of currSel) {
				if (!allowedNodeTypes.includes(node.type)) {
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
									? await roundNumber(getBase * goldenRatio) 
									: Math.round(getBase * goldenRatio)
	
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
								const modifiedGoldenRatio = (msg.action === 'ALIGN_TOP') ? (1 - goldenRatio) : goldenRatio
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
		} // end case 'doAction'
	} // end switch msg.type
} // end figma.ui.onMessage()