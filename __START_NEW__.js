// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: hand-point-right;

const gitHubUrl = "https://raw.githubusercontent.com/Abel-Liu/Scriptable-Code/main/__START_NEW__.js"

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
  } catch {
    return false
  }
}

await downloadCode(Script.name(), gitHubUrl);

Script.complete();
