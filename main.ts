import { App, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';
import {BuilderExt} from "./plugin";
import {addIconsToDOM} from "./utils";
import {ExplorerView} from "./@types/obsidian";
import {Prec} from "@codemirror/state";

// Remember to rename these classes and interfaces!

export interface ExtraMarginSettings {
	top?: number;
	right?: number;
	bottom?: number;
	left?: number;
}

interface MyPluginSettings {
	thumbnailsPath: string;
	size: number;
	borderRadius: number;
	extraMargin: ExtraMarginSettings;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	thumbnailsPath: 'plugins/obsidian-icon-folder/icons',
	size: 32,
	borderRadius: 10,
	extraMargin: {
		top: 0,
		right: 4,
		bottom: 0,
		left: 0,
	},
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private notesWithThumbnail: string[];
	private registeredFileExplorers = new Set<ExplorerView>();

	async onload() {
		console.log(`loading ${this.manifest.id}`);

		await this.loadSettings();

		await createDefaultDirectory(this);

		this.app.workspace.onLayoutReady(() => this.handleChangeLayout());
		this.registerEvent(this.app.workspace.on('layout-change', () => this.handleChangeLayout()));

		console.log('regirstering');
		//this.registerExtensions([emojiListField], 'markdown');
		this.registerEditorExtension([Prec.lowest(BuilderExt(this))])//emojiListPlugin
		//this.registerEditorExtension(Prec.lowest(asyncDecoBuilderExt(this)));
	}

	private handleChangeLayout(): void {
		this.onMount();
	}

	onMount(): void {
		console.log('mounting thumbnails');
		const thumbnailDir = `${this.app.vault.configDir}/${this.settings.thumbnailsPath}`;
		getFilesInDirectory(this, thumbnailDir).then((files) => {
			this.notesWithThumbnail = [];
			files.forEach((f) => {
				const thumbnailName = f.slice(thumbnailDir.length + 1); //remove .obsidian/plugins/obsidian-icon-folder/icons + /
				const noteName = thumbnailName.slice(0, -5); //remove .webp
				this.notesWithThumbnail.push(noteName);
			});
			addIconsToDOM(this, this.notesWithThumbnail, this.registeredFileExplorers);
		});
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
}
const getFilesInDirectory = async (plugin: Plugin, dir: string): Promise<string[]> => {
	return (await plugin.app.vault.adapter.list(dir)).files;
};
const createDefaultDirectory = async (plugin: MyPlugin): Promise<void> => {
	await createDirectory(plugin, '');
};

const createDirectory = async (plugin: MyPlugin, dir: string): Promise<boolean> => {
	const doesDirExist = await plugin.app.vault.adapter.exists(`${plugin.app.vault.configDir}/${plugin.settings.thumbnailsPath}/${dir}`);
	if (!doesDirExist) {
		await plugin.app.vault.adapter.mkdir(`${plugin.app.vault.configDir}/${plugin.settings.thumbnailsPath}/${dir}`);
	}

	return doesDirExist;
};
