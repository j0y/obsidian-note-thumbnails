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
	size: number;
	borderRadius: number;
	extraMargin: ExtraMarginSettings;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
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
	notesWithEmbed = new Map<string, string>;
	private registeredFileExplorers = new Set<ExplorerView>();

	async onload() {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => this.checkNotesAndMount());
		this.registerEvent(this.app.workspace.on('layout-change', () => this.onMount()));

		//this.registerExtensions([emojiListField], 'markdown');
		this.registerEditorExtension([Prec.lowest(BuilderExt(this))])//emojiListPlugin
		//this.registerEditorExtension(Prec.lowest(asyncDecoBuilderExt(this)));
	}

	async checkNotesAndMount() {
		const pictureExtensions = ["jpg", "jpeg", "png", "webp", "bmp", "svg", "gif", "ico"];
		const allNotes = this.app.vault.getMarkdownFiles();
		for (const note of allNotes) {
			const metadata = this.app.metadataCache.getFileCache(note)
			//console.log('metadata', metadata);
			if (metadata && metadata.embeds && metadata.embeds.length > 0) {
				for (const embed of metadata.embeds) {
					const embedFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, note.parent.path);
					if (!embedFile) {
						continue;
					}
					//console.log('embedFile', embedFile);
					if (pictureExtensions.includes(embedFile.extension)) {
						this.notesWithEmbed.set(note.path, embedFile.path);
						break;
					}
				}
			}
		}
		//console.log('this.notesWithEmbed', this.notesWithEmbed);
		await this.onMount();
	}

	async onMount() {
		addIconsToDOM(this, this.notesWithEmbed, this.registeredFileExplorers);
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
}
