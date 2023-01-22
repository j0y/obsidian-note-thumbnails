import {App, LinkCache, MarkdownView, Modal, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import {BuilderExt} from "./plugin";
import {addIconsToDOM, insertIconToNode} from "./utils";
import {ExplorerView, FileItem} from "./@types/obsidian";
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
	thumbnailsPath: 'plugins/obsidian-icon-folder/icons',// todo: use this.manifest.id
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
	private notesWithThumbnail = new Set<string>;
	private notesWithoutThumbnail = new Set<string>;
	private registeredFileExplorers = new Set<ExplorerView>();

	async onload() {
		console.log(`loading ${this.manifest.id}`);

		await this.loadSettings();

		await createDefaultDirectory(this);

		this.app.workspace.onLayoutReady(() => this.checkNotesAndMount());
		this.registerEvent(this.app.workspace.on('layout-change', () => this.onMount()));

		console.log('regirstering');
		//this.registerExtensions([emojiListField], 'markdown');
		this.registerEditorExtension([Prec.lowest(BuilderExt(this))])//emojiListPlugin
		//this.registerEditorExtension(Prec.lowest(asyncDecoBuilderExt(this)));
	}

	async checkNotesAndMount() {
		console.log('checkNotesAndMounttttt');
		const thumbnailDir = `${this.app.vault.configDir}/${this.settings.thumbnailsPath}`;
		const allNotes = this.app.vault.getMarkdownFiles();
		for (const note of allNotes) {
			if (await this.app.vault.adapter.exists(`${thumbnailDir}/${note.path}.webp`)) {
				this.notesWithThumbnail.add(note.path);
			} else {
				this.notesWithoutThumbnail.add(note.path);
			}
		}
		this.generateThumbnails();
		await this.onMount();
	}

	async onMount() {
		addIconsToDOM(this, this.notesWithThumbnail, this.registeredFileExplorers);
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	generateThumbnails() {
		console.log('generateThumbnailsvvvvsss');
		this.notesWithoutThumbnail.forEach(async note => {
			const metadata = this.app.metadataCache.getCache(note)
			console.log('metadata', metadata);
			if (metadata && metadata.embeds && metadata.embeds.length > 0) {
				//get embeds[0] and find that file and resize and save as thumbnail
				const embedFile = this.app.metadataCache.getFirstLinkpathDest(metadata.embeds[0].link, note);
				if (!embedFile) {
					return;
				}
				console.log('embedFile', embedFile);
				const image = await this.app.vault.adapter.readBinary(embedFile.path)
				console.log('image', image);
			}
		})
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

const doesFileExists = (plugin: MyPlugin, path: string): Promise<boolean> => {
	return plugin.app.vault.adapter.exists(path);
};
