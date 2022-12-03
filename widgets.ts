import { EditorView, WidgetType } from "@codemirror/view";
import { getOrderedDailyNotes, getDailyNotesBefore } from "daily-notes-helper";
import { getLastDateCompleted, getSmartSummaryDate, getTimeBetween, SMART_SUMMARY_TYPE } from "vault-inspector";

function getLastCompletedText(result: string | null, fileName: string) {
  let time_since
  if (result == null) time_since = "never"
  else time_since = getTimeBetween(result, fileName);
  return "Last done " + time_since
}

function getStreakText(result: string | null, fileName: string) {
  if (result == null) return "No streak yet"
  const streak_len = getTimeBetween(result, fileName).replace(" ago", "");
  return "Streak: " + streak_len
}

export class SmartSummaryWidget extends WidgetType {
  habit: string;

  constructor(habit: string) {
    super();
    this.habit = habit;
  }

  toDOM(view: EditorView): HTMLElement {
    const span = createSpan({cls: ["habit-summary"]});

    const fname = app.workspace.getActiveFile()?.basename;
    if (fname == undefined) return span;

    const summaryResponse = getSmartSummaryDate(getDailyNotesBefore(fname), this.habit)
    summaryResponse.then(result => {
      if (result.type == SMART_SUMMARY_TYPE.LAST_COMPLETED) {
        span.innerText = getLastCompletedText(result.date, fname)
        span.classList.add("habit-summary-negative")
      } else {
        span.innerText = getStreakText(result.date, fname)
        span.classList.add("habit-summary-positive")
      }
    }).catch(result => {
      span.innerText = "An error has occured: " + result;
    });

    return span;
  }

}

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
      span.innerText = getLastCompletedText(result, fname)
    }).catch(result => {
      span.innerText = "An error has occured: " + result;
    });

    return span;
  }

}