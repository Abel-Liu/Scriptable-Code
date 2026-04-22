// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: file-alt;

// 实现点击刷新再回到home screen
// 组件点击打开url：shortcuts://x-callback-url/run-shortcut?name=outlook_note
// 这个shortcut执行Refresh all scriptable 的scripts

const gitHubUrl = "https://raw.githubusercontent.com/Abel-Liu/Scriptable-Code/refs/heads/main/outlook-note.js"

// Determine if the user is using iCloud.
let files = FileManager.local()
const iCloudInUse = files.isFileStoredIniCloud(module.filename)
const fileManager = iCloudInUse ? FileManager.iCloud() : FileManager.local()

// 获取当前小组件尺寸
const widgetSize = config.widgetFamily || "medium"; // 默认中等尺寸

let { titleFontSize, padding } = getWidgetStyles(widgetSize);

// 根据尺寸设置不同的字体大小和行间距
function getWidgetStyles(widgetSize) {
    let titleFontSize = 13;
    let padding = 4;

    switch (widgetSize) {
        case "small":
            titleFontSize = 13;
            padding = 4;
            break;
        case "medium":
        case "large":
            titleFontSize = 15;
            padding = 10;
            break;
    }

    // 返回配置对象
    return {
        titleFontSize,
        padding
    };
}

const widgetBg = Color.dynamic(
    new Color("#FFFFE0"),  // 浅色模式
    new Color("#2c2c2e")   // 深色模式：深灰色背景
);

let titleTextColor = Color.dynamic(
    new Color("#333333"),  // 浅色模式：深灰色文字
    new Color("#e0e0e0")   // 深色模式：浅灰色文字
);

async function downloadCode(filename, url) {
    try {
        const codeString = await new Request(url).loadString()
        if (codeString.indexOf("// Variables used by Scriptable.") < 0) {
            return false
        } else {
            fileManager.writeString(fileManager.joinPath(fileManager.documentsDirectory(), filename + ".js"), codeString)
            return true
        }
    } catch (e) {
        console.error(e.message)
        return false
    }
}

// Generate an alert with the provided array of options.
async function generateAlert(title, options, message) {
    return await generatePrompt(title, message, options)
}

// Default prompt for text field values.
async function promptForText(title, textvals, placeholders, message) {
    return await generatePrompt(title, message, null, textvals, placeholders)
}

// Generic implementation of an alert.
async function generatePrompt(title, message, options, textvals, placeholders) {
    const alert = new Alert()
    alert.title = title
    if (message) alert.message = message

    const buttons = options || ["OK"]
    for (button of buttons) { alert.addAction(button) }

    if (!textvals) { return await alert.presentAlert() }

    for (i = 0; i < textvals.length; i++) {
        alert.addTextField(placeholders && placeholders[i] ? placeholders[i] : null, (textvals[i] || "") + "")
    }

    if (!options) await alert.present()
    return alert
}

async function showMenu(codeFilename, gitHubUrl) {
    const menu = {
        preview: "Show widget preview",
        update: "Update code",
        exit: "Exit",
    }

    //返回值是index，正好对应数组的index
    const menuOptions = [menu.preview, menu.update, menu.exit]
    const response = menuOptions[await generateAlert(`${codeFilename} Menu`, menuOptions)]

    if (response == menu.preview) {
        const preview_menu = {
            Small: "Small",
            Medium: "Medium",
            Large: "Large",
            exit: "Exit",
        }

        const previewMenuOptions = [preview_menu.Small, preview_menu.Medium, preview_menu.Large]
        const preview_type = previewMenuOptions[await generateAlert("Preview", previewMenuOptions)]

        if (preview_type != preview_menu.exit) {
            ({ titleFontSize, padding } = getWidgetStyles(preview_type.toLowerCase()));

            const multiLineCode = `
                return (async () => {
                    await widget.present${preview_type}();
                })();
                `;

            const previewFun = new Function('widget', multiLineCode);

            const widget = await createWidget();
            await previewFun(widget);
        }
    }

    if (response == menu.update) {
        const success = await downloadCode(codeFilename, gitHubUrl)
        return await generateAlert(success ? "Update complete." : "Update failed. Please try again later.")
    }

    return
}

async function createWidget() {
    const dataPath = fileManager.joinPath(fileManager.documentsDirectory(), 'outlooknote.txt');
    let note = ''
    try {
        if (fileManager.fileExists(dataPath)) {
            note = fileManager.readString(dataPath);
        }
        else {
            // 文件不存在时创建默认文件
            fileManager.writeString(dataPath, '');
        }
    } catch (e) {
        console.error(e.message);
    }

    const widget = new ListWidget();
    widget.backgroundColor = widgetBg;
    widget.setPadding(padding, padding, padding, padding);

    const titleText = widget.addText(note)
    titleText.font = Font.regularSystemFont(titleFontSize);
    titleText.textColor = titleTextColor;
    titleText.leftAlignText();

    return widget;
}

const LOG_FILE = fileManager.joinPath(fileManager.documentsDirectory(), `${Script.name()}.log`);
const LOG_TO_FILE = false; // Only set to true if you want to debug any issue

function writeLOG(logMsg) {
    if (LOG_TO_FILE) {
        fileManager.writeString(LOG_FILE, new Date().toLocaleString() + " - " + logMsg);
    }
    else
        console.log(logMsg);
}

if (config.runsInWidget) {
    const widget = await createWidget();
    Script.setWidget(widget);
} else {
    await showMenu(Script.name(), gitHubUrl);
}

Script.complete();
