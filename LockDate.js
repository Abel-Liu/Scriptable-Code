// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: calendar-alt;

const gitHubUrl = "https://raw.githubusercontent.com/Abel-Liu/Scriptable-Code/main/LockDate.js"

// Determine if the user is using iCloud.
let files = FileManager.local()
const iCloudInUse = files.isFileStoredIniCloud(module.filename)
const fileManager = iCloudInUse ? FileManager.iCloud() : FileManager.local()

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
      AccessoryCircular: "AccessoryCircular",
      AccessoryRectangular: "AccessoryRectangular",
      AccessoryInline: "AccessoryInline",
      exit: "Exit",
    }

    const previewMenuOptions = [preview_menu.AccessoryCircular, preview_menu.AccessoryRectangular, preview_menu.AccessoryInline]
    const preview_type = previewMenuOptions[await generateAlert("Preview", previewMenuOptions)]

    if (preview_type != preview_menu.exit) {
      const multiLineCode = `
                return (async () => {
                    await widget.present${preview_type}();
                })();
                `;

      const previewFun = new Function('widget', multiLineCode);

      const widget = await createAccessoryWidget();
      await previewFun(widget);
    }
  }

  if (response == menu.update) {
    const success = await downloadCode(codeFilename, gitHubUrl)
    return await generateAlert(success ? "Update complete." : "Update failed. Please try again later.")
  }

  return
}

async function createAccessoryWidget() {
  const widget = new ListWidget();
  widget.addAccessoryWidgetBackground = true;

  const date = new Date();

  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 星期映射（0=周日，1=周一...6=周六）
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];

  const dateText = widget.addText(`${month}月${day}号 周${weekday}`);
  dateText.font = Font.regularSystemFont(12);
  dateText.centerAlignText();

  return widget;
}

// 运行脚本
if (config.runsInWidget) {
  const widget = await createAccessoryWidget();
  Script.setWidget(widget);
} else {
  await showMenu(Script.name(), gitHubUrl);
}

Script.complete();
