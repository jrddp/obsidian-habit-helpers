import { getDateFormat, getDailyNotesFolder } from "./daily-notes-helper";
import moment from "moment";
import { TAbstractFile, TFile } from "obsidian";
import { escapeRegExp } from "./util";
import path from "path"

const HABIT_COMPLETE_REGEX_PREFIX = "\\[x\\]\\s";

export enum SMART_SUMMARY_TYPE {
	LAST_COMPLETED,
	STREAK,
}

export type SmartSummaryResponse = {
	type: SMART_SUMMARY_TYPE;
	date: string | null;
};

export async function getSmartSummaryDate(
	files: Array<TFile>,
	habit: string
): Promise<SmartSummaryResponse> {
	// never completed before if there are no files
	if (files.length == 0) {
		return { type: SMART_SUMMARY_TYPE.LAST_COMPLETED, date: null };
	}

	let sum_type: SMART_SUMMARY_TYPE;
	let date: string;
	const firstFile = files[0];
	// habit completed day before -> streak, otherwise, last completed
	if (await isHabitComplete(firstFile, habit)) {
		return {
			type: SMART_SUMMARY_TYPE.STREAK,
			date: await getFirstDateOfStreak(files, habit),
		};
	} else {
		return {
			type: SMART_SUMMARY_TYPE.LAST_COMPLETED,
			date: await getLastDateCompleted(files, habit),
		};
	}
}

export function getFilesFromFolder(folder: string): Array<TFile> {
	const files = app.vault
		.getMarkdownFiles()
		.filter((file) => file.parent.path == folder);
	return files;
}

export function getFilesBeforeNote(
	files: Array<TFile>,
	note_name: string
): Array<TFile> {
	return files.filter((file) => file.basename < note_name);
}

export async function isHabitComplete(
	file: TFile,
	habit: string
): Promise<boolean> {
	const regexStr = HABIT_COMPLETE_REGEX_PREFIX + escapeRegExp(habit);
	const regex = new RegExp(regexStr, "gm");
	const fileContents = await app.vault.cachedRead(file);
	return regex.test(fileContents);
}

export async function getLastDateCompleted(files: Array<TFile>, habit: string) {
	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		if (await isHabitComplete(file, habit)) {
			return file.basename;
		}
	}
	return null;
}

export async function getCompletionInPastNDays(
	currentFile: string,
	habit: string,
	n: number
): Promise<boolean[]> {

	const dateFormat = getDateFormat();
	const folder = getDailyNotesFolder();
	const currentDate = moment(currentFile, dateFormat);
	const pastDays = [];
	for (let i = n - 1; i >= 0; i--) {
		const pastDate = currentDate.clone().subtract(i, 'days');
		const formattedDate = pastDate.format(dateFormat);
		const file = app.vault.getAbstractFileByPath(`${folder}${path.sep}${formattedDate}.md`);
		const isComplete = file instanceof TFile ? await isHabitComplete(file, habit) : false;
		pastDays.push(isComplete);
	}
	return pastDays;
}

export async function getFirstDateOfStreak(files: Array<TFile>, habit: string) {
	let firstDateFile = null;
	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		if (!(await isHabitComplete(file, habit))) break;
		firstDateFile = file;
	}
	return firstDateFile ? firstDateFile.basename : null;
}

export function getTimeBetween(date_old_str: string, date_new_str: string) {
	const date_format = getDateFormat();
	const date_old = moment(date_old_str, date_format);
	const date_new = moment(date_new_str, date_format);
	return date_old.from(date_new);
}

export function getTimeSince(date_old_str: string) {
	const date_format = getDateFormat();
	const date_old = moment(date_old_str, date_format);
	let result = date_old.from(moment().startOf("day"));
	if (result == "a few seconds ago") {
		result = "Today";
	} else if (result == "a day ago") {
		result = "Yesterday";
	}
	return result;
}
