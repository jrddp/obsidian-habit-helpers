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
import { LastDoneWidget, PieChartWidget, RelativeDateWidget, SmartSummaryWidget } from "./widgets";

enum InlineArgs {
  LastDone = 'l',
  SmartSum = 's',
  PieChart = 'p',
  RelDate = 'd'
}
let inlineArgsVals = Object.values(InlineArgs).map(a => escapeRegExp(a));

// todo make this an editable setting
const INLINE_PREFIX = "!h";
const WIDGET_PREFIX_REGEX_STR = escapeRegExp(INLINE_PREFIX) + "(?:" + inlineArgsVals.join("|") + "|)";
const WIDGET_REGEX_STR = "`" + WIDGET_PREFIX_REGEX_STR + "+.*`";

const PREFIX_REGEX = new RegExp("^" + WIDGET_PREFIX_REGEX_STR, "m");
// matches valid widget text such as `!h <`
const WIDGET_REGEX = new RegExp(WIDGET_REGEX_STR, "m");
const HABIT_REGEX = new RegExp("(?:> )?(?:- \\[.?\\])\\s*(.*?)\\s*(?:" + WIDGET_REGEX_STR + ")*$");

enum HabitTarget {
  same_line = "<",
  above_line = "^"
}

// adapted from https://github.com/blacksmithgu/obsidian-dataview/blob/b497968fd7ccfe4241011840a8a2eb6afb1c84f7/src/ui/lp-render.ts#L44
function selectionAndRangeOverlap(selection: EditorSelection, rangeFrom: number, rangeTo: number) {
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
    if (update.docChanged || update.viewportChanged || update.selectionSet || update.focusChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  destroy() { }

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

          const regex = new RegExp(".*?_?inline-code_?.*");
          if (regex.test(type.name)) {

            // contains the position of inline code
            const start = node.from;
            const end = node.to;

            const text = view.state.doc.sliceString(start, end);
            if (!PREFIX_REGEX.test(text)) return;

            // don't continue if current cursor position and inline code node (including formatting
            // symbols) overlap
            // ensure that the update method resets on selectionSet for this to work.
            if (selectionAndRangeOverlap(view.state.selection, start - 1, end + 1)) return;

            let typeArg = "";
            let habit = text.substring(INLINE_PREFIX.length);
            if (!habit.startsWith(" ")) {
              let argEnd = habit.indexOf(" ");
              if (argEnd == -1) argEnd = habit.length
              typeArg = habit.substring(0, argEnd);
              habit = habit.substring(argEnd);
            }
            habit = habit.trim();
            const line = view.state.doc.lineAt(start);
            const habitDone = line.text.substring(0, 5).contains("[x]");

            // Use current or above line as the habit
            if (habit == HabitTarget.same_line) {
              habit = getHabitFromLine(line.text);
            } else if (habit == HabitTarget.above_line) {
              const cur_line_num = view.state.doc.lineAt(start).number;
              if (cur_line_num < 1) return;
              const prevLine = view.state.doc.line(cur_line_num - 1);
              habit = getHabitFromLine(prevLine.text);
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