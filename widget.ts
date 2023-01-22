import { EditorView, WidgetType } from "@codemirror/view";
import MyPlugin from "./main";
import {insertIconToNode} from "./utils";

export class ThumbnailWidget extends WidgetType {
	plugin: MyPlugin;
	content: string;

	constructor(plugin: MyPlugin, content: string) {
		super();
		this.content = content;
		this.plugin = plugin;
	}
	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("span");

		div.classList.add('obsidian-icon-folder-icon');
		const iconName = this.plugin.settings.thumbnailsPath + '/' + this.content + '.md.webp';
		insertIconToNode(this.plugin, iconName, div);

		return div;
	}
}
