import MyPlugin from "./main";
import type { ExplorerView } from './@types/obsidian';
import {FileSystemAdapter} from "obsidian";


/**
 * This function adds the icons to the DOM.
 * For that, it will create a `div` element with the class `obsidian-icon-folder-icon` that will be customized based on the user settings.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {[string, string | FolderIconObject][]} data - The data that includes the icons.
 * @param {WeakMap<ExplorerLeaf, boolean>} registeredFileExplorers - The already registered file explorers.
 */
export const addIconsToDOM = (
	plugin: MyPlugin,
	data: string[],
	registeredFileExplorers: WeakSet<ExplorerView>,
	callback?: () => void,
): void => {
	const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
	fileExplorers.forEach((fileExplorer) => {
		if (registeredFileExplorers.has(fileExplorer.view)) {
			return;
		}

		registeredFileExplorers.add(fileExplorer.view);

		// create a map with registered file paths to have constant look up time
		const registeredFilePaths: Record<string, boolean> = {};
		data.forEach((path) => {
			registeredFilePaths[path] = true;
		});
		console.log('registeredFilePaths', registeredFilePaths);

		data.forEach((dataPath) => {
			console.log('searching', dataPath, 'in', fileExplorer.view.fileItems);
			const fileItem = fileExplorer.view.fileItems[dataPath];
			if (fileItem) {
				console.log('found', fileItem);
				const titleEl = fileItem.titleEl;
				const titleInnerEl = fileItem.titleInnerEl;

				// needs to check because of the refreshing the plugin will duplicate all the icons
				if (titleEl.children.length === 2 || titleEl.children.length === 1) {
					const iconName = plugin.settings.thumbnailsPath + '/' + dataPath + '.webp';
					if (iconName) {
						const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
						if (existingIcon) {
							existingIcon.remove();
						}

						const iconNode = titleEl.createDiv();
						iconNode.classList.add('obsidian-icon-folder-icon');

						insertIconToNode(plugin, iconName, iconNode);

						titleEl.insertBefore(iconNode, titleInnerEl);
					}
				}
			}
		});

		if (callback) {
			callback();
		}
	});
};

/**
 * This function inserts a specific icon into the specified node.
 *
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} icon - The icon string (can be an icon id or a unicode for emoji).
 * @param {HTMLElement} node - The element where the icon will be inserted.
 * @param color
 */
export const insertIconToNode = (plugin: MyPlugin, icon: string, node: HTMLElement, color?: string): void => {
	let url = '';
	const adapter = plugin.app.vault.adapter;
	if (adapter instanceof FileSystemAdapter) {
		url = adapter.getResourcePath(plugin.app.vault.configDir + '/' + icon);
	}
	node.style.backgroundImage = `url('${url}')`;
	node.style.borderRadius = `${plugin.settings.borderRadius}%`;

	// Change margin of icon
	const margin = plugin.settings.extraMargin;
	const normalizedMargin = {
		top: margin.top !== undefined ? margin.top : 4,
		right: margin.right !== undefined ? margin.right : 4,
		left: margin.left !== undefined ? margin.left : 4,
		bottom: margin.bottom !== undefined ? margin.bottom : 4,
	};
	if (plugin.settings.extraMargin) {
		node.style.margin = `${normalizedMargin.top}px ${normalizedMargin.right}px ${normalizedMargin.bottom}px ${normalizedMargin.left}px`;
	}

	node.style.width = `${plugin.settings.size}px`;
	node.style.height = `${plugin.settings.size}px`;
};
