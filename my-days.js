// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: calculator;

const gitHubUrl = "https://raw.githubusercontent.com/Abel-Liu/Scriptable-Code/refs/heads/main/my-days.js"

// Determine if the user is using iCloud.
let files = FileManager.local()
const iCloudInUse = files.isFileStoredIniCloud(module.filename)
const fileManager = iCloudInUse ? FileManager.iCloud() : FileManager.local()

// default list, can override by data json file
let dataList = [
    { title: "纪念日", date: "2024-02-22" },
    { title: "纪念日2", date: "2025-08-22" },
    { title: "MyDay", date: "2050-08-22" },
];

// Read data file as dataList, file name is same as script name
const dataPath = fileManager.joinPath(fileManager.documentsDirectory(), `${Script.name()}.json`);

try {
    if (fileManager.fileExists(dataPath)) {
        const fileContent = fileManager.readString(dataPath);
        dataList = JSON.parse(fileContent);
    }
    else {
        // 文件不存在时创建默认文件
        fileManager.writeString(dataPath, JSON.stringify(dataList));
    }
} catch (e) {
    console.error(e.message);
}

// 获取当前小组件尺寸
const widgetSize = config.widgetFamily || "medium"; // 默认中等尺寸

// 根据尺寸设置不同的字体大小和行间距
let titleFontSize, dateFontSize, rowSpacing, padding;
switch (widgetSize) {
    case "small":
        titleFontSize = 13;
        dateFontSize = 13;
        rowSpacing = 4;
        padding = 4;
        break;
    case "medium":
    case "large":
        titleFontSize = 20;
        dateFontSize = 20;
        rowSpacing = 8;
        padding = 10;
        break;
}

const widgetBg = Color.dynamic(
    new Color("#f0f0f0"),  // 浅色模式：浅灰色背景
    new Color("#2c2c2e")   // 深色模式：深灰色背景
);

const rowBg = Color.dynamic(
    new Color("#ffffff"),  // 浅色模式：白色行背景
    new Color("#3a3a3c")   // 深色模式：中灰色行背景
);

const titleTextColor = Color.dynamic(
    new Color("#333333"),  // 浅色模式：深灰色文字
    new Color("#e0e0e0")   // 深色模式：浅灰色文字
);

const dateTextColor = Color.dynamic(
    new Color("#333333"),  // 浅色模式：中灰色文字
    new Color("#e0e0e0")   // 深色模式：浅灰色文字
);

// 计算两个日期之间的年、月、天差值
function calculateTimeDifference(target) {
    const now = new Date();
    let diffInMs = now - target;

    // 如果目标日期在未来，调换
    if (diffInMs < 0) {
        diffInMs = target - now
    }

    let years = now.getFullYear() - target.getFullYear();
    let months = now.getMonth() - target.getMonth();
    let days = now.getDate() - target.getDate();

    // 调整月份和年份差异
    if (months < 0) {
        years--;
        months += 12;
    }

    // 调整天数差异（考虑不同月份的天数）
    if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();

        // 再次调整月份和年份（如果月份变为负数）
        if (months < 0) {
            months = 11;
            years--;
        }
    }

    return { years, months, days };
}

// 格式化时间差为可读字符串
function formatTimeString(diff) {
    const parts = [];
    if (diff.years > 0) parts.push(`${diff.years}年`);
    if (diff.months > 0) parts.push(`${diff.months}月`);
    // 当天数为0但有年或月时不显示0天，否则至少显示天数
    if (diff.days > 0 || parts.length === 0) parts.push(`${diff.days}天`);
    return parts.join('');
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
        edit: "Edit config",
        update: "Update code",
        exit: "Exit",
    }

    //返回值是index，正好对应数组的index
    const menuOptions = [menu.preview, menu.edit, menu.update, menu.exit]
    const response = menuOptions[await generateAlert(`${codeFilename} Menu`, menuOptions)]

    if (response == menu.preview) {
        const widget = await createWidget();
        await widget.presentMedium();
    }

    if (response == menu.update) {
        const success = await downloadCode(codeFilename, gitHubUrl)
        return await generateAlert(success ? "Update complete." : "Update failed. Please try again later.")
    }

    if (response == menu.edit) {
        await editJsonConfig();
    }

    return
}

async function editJsonConfig() {
    // dataList必定是现有配置或默认配置
    let currentJson = JSON.stringify(dataList, null, 2);

    const returnVal = await promptForText("Edit JSON", [currentJson]);
    const newJson = returnVal.textFieldValue(0);

    if (newJson !== null) {
        try {
            // 验证JSON格式
            JSON.parse(newJson);
            fileManager.writeString(dataPath, newJson);

            // 显示成功提示
            await QuickLook.present("配置已保存", "JSON配置已成功更新");
        } catch (e) {
            // 显示错误提示
            await QuickLook.present("格式错误", "请输入有效的JSON格式\n\n错误: " + e.message);
            // 重新编辑
            await editJsonConfig();
        }
    }
}

// 创建小组件内容
async function createWidget() {
    const widget = new ListWidget();
    widget.backgroundColor = widgetBg;
    widget.setPadding(padding, padding, padding, padding);

    // 2. 创建主垂直Stack（承载所有行）
    const mainVerticalStack = widget.addStack();
    mainVerticalStack.layoutVertically();
    mainVerticalStack.spacing = rowSpacing; // 行与行之间的间距

    // 3. 循环数组生成每行（水平双列Stack）
    for (const item of dataList) {
        // 3.1 创建单行水平Stack（承载title和date两列）
        const rowHorizontalStack = mainVerticalStack.addStack();
        rowHorizontalStack.layoutHorizontally();
        rowHorizontalStack.width = widget.width; // 占满小组件宽度
        rowHorizontalStack.backgroundColor = rowBg;
        rowHorizontalStack.cornerRadius = 8;  // 圆角
        rowHorizontalStack.setPadding(6, 8, 6, 8);  // 行内边距

        // 3.2 添加Title列（左对齐）
        const titleText = rowHorizontalStack.addText(item.title);
        titleText.font = Font.regularSystemFont(titleFontSize);
        titleText.textColor = titleTextColor;
        titleText.leftAlignText();
        rowHorizontalStack.addSpacer(); // 用Spacer推挤date到右侧

        // 3.3 添加Date列（右对齐）
        const dateText = rowHorizontalStack.addText(formatTimeString(calculateTimeDifference(new Date(item.date))));
        dateText.font = Font.regularSystemFont(dateFontSize);
        dateText.textColor = dateTextColor;
        dateText.rightAlignText();
    }

    return widget;
}

// 运行脚本
if (config.runsInWidget) {
    // 小组件模式
    const widget = await createWidget();
    Script.setWidget(widget);
} else {
    await showMenu(Script.name(), gitHubUrl);
}

Script.complete();
