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
import {MarkdownView, TFile} from "obsidian";

function buildViewPlugin(plugin: MyPlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			plugin: MyPlugin;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
				this.plugin = plugin;
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
								//console.log('internal link ',  nodeContent);
								const leafs = plugin.app.workspace.getLeavesOfType('markdown');
								//console.log('leafs', leafs);
								for (const leaf of leafs) {
									if (leaf.view instanceof MarkdownView && leaf.view.file) {
										const file: TFile = leaf.view.file;
										const linkedNote = plugin.app.metadataCache.getFirstLinkpathDest(nodeContent, file.path);
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
										break;
									}
								}
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
