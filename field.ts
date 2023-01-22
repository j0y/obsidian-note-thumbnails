import { syntaxTree } from "@codemirror/language";
import {
	Extension,
	RangeSetBuilder,
	StateField,
	Transaction,
} from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	WidgetType,
} from "@codemirror/view";
import { EmojiWidget } from "./widget";

export const emojiListField = StateField.define<DecorationSet>({
	create(state): DecorationSet {
		return Decoration.none;
	},
	update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();

		syntaxTree(transaction.state).iterate({
			enter(node) {
				if (node.type.name === "hmd-internal-link") {
					// Position of the '-' or the '*'.
					const listCharFrom = node.from;

					builder.add(
						listCharFrom,
						listCharFrom + 1,
						Decoration.widget({
							widget: new EmojiWidget(),
						})
					);
				}
			},
		});

		return builder.finish();
	},
	provide(field: StateField<DecorationSet>): Extension {
		return EditorView.decorations.from(field);
	},
});
