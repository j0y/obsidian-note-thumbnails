import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import {ThumbnailWidget} from "./widget";
import MyPlugin from "./main";

function buildViewPlugin(plugin: MyPlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			plugin: MyPlugin;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
				this.plugin = plugin;
				console.log('construcot');
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			destroy() {}

			buildDecorations(view: EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();

				for (let { from, to } of view.visibleRanges) {
					syntaxTree(view.state).iterate({
						from,
						to,
						enter(node) {
							if (node.type.name === "hmd-internal-link") {
								// Position of the '-' or the '*'.
								const listCharFrom = node.from - 2;
								const nodeContent = view.state.doc.sliceString(node.from, node.to)
								console.log('internal link ',  nodeContent);
								const activeNote = plugin.app.workspace.activeEditor?.file;
								if (!activeNote) {
									return;
								}

								const linkedNote = plugin.app.metadataCache.getFirstLinkpathDest(nodeContent, activeNote.path);
								if (!linkedNote) {
									return;
								}
								const embedImage = plugin.notesWithEmbed.get(linkedNote.path)
								if (!embedImage) {
									return;
								}

								builder.add(
									listCharFrom,
									listCharFrom,
									Decoration.widget({
										widget: new ThumbnailWidget(plugin, embedImage),
									})
								);
							}
						},
					});
				}

				return builder.finish();
			}
		}, {
			decorations: (value) => value.decorations,
		}
	);
}

export function BuilderExt(plugin: MyPlugin) {
	return [buildViewPlugin(plugin)];
}
