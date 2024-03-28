import { Plugin } from "obsidian";
import { habitPreviewPlugin } from "./editor-plugin";

export default class HabitHelpersPlugin extends Plugin {
	async onload() {
		console.log("IM LOADINGG!!!")
		this.registerEditorExtension([habitPreviewPlugin]);
	}

	onunload() {}
}
