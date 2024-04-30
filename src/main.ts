import { Plugin } from "obsidian";
import { habitPreviewPluginLegacy } from "./editor-plugin-legacy";
import { habitPreviewPlugin } from "./editor-plugin";

export default class HabitHelpersPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension([habitPreviewPlugin, habitPreviewPluginLegacy]);
	}

	onunload() {}
}
