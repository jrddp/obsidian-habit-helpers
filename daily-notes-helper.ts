import {
  App
} from 'obsidian';
import { getFilesFromFolder } from 'vault-inspector';

// some functions adapted from https://github.com/liamcain/obsidian-periodic-notes/blob/main/src/settings/utils.ts

// todo these are temporary constants. They should be imported from settings or, ideally, imported from the daily notes/periodic notes plugin settings
const DAILY_NOTES_FOLDER = "100 General/Note of the Days"
const DATE_FORMAT = "YYYY-MM-DD"

export function getDateFormat() {
  return DATE_FORMAT
}

export function getDailyNotesFolder() {
  return DAILY_NOTES_FOLDER
}

export function getAllDailyNotes() {
  return getFilesFromFolder(DAILY_NOTES_FOLDER)
}