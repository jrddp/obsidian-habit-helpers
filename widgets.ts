import { EditorView, WidgetType } from "@codemirror/view";

export class LastDoneWidget extends WidgetType {
  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement("small");

    span.innerText = "Last done x days ago";

    return span;
  }

}