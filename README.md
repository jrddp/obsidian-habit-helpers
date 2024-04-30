# Obsidian Habit Helpers
This plugin adds previews for your habits to be used alongside Obsidian's daily notes plugin.

## Usage
To add a widget, type an inline code block with the `!hh` prefix.
The syntax is as follows:

`!hh {type} {target}`

Where `{type}` is `summary`, `pie`, or `reldate`. If left blank, it will default to `summary`.
And `{target}` is `<`, `^`, or `"{habit}"`. `<` will use the habit on the same line and is the default. `^` will use the habit on the line above. `"{habit}"` will explicitly show the data of the specified habit.

## Widgets
### Smart Summary (`!hh summary` or just `!hh`)
If you have a streak of doing the habit multiple days in a row, it will show the streak. Otherwise, it will show how many days it's been since you've done that habit.
![Smart Summary Demo](images/piechart.gif)

### Pie Chart (`!hh pie`)
Shows a pie chart of your habit performance in the past week. Hovering will show details on which days you missed.
![Pie Chart Demo](images/piechart.gif)

### Relative Date (`!hh reldate`)
Will show the date of the daily note in a relative date format. I.e. "Yesterday", "Today", "a month ago", etc.
![Reldate Demo](images/reldate.gif)

## Installation
This plugin is currently pending review for the Obsidian Plugin Marketplace. To install manually, you can create a folder in the `.obsidian/plugins` directory of your workspace called "definition-format-shortcut", and add the `main.js` and `manifest.json` files from the latest release on GitHub.