import moment from "moment";
import { App, TFile } from "obsidian";
import { format } from "path";

const HABIT_COMPLETE_REGEX_PREFIX = "\\[x\\]\\s";

export function getFilesFromFolder(app: App, folder: string): Array<TFile> {
  const files = app.vault.getMarkdownFiles()
    .filter(file => file.parent.path == folder);
  return files;
}

export async function isHabitComplete(app: App, file: TFile, habit: string): Promise<boolean> {
  const regexStr = HABIT_COMPLETE_REGEX_PREFIX + habit;
  const regex = new RegExp(regexStr, "gm");
  const fileContents = await app.vault.cachedRead(file);
  return regex.test(fileContents);
}

export async function getLastDateCompleted(app: App, notes_folder: string, habit: string) {
  const files = getFilesFromFolder(app, notes_folder);

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (await isHabitComplete(app, file, habit)) {
      return file.name;
    }
  }

  return "never";
}

export function getTimeBetween(date_format: string, date_old_str: string, date_new_str: string) {
  const date_old = moment(date_old_str, date_format);
  const date_new = moment(date_new_str, date_format);
  return date_old.from(date_new);
}
