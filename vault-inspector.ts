import { getDateFormat } from "./daily-notes-helper";
import moment from "moment";
import { TFile } from "obsidian";
import { escapeRegExp } from "./util";

const HABIT_COMPLETE_REGEX_PREFIX = "\\[x\\]\\s";

export function getFilesFromFolder(folder: string): Array<TFile> {
  const files = app.vault.getMarkdownFiles()
    .filter(file => file.parent.path == folder);
  return files;
}

export function getFilesBeforeNote(files: Array<TFile>, note_name: string): Array<TFile> {
  return files.filter((file) => file.basename < note_name);
}

export async function isHabitComplete(file: TFile, habit: string): Promise<boolean> {
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

export function getTimeBetween(date_old_str: string, date_new_str: string) {
  const date_format = getDateFormat();
  const date_old = moment(date_old_str, date_format);
  const date_new = moment(date_new_str, date_format);
  return date_old.from(date_new);
}
