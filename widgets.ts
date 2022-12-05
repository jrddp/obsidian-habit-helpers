import { EditorView, WidgetType } from "@codemirror/view";
import * as d3 from "d3";
import { getOrderedDailyNotes, getDailyNotesBefore } from "daily-notes-helper";
import { getLastDateCompleted, getSmartSummaryDate, getTimeBetween, getTimesCompletedInPastNDays, SMART_SUMMARY_TYPE } from "vault-inspector";

function getLastCompletedText(result: string | null, fileName: string) {
  let time_since;
  if (result == null) time_since = "never";
  else time_since = getTimeBetween(result, fileName);
  return "Last done " + time_since;
}

function getStreakText(result: string | null, fileName: string) {
  if (result == null) return "No streak yet";
  const streak_len = getTimeBetween(result, fileName).replace(" ago", "");
  return "Streak: " + streak_len;
}

export class SmartSummaryWidget extends WidgetType {
  habit: string;

  constructor(habit: string) {
    super();
    this.habit = habit;
  }

  toDOM(view: EditorView): HTMLElement {
    const span = createSpan({ cls: ["habit-summary"] });

    const fname = app.workspace.getActiveFile()?.basename;
    if (fname == undefined) return span;

    const summaryResponse = getSmartSummaryDate(getDailyNotesBefore(fname), this.habit);
    summaryResponse.then(result => {
      if (result.type == SMART_SUMMARY_TYPE.LAST_COMPLETED) {
        span.innerText = getLastCompletedText(result.date, fname);
        span.classList.add("habit-summary-negative");
      } else {
        span.innerText = getStreakText(result.date, fname);
        span.classList.add("habit-summary-positive");
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
      span.innerText = getLastCompletedText(result, fname);
    }).catch(result => {
      span.innerText = "An error has occured: " + result;
    });

    return span;
  }

}

function addPieChart(container: HTMLElement, total: number, affirmative: number) {
    const style = getComputedStyle(container)
    const colors = d3.scaleOrdinal([style.color, style.accentColor])
    // font size is in the form "##px"
    // TODO for this to properly update, widgets should be reloaded upon rescale
    const size = Number(style.fontSize.substring(0, style.fontSize.length - 2))

    const width = size, height = size
    const ri = size/4, ro = size/2;

    let svg = d3.select(container).append("svg");

    svg.attr("width", width).attr("height", height);

    let details = [
      { status: "completed", number: affirmative }, { status: "not complete", number: (total - affirmative) },
    ];
    let data = d3.pie().sort(null).value(d => d.number)(details);

    let segments = d3.arc().innerRadius(ri).outerRadius(ro)
      .padAngle(0.05).padRadius(0);

    let sections = svg.append("g")
    .attr("transform", "translate(" + size/2 + "," + size/2 + ")")
      .selectAll("path").data(data);
    sections.enter().append("path").attr("d", segments).attr("fill", (d) => colors(d.data.number));
}

export class PieChartWidget extends WidgetType {
  habit: string;

  constructor(habit: string) {
    super();
    this.habit = habit;
  }

  toDOM(view: EditorView): HTMLElement {
    const timeInterval = 7 // days
    const fname = app.workspace.getActiveFile()?.basename;

    const span = createSpan({ cls: ["habit-piechart"] });
    if (fname == undefined) return span;

    const daysCompleted = getTimesCompletedInPastNDays(getDailyNotesBefore(fname), this.habit, timeInterval)

    daysCompleted.then(result => {
      addPieChart(span, timeInterval, result)
    })

    return span;
  }

}