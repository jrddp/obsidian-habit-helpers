import { Plugin } from "obsidian";
import { habitPreviewPlugin } from "./editor-plugin";

export default class HabitHelpersPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension([habitPreviewPlugin]);
	}

	onunload() {}
}
