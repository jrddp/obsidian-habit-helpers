import { syntaxTree } from "@codemirror/language";
import { EditorSelection, Range } from "@codemirror/state";
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
import { isObjectLiteralElement } from "typescript";
import { escapeRegExp } from "./util";
import {
	LastDoneWidget,
	PieChartWidget,
	RelativeDateWidget,
	SmartSummaryWidget,
} from "./widgets";

enum InlineArgs {
	LastDone = "lastdone",
	SmartSum = "summary",
	PieChart = "pie",
	RelDate = "reldate",
}
let inlineArgsVals = Object.values(InlineArgs).map((a) => escapeRegExp(a));

const INLINE_PREFIX = "!hh";

// matches valid widget content, optional group  1: widget type, optional group 2: target habit
const HH_REGEX = new RegExp(
	`^${escapeRegExp(INLINE_PREFIX)}(?: (${inlineArgsVals.join(
		"|"
	)})(?: (\\^|<|"[^"]*"))?)?$`,
	"m"
);
// matches any line, group 1 is the name of the habit (ignores any habit helper widgets).
const HABIT_REGEX = new RegExp(
	"(?:> )?(?:- \\[.?\\])\\s*(.*?)(?:\\s`.*`.*)?$",
	"m"
);

enum HabitTarget {
	same_line = "<",
	above_line = "^",
}

// adapted from https://github.com/blacksmithgu/obsidian-dataview/blob/b497968fd7ccfe4241011840a8a2eb6afb1c84f7/src/ui/lp-render.ts#L44
function selectionAndRangeOverlap(
	selection: EditorSelection,
	rangeFrom: number,
	rangeTo: number
) {
	for (const range of selection.ranges) {
		if (range.from <= rangeTo && range.to >= rangeFrom) {
			return true;
		}
	}

	return false;
}

function getHabitFromLine(text: string) {
	const match = text.match(HABIT_REGEX);
	if (!match || match?.length <= 1) {
		return "";
	}
	return match[1];
}

class HabitPreviewPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (
			update.docChanged ||
			update.viewportChanged ||
			update.selectionSet ||
			update.focusChanged
		) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() {}

	buildDecorations(view: EditorView): DecorationSet {
		const currentFile = app.workspace.getActiveFile();
		if (!currentFile) return Decoration.none;

		const widgets: Range<Decoration>[] = [];

		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					const type = node.type;

					if (type.name.includes("formatting")) return;

					// check if node is inline code (`text`)
					const regex = new RegExp(".*?_?inline-code_?.*");
					if (regex.test(type.name)) {
						// contains the position of inline code
						const start = node.from;
						const end = node.to;

						const text = view.state.doc.sliceString(start, end);
						
						const hh_match = text.match(HH_REGEX);
						if (hh_match == null) return;

						// don't render widget if the cursor is in the inline code
						if (
							selectionAndRangeOverlap(
								view.state.selection,
								start - 1,
								end + 1
							)
						)
							return;

						const typeArg = hh_match[1] ?? InlineArgs.SmartSum;
						const targetArg = hh_match[2] ?? HabitTarget.same_line;
						const line = view.state.doc.lineAt(start);
						const habitDone = line.text
							.substring(0, 5)
							.contains("[x]");

						let habit;

						// Use current or above line as the habit
						if (targetArg == HabitTarget.same_line) {
							habit = getHabitFromLine(line.text);
						} else if (targetArg == HabitTarget.above_line) {
							const cur_line_num =
								view.state.doc.lineAt(start).number;
							if (cur_line_num < 1) return;
							const prevLine = view.state.doc.line(
								cur_line_num - 1
							);
							habit = getHabitFromLine(prevLine.text);
						} else {
							// trim quotes
							habit = targetArg.substring(1, targetArg.length - 1);
						}

						let widget;
						switch (typeArg) {
							case InlineArgs.LastDone:
								widget = new LastDoneWidget(habit);
								break;
							case InlineArgs.PieChart:
								widget = new PieChartWidget(habit, habitDone);
								break;
							case InlineArgs.RelDate:
								widget = new RelativeDateWidget();
								break;
							case InlineArgs.SmartSum:
							default:
								widget = new SmartSummaryWidget(habit);
								break;
						}

						widgets.push(
							Decoration.replace({
								widget: widget,
								inclusive: false,
								block: false,
							}).range(start - 1, end + 1)
						);
					}
				},
			});
		}

		const decorations = Decoration.set(widgets, true);
		return decorations;
	}
}

const pluginSpec: PluginSpec<HabitPreviewPlugin> = {
	decorations: (value: HabitPreviewPlugin) => value.decorations,
};

export const habitPreviewPlugin = ViewPlugin.fromClass(
	HabitPreviewPlugin,
	pluginSpec
);
