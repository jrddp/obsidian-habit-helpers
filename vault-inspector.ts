import { App, TFile } from "obsidian";

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

  return "never"
}