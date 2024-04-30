import { EditorView, WidgetType } from "@codemirror/view";
import * as d3 from "d3";
import {
	getOrderedDailyNotes,
	getDailyNotesBefore,
} from "src/daily-notes-helper";
import {
	getCompletionInPastNDays,
	getLastDateCompleted,
	getSmartSummaryDate,
	getTimeBetween,
	getTimeSince,
	SMART_SUMMARY_TYPE,
} from "src/vault-inspector";
import moment from "moment";
import tippy from "tippy.js";

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

	eq(other: WidgetType): boolean {
		if (!(other instanceof SmartSummaryWidget)) return false;
		return other.habit == this.habit;
	}

	toDOM(view: EditorView): HTMLElement {
		const span = createSpan({ cls: ["habit-summary"] });

		const fname = app.workspace.getActiveFile()?.basename;
		if (fname == undefined) return span;

		const summaryResponse = getSmartSummaryDate(
			getDailyNotesBefore(fname),
			this.habit
		);
		summaryResponse
			.then((result) => {
				if (result.type == SMART_SUMMARY_TYPE.LAST_COMPLETED) {
					span.innerText = getLastCompletedText(result.date, fname);
					span.classList.add("habit-summary-negative");
				} else {
					span.innerText = getStreakText(result.date, fname);
					span.classList.add("habit-summary-positive");
				}
			})
			.catch((result) => {
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

	eq(other: WidgetType): boolean {
		if (!(other instanceof LastDoneWidget)) return false;
		return other.habit == this.habit;
	}

	toDOM(view: EditorView): HTMLElement {
		const span = createSpan({ cls: ["habit-lastdone"] });

		const fname = app.workspace.getActiveFile()?.basename;
		if (fname == undefined) return span;

		const last_completed = getLastDateCompleted(
			getDailyNotesBefore(fname),
			this.habit
		);
		last_completed
			.then((result) => {
				span.innerText = getLastCompletedText(result, fname);
			})
			.catch((result) => {
				span.innerText = "An error has occured: " + result;
			});

		return span;
	}
}

function addPieChart(
	container: HTMLElement,
	total: number,
	affirmative: number
) {
	const style = getComputedStyle(container);
	const colors = d3.scaleOrdinal([style.color, style.accentColor]);
	// font size is in the form "##px"
	// TODO for this to properly update, widgets should be reloaded upon rescale
	const size = Number(style.fontSize.substring(0, style.fontSize.length - 2));

	const width = size,
		height = size;
	const ri = size / 4,
		ro = size / 2;

	let svg = d3.select(container).append("svg");

	svg.attr("width", width).attr("height", height);

	let details = [
		{ status: "completed", number: affirmative },
		{ status: "not complete", number: total - affirmative },
	];
	let data = d3
		.pie()
		.sort(null)
	// @ts-ignore
		.value((d) => d.number)(details);

	let segments = d3
		.arc()
		.innerRadius(ri)
		.outerRadius(ro)
		.padAngle(0.05)
		.padRadius(0);

	let sections = svg
		.append("g")
		.attr("transform", "translate(" + size / 2 + "," + size / 2 + ")")
		.selectAll("path")
		.data(data);
	sections
		.enter()
		.append("path")
	// @ts-ignore
		.attr("d", segments)
	// @ts-ignore
		.attr("fill", (d) => colors(d.data.number));
}

export class PieChartWidget extends WidgetType {
	habit: string;
	curDayDone: boolean;

	constructor(habit: string, curDayDone: boolean) {
		super();
		this.habit = habit;
		this.curDayDone = curDayDone;
	}

	eq(other: WidgetType): boolean {
		if (!(other instanceof PieChartWidget)) return false;
		return other.habit == this.habit && other.curDayDone == this.curDayDone;
	}

	toDOM(view: EditorView): HTMLElement {
		const n = 7; // days
		const fname = app.workspace.getActiveFile()?.basename;

		const span = createSpan({ cls: ["habit-piechart"] });
		if (fname == undefined) return span;

		const tooltip = createSpan({ cls: ["habit-piechart-tooltip"] });

		const days = getCompletionInPastNDays(
			fname,
			this.habit,
			n - 1
		);

		days.then((res) => {
			res.push(this.curDayDone);
			let count = res.reduce((acc, val) => acc + (val ? 1 : 0), 0);
			addPieChart(span, n, count);

			res.forEach((val, i) => {
				let curEl = createSpan();
				const daysAgo = n - i - 1;

				curEl.addClass(
					val ? "habit-summary-positive" : "habit-summary-negative"
				);
				if (daysAgo == 0) curEl.addClass("habit-summary-focused");

				curEl.setText(
					moment(fname).subtract(daysAgo, "days").format("dd")
				);
				tooltip.appendChild(curEl);
			});

			tippy(span, {
				content: tooltip,
			});
		});

		return span;
	}
}

export class RelativeDateWidget extends WidgetType {
	eq(other: WidgetType): boolean {
		return other instanceof RelativeDateWidget;
	}

	toDOM(view: EditorView): HTMLElement {
		const fname = app.workspace.getActiveFile()?.basename;

		const span = createSpan({ cls: ["habit-reldate"] });
		if (fname == undefined) return span;

		const time_since = getTimeSince(fname);

		span.innerText = time_since;
		return span;
	}
}
