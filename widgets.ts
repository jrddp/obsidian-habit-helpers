import { EditorView, WidgetType } from "@codemirror/view";
import { getAllDailyNotes, getDailyNotesBefore } from "daily-notes-helper";
import { getLastDateCompleted, getTimeBetween } from "vault-inspector";

export class LastDoneWidget extends WidgetType {
  habit: string;

  constructor(habit: string) {
    super();
    this.habit = habit;
  }

  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement("small");

    const fname = app.workspace.getActiveFile()?.basename;
    if (fname == undefined) return span;

    const last_completed = getLastDateCompleted(getDailyNotesBefore(fname), this.habit);
    last_completed.then(result => {
      let time_since;
      if (result == null) {
        time_since = "never";
      } else {
        time_since = getTimeBetween(result, fname);
      }
      span.innerText = "Last done " + time_since;
    }).catch(result => {
      span.innerText = "An error has occured: " + result;
    });

    return span;
  }

}