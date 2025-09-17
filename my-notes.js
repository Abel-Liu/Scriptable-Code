// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: file-alt;

const gitHubUrl = "https://raw.githubusercontent.com/Abel-Liu/Scriptable-Code/refs/heads/main/my-notes.js"
const x_budibase_api_key = "x-budibase-api-key"
const x_budibase_app_id = "x-budibase-app-id"
const x_budibase_table_id = "x-budibase-table-id"


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
            titleFontSize = 20;
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
    new Color("#f0f0f0"),  // 浅色模式：浅灰色背景
    new Color("#2c2c2e")   // 深色模式：深灰色背景
);

let titleTextColor = Color.dynamic(
    new Color("#333333"),  // 浅色模式：深灰色文字
    new Color("#e0e0e0")   // 深色模式：浅灰色文字
);


async function fetchPostApi() {
    try {
        if (!Keychain.contains(x_budibase_app_id) || !Keychain.contains(x_budibase_api_key) || !Keychain.contains(x_budibase_table_id)) {
            return { success: false, data: "Keychain not configured." }
        }

        const request = new Request(`https://budibase.app/api/public/v1/tables/${Keychain.get(x_budibase_table_id)}/rows/search`);
        request.method = "POST";
        request.headers = {
            'accept': 'application/json',
            'x-budibase-app-id': Keychain.get(x_budibase_app_id),
            'content-type': 'application/json',
            'x-budibase-api-key': Keychain.get(x_budibase_api_key),
        }

        request.body = JSON.stringify({ "query": { "equal": { "id": "1" } } });

        const response = await request.loadJSON();
        if (response.status && response.status != 200)
            return { success: false, data: response.message || "" }

        return { success: true, data: response.data[0].content };

    } catch (error) {
        let errorMsg = "未知错误";
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (error.statusCode) {
            errorMsg = `HTTP 错误 ${error.statusCode}`; // 捕获 HTTP 状态码（如 404、500）
        }
        return { success: false, error: errorMsg };
    }
}

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
        edit: "Set API Key",
        update: "Update code",
        exit: "Exit",
    }

    //返回值是index，正好对应数组的index
    const menuOptions = [menu.preview, menu.edit, menu.update, menu.exit]
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

    if (response == menu.edit) {
        await setAPIKey();
    }

    return
}

async function setAPIKey() {
    let apikey = Keychain.contains(x_budibase_api_key) ? Keychain.get(x_budibase_api_key) : "";
    let appid = Keychain.contains(x_budibase_app_id) ? Keychain.get(x_budibase_app_id) : "";
    let tableid = Keychain.contains(x_budibase_table_id) ? Keychain.get(x_budibase_table_id) : "";

    const returnVal = await promptForText(
        "Set API Key",
        [apikey, appid, tableid],
        ["x_budibase_api_key", "x_budibase_app_id", "x_budibase_table_id"])

    apikey = returnVal.textFieldValue(0)
    appid = returnVal.textFieldValue(1)
    tableid = returnVal.textFieldValue(2)

    Keychain.set(x_budibase_api_key, apikey)
    Keychain.set(x_budibase_app_id, appid)
    Keychain.set(x_budibase_table_id, tableid)

    await generateAlert("API Key已更新")

}

async function createWidget() {
    const res = await fetchPostApi();
    if (!res.success)
        titleTextColor = new Color("#ff3b30")

    const widget = new ListWidget();
    widget.backgroundColor = widgetBg;
    widget.setPadding(padding, padding, padding, padding);

    const titleText = widget.addText(res.data)
    titleText.font = Font.regularSystemFont(titleFontSize);
    titleText.textColor = titleTextColor;
    titleText.leftAlignText();

    widget.addSpacer();
    const updateTime = widget.addText(`最后更新：${new Date().toLocaleTimeString()}`);
    updateTime.font = Font.systemFont(10);
    updateTime.textColor = new Color("#999999");
    updateTime.centerAlignText();
    return widget;
}

// 运行脚本
if (config.runsInWidget) {
    const widget = await createWidget();
    Script.setWidget(widget);
} else {
    await showMenu(Script.name(), gitHubUrl);
}

Script.complete();
