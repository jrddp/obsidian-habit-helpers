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
import { escapeRegExp } from "./util";
import { LastDoneWidget } from "./widgets";

// todo make this an editable setting
const INLINE_PREFIX = "!h"
const PREFIX_REGEX = new RegExp("^" + escapeRegExp(INLINE_PREFIX) + "\\s+\\S", "m")

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

class HabitPreviewPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  destroy() { }

  buildDecorations(view: EditorView): DecorationSet {
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
            if (!PREFIX_REGEX.test(text)) return

            // don't continue if current cursor position and inline code node (including formatting
            // symbols) overlap
            // ensure that the update method resets on selectionSet for this to work.
            if (selectionAndRangeOverlap(view.state.selection, start - 1, end + 1)) return;

            const args = text.substring(INLINE_PREFIX.length).trim().split(" ")
            let habit = args[0]

            // Use current or above line as the habit
            if (habit == HabitTarget.same_line) {
              const line = view.state.doc.lineAt(start)
              habit = line.text.substring(0, line.text.length - (end - start + 2) - 1).substring(5).trim()
              console.log("Habit: " + habit)
            } else if (habit == HabitTarget.above_line) {
              const cur_line_num = view.state.doc.lineAt(start).number
              if (cur_line_num < 1) return
              const line = view.state.doc.line(cur_line_num - 1)
              habit = line.text.substring(5).trim()
            }

            widgets.push(
              Decoration.replace({
                widget: new LastDoneWidget(habit),
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