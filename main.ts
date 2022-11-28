import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';
import { getLastDateCompleted, getTimeBetween } from 'vault-inspector';
import { habitPreviewPlugin } from "./editor-plugin";

// Remember to rename these classes and interfaces!

// todo these are temporary constants. They should be imported from settings or, ideally, imported from the daily notes/periodic notes plugin settings
const DAILY_NOTES_FOLDER = "100 General/Note of the Days"
const DATE_FORMAT = "YYYY-MM-DD"

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension([habitPreviewPlugin]);

		this.addRibbonIcon("info", "Calculate average file length", async () => {
			const fileLength = await this.averageFileLength();
			new Notice(`The average file length is ${fileLength} characters.`);
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'habit-last-complete-modal',
			name: 'Check when habit was last completed',
			callback: () => {
				new LastDoneModal(this.app, (result) => {
					const date = getLastDateCompleted(this.app, DAILY_NOTES_FOLDER, result);
					date.then(result => new Notice(getTimeBetween(DATE_FORMAT, result, "2022-11-28")))
					.catch(result => new Notice("An error occurred: " + result))
				}).open();
			}
		});

	}

	async averageFileLength(): Promise<string | undefined> {
		const { vault } = this.app;

		const dailyNoteFiles = vault.getMarkdownFiles().filter(file => file.parent.path == "100 General/Note of the Days");

		return dailyNoteFiles[0].name;

		// const fileContents: string[] = await Promise.all(
		// 	dailyNoteFiles.map((file) => vault.cachedRead(file))
		// );

		// let totalLength = 0;
		// fileContents.forEach((content) => {
		// 	totalLength += content.length;
		// });

		// return (totalLength / fileContents.length).toString();
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LastDoneModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "What is the habit?" });

		new Setting(contentEl)
			.setName("Habit")
			.addText((text) =>
				text.onChange((value) => {
					this.result = value;
				}));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.result);
					}));
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}

}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
