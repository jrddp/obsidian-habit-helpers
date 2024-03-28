import moment from "moment";
import { getFilesBeforeNote, getFilesFromFolder } from "src/vault-inspector";
import { getDailyNoteSettings } from 'obsidian-daily-notes-interface';

// some functions adapted from https://github.com/liamcain/obsidian-periodic-notes/blob/main/src/settings/utils.ts

export function getDateFormat() {
	return getDailyNoteSettings().format;
}

export function getDailyNotesFolder() {
	return getDailyNoteSettings().folder;
}

export function getUnorderedDailyNotes() {
	return getFilesFromFolder(getDailyNotesFolder()!);
}

export function getOrderedDailyNotes() {
	return getUnorderedDailyNotes().sort((a, b) =>
		moment(b.basename, getDateFormat()).diff(moment(a.basename, getDateFormat()))
	);
}

export function getDailyNotesBefore(date: string) {
	return getFilesBeforeNote(getOrderedDailyNotes(), date);
}
