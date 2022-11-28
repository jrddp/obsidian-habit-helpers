import { EditorView, WidgetType } from "@codemirror/view";
import { getAllDailyNotes, getDateFormat } from "daily-notes-helper";
import { getLastDateCompleted, getTimeBetween } from "vault-inspector";

export class LastDoneWidget extends WidgetType {
  habit: string

  constructor(habit: string) {
    super()
    this.habit = habit
  }

  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement("small");

    const last_completed = getLastDateCompleted(getAllDailyNotes(), this.habit)
    last_completed.then(result => {
      console.log("result: " + result)
      const time_since = getTimeBetween(result, "2022-11-28")
      span.innerText = "Last done " + time_since
    })

    return span;
  }

}