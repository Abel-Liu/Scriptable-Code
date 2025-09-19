// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: hand-point-right;

// This script generates an overlay image
// The script is meant to be called from a Shortcut. 

const gitHubUrl = "https://raw.githubusercontent.com/Abel-Liu/Scriptable-Code/main/wallpaper.js"

// Determine if the user is using iCloud.
let files = FileManager.local()
const iCloudInUse = files.isFileStoredIniCloud(module.filename)
const fileManager = iCloudInUse ? FileManager.iCloud() : FileManager.local()

const LOG_FILE = fileManager.joinPath(fileManager.documentsDirectory(), `${Script.name()}.log`);
const LOG_TO_FILE = false; // Only set to true if you want to debug any issue


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

async function writeLOG(logMsg) {
  if (!config.runsInApp && LOG_TO_FILE) {
    fileManager.writeString(LOG_FILE, getCurrentTime() + " - " + logMsg);
  }
  else
    console.log(logMsg);
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

// ============================================== CONFIGURABLE SECTION (START) ============================================== //

let ACCENT_COLOR = "#FFFFFF";
let ALPHA = 0.5; // 1 for opaque, 0 for tranparent

const DEVICE_RESOLUTION = Device.screenResolution();
const DEVICE_SCALE = Device.screenScale();
const MAX_DEVICE_SCALE = 3;
// Define fonts and sizes
// Experimental - adjusting font size based on device scale
const ULTRA_SMALL_TEXT_SIZE = Math.round(15 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const EXTRA_SMALL_TEXT_SIZE = Math.round(30 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const SMALL_TEXT_SIZE = Math.round(35 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const MEDIUM_TEXT_SIZE = Math.round(40 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const LARGE_TEXT_SIZE = Math.round(60 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const VERY_LARGE_TEXT_SIZE = Math.round(80 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const EXTRA_LARGE_TEXT_SIZE = Math.round(100 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const BIG_TEXT_SIZE = Math.round(120 * DEVICE_SCALE / MAX_DEVICE_SCALE);
const VERY_BIG_TEXT_SIZE = Math.round(130 * DEVICE_SCALE / MAX_DEVICE_SCALE);

const allfonts = {
  ultraSmall: { size: ULTRA_SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(ULTRA_SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(ULTRA_SMALL_TEXT_SIZE) },
  extraSmall: { size: EXTRA_SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(EXTRA_SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(EXTRA_SMALL_TEXT_SIZE) },
  small: { size: SMALL_TEXT_SIZE, font: Font.regularRoundedSystemFont(SMALL_TEXT_SIZE), boldFont: Font.boldSystemFont(SMALL_TEXT_SIZE) },
  medium: { size: MEDIUM_TEXT_SIZE, font: Font.regularRoundedSystemFont(MEDIUM_TEXT_SIZE), boldFont: Font.boldSystemFont(MEDIUM_TEXT_SIZE) },
  large: { size: LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(LARGE_TEXT_SIZE) },
  veryLarge: { size: VERY_LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(VERY_LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(VERY_LARGE_TEXT_SIZE) },
  extraLarge: { size: EXTRA_LARGE_TEXT_SIZE, font: Font.regularRoundedSystemFont(EXTRA_LARGE_TEXT_SIZE), boldFont: Font.boldSystemFont(EXTRA_LARGE_TEXT_SIZE) },
  big: { size: BIG_TEXT_SIZE, font: Font.regularRoundedSystemFont(BIG_TEXT_SIZE), boldFont: Font.boldSystemFont(BIG_TEXT_SIZE) },
  veryBig: { size: VERY_BIG_TEXT_SIZE, font: Font.regularRoundedSystemFont(VERY_BIG_TEXT_SIZE), boldFont: Font.boldSystemFont(VERY_BIG_TEXT_SIZE) },
}

c = new Color(ACCENT_COLOR);

let overlayImage;
let overlayBase64String;
try {
  overlayImage = createOverlay();
  overlayBase64String = encodeOverlayImage(overlayImage);
} catch (error) {
  errMsg = error.message.replace(/\s/g, "_");
  writeLOG(errMsg);
  Script.complete();
}

async function showMenu(codeFilename, gitHubUrl) {
  const menu = {
    preview: "Preview",
    update: "Update code",
    exit: "Exit",
  }

  //返回值是index，正好对应数组的index
  const menuOptions = [menu.preview, menu.update, menu.exit]
  const response = menuOptions[await generateAlert(`${codeFilename} Menu`, menuOptions)]

  if (response == menu.preview) {
    QuickLook.present(overlayImage);
  }

  if (response == menu.update) {
    const success = await downloadCode(codeFilename, gitHubUrl)
    return await generateAlert(success ? "Update complete." : "Update failed. Please try again later.")
  }

  return
}

if (config.runsInApp) {
  await showMenu(Script.name(), gitHubUrl);
  Script.complete();
}
else
  return overlayBase64String; // return to Shortcuts

/*------------------------------------------------------------------------------------------------------------------
*                                               FUNCTION DEFINITION
------------------------------------------------------------------------------------------------------------------*/

function encodeOverlayImage(overlayImage) {
  let overlayBase64String;
  try {
    const rawOverlay = Data.fromPNG(overlayImage);
    if (rawOverlay === null) {
      errMsg = "Error_convert_Image_to_Data";
      writeLOG(errMsg);
      return;
    }
    overlayBase64String = rawOverlay.toBase64String();
    if (overlayBase64String === null) {
      errMsg = "Error_convert_Data_to_Base64String";
      writeLOG(errMsg);
      return;
    }
  } catch (error) {
    errMsg = "encodeOverlayImage_" + error.message.replace(/\s/g, "_");
    writeLOG(errMsg);
    return;
  }
  writeLOG("Encoded Overlay to base64 string successfully");
  return overlayBase64String;
}

function createOverlay() {
  // Create dummy data when unable to fetch data
  if (weatherData === null) {
    NO_OF_HOURS = 8;
    NO_OF_DAYS = 7;
    weatherData = {
      "current": { "sunrise": 1612717445, "sunset": 1612703045, "temp": "?", "weather": [{ "id": 999, "main": `${labels.checkScript}` }] },
      "location": `${labels.unknown}`
    }
    weatherData.current.dt = Math.round(new Date().getTime() / 1000);
    let t0 = Math.round(new Date().getTime() / 1000);
    weatherData.hourly = [];
    for (let i = 0; i < NO_OF_HOURS; i++) {
      weatherData.hourly[i] = {};
      weatherData.hourly[i].dt = t0;
      weatherData.hourly[i].temp = 0;
      weatherData.hourly[i].pop = 0;
      weatherData.hourly[i].weather = [];
      weatherData.hourly[i].weather[0] = {};
      weatherData.hourly[i].weather[0].id = 999;
      t0 = t0 + 3600;
    }
    t0 = Math.round(new Date().getTime() / 1000);
    t1 = 0;
    weatherData.daily = [];
    for (let i = 0; i < NO_OF_DAYS; i++) {
      weatherData.daily[i] = {};
      weatherData.daily[i].dt = t0;
      weatherData.daily[i].temp = {};
      weatherData.daily[i].temp.day = 0;
      weatherData.daily[i].weather = [];
      weatherData.daily[i].weather[0] = {};
      weatherData.daily[i].weather[0].id = 999;
      t0 = t0 + 86400;
    }
  }

  const blockWidth = 80;
  const blockHeight = 50;
  const lineWidth = 5;
  const pathColor = "#FFFFFF";
  const pathAlpha = ALPHA;
  let popPathAlpha = pathAlpha + 0.1;
  if (popPathAlpha > 1) popPathAlpha = 1;
  const pathFillColor = ACCENT_COLOR;
  const textColor = "#FFFFFF";
  const textColor1 = "#BDC0C3";
  const pathHeight = 100;
  let yStepNumbers = 10;
  let xStart = 50;
  let yCenter = DEVICE_RESOLUTION.height / 2;
  let yStart = yCenter - 250;
  let imgCanvas = new DrawContext();
  imgCanvas.opaque = false;
  imgCanvas.size = DEVICE_RESOLUTION;

  /* ------------------------------------------------------------------------------------------
  PART 1: Top section with Location + Weather + Description details
  ------------------------------------------------------------------------------------------ */
  // Current weather symbol
  imgCanvas.setFont(allfonts.large.font);
  imgCanvas.setTextAlignedLeft();
  imgCanvas.setTextColor(new Color(textColor));

  // 左icon
  weatherSymbol = SFSymbol.named("snow");
  weatherSymbol.applyFont(allfonts.big.font);
  image = weatherSymbol.image;
  r = new Rect(xStart, yStart, image.size.width, image.size.height);
  imgCanvas.drawImageInRect(image, r);

  // icon右侧文字
  r = new Rect(xStart + image.size.width + 25, yStart + 20, DEVICE_RESOLUTION.width - 400, 100);
  imgCanvas.drawTextInRect("大一", r);

  imgCanvas.setFont(allfonts.medium.font);
  imgCanvas.setTextColor(new Color(textColor1));
  r = new Rect(xStart + image.size.width + 25, yStart + 100, DEVICE_RESOLUTION.width, 100);
  imgCanvas.drawTextInRect("333", r);

  // Current temperature
  imgCanvas.setFont(allfonts.extraLarge.font);
  imgCanvas.setTextAlignedRight();
  imgCanvas.setTextColor(new Color(textColor));
  r = new Rect(DEVICE_RESOLUTION.width - 350, yStart + 25, 300, 200);
  imgCanvas.drawTextInRect("44°", r);

  yStart = yStart + image.size.height + 50;

  // Heading
  imgCanvas.setFont(allfonts.large.font);
  imgCanvas.setTextAlignedLeft();
  imgCanvas.setTextColor(new Color(textColor));
  r = new Rect(xStart, yStart, DEVICE_RESOLUTION.width, 100);
  imgCanvas.drawTextInRect(`${labels.next} ${hours + 1} ${labels.hours}`, r);

  // Updated Date & Time
  imgCanvas.setFont(allfonts.small.font);
  imgCanvas.setTextAlignedRight();
  imgCanvas.setTextColor(new Color(textColor1));
  r = new Rect(xStart, yStart + 25, DEVICE_RESOLUTION.width - 100, 100);
  imgCanvas.drawTextInRect(`Updated at ${getCurrentTime()}`, r);

  yStart = yStart + 150;

  newImage = imgCanvas.getImage();
  writeLOG("Overlay created successfully");
  return newImage;
}

function getCurrentTime() {
  const date = new Date();
  const d = "0" + date.getDate();
  const m = "0" + (date.getMonth() + 1);
  const y = date.getFullYear().toString();
  const H = "0" + date.getHours();
  const M = "0" + date.getMinutes();
  return H.substr(-2) + ":" + M.substr(-2);
}
