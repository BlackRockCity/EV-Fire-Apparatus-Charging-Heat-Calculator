import { expect, test } from "@playwright/test";

const resultIds = [
  "totalKW",
  "totalBTU",
  "tons",
  "wPerSf",
  "cfm",
  "perVehKW",
  "cabKW",
  "vehKW",
  "populatedEquation"
];

function makeInventory(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) => ({
    id: `truck-${i}`,
    name: `Truck ${i}`,
    packKWh: 132,
    vehMaxKW: 150,
    charging: true,
    ...overrides
  }));
}

async function visibleText(page) {
  return page.locator("body").innerText();
}

async function box(page, selector) {
  const value = await page.locator(selector).boundingBox();
  expect(value).not.toBeNull();
  return value;
}

async function expectNoUnsafeVisibleOutput(page) {
  await expect.poll(async () => visibleText(page)).not.toMatch(/\b(?:NaN|Infinity|undefined|null)\b/i);
  for (const id of resultIds) {
    await expect(page.locator(`#${id}`)).not.toHaveText(/\b(?:NaN|Infinity|undefined|null)\b|1e\+|∞/i);
  }
}

async function expectNoPlaceholderText(page) {
  await expect(page.locator("body")).not.toContainText(/Localized text|localized text|localised text|Texto localizado|Texte localisé|(^|\s)(placeholder|TODO|TRANSLATE|untranslated)(\s|$|:)|gelokaliseerde tekst|vertaalde tekst|tijdelijke aanduiding|tekst zlokalizowany|przet[łl]umaczony tekst|symbol zast[eę]pczy|lokaliserad text|[öo]versatt text|platsh[åa]llare|lokaliseret tekst|oversat tekst|pladsholder|lokalisert tekst|oversatt tekst|plassholder|lokalisoitu teksti|k[äa][äa]nnetty teksti|paikkamerkki|lokalizovan[ýy] text|p[řr]elo[žz]en[ýy] text|z[áa]stupn[ýy] symbol|τοπικοποιημένο κείμενο|μεταφρασμένο κείμενο|σύμβολο κράτησης|טקסט מקומי|טקסט מתורגם|מציין מיקום|lokaliz[áa]lt sz[öo]veg|leford[íi]tott sz[öo]veg|hely[őo]rz[őo]|ローカライズ|翻訳テキスト|プレースホルダー|현지화|번역 텍스트|자리 표시자|نص مترجم|نص محلي|عنصر نائب|स्थानीयकृत पाठ|अनुवादित पाठ|प्लेसहोल्डर|স্থানীয়কৃত পাঠ|প্লেসহোল্ডার|teks lokal|teks terjemahan|مقامی متن|پلیس ہولڈر|локализованный текст|заполнитель|testo localizzato|segnaposto|văn bản được bản địa hóa|trình giữ chỗ|yerelleştirilmiş metin|yer tutucu|ข้อความที่แปลแล้ว|ตัวยึดตำแหน่ง|متن محلی|جای‌نگهدار|maandishi yaliyotafsiriwa|kishika nafasi|本地化文字|佔位符/i);
}

async function expectNoPersianArabicBleed(page) {
  await expect(page.locator("body")).not.toContainText(/إن|إلى|على|هذا|هذه|تم إنشاء|الحرارة|الحظيرة|خزانات|الغرفة|التزامن|التنوع|المعادلة|الوحدات|الفراغ|ينطبق|عرض التوثيق|مجاني الاستخدام|إزالة|تبديل الشحن|مركبة|شاحنة|کامیون|اتوبوس|خلیج/i);
}

async function expectNoAwkwardSwedishText(page) {
  await expect(page.locator("body")).not.toContainText(/\b(?:vik(?:en)?|fack(?:et)?|sammanbrott|befolkad|laddningstruck|truckar|lastbilar|lastbilens|apparatfacket|Bay-området)\b|Värm till rymden|In bay|bay area/i);
}

const additionalLanguages = [
  ["bn", "বাংলা"],
  ["id", "Bahasa Indonesia"],
  ["ur", "اردو"],
  ["ru", "Русский"],
  ["it", "Italiano"],
  ["vi", "Tiếng Việt"],
  ["tr", "Türkçe"],
  ["th", "ไทย"],
  ["fa", "فارسی"],
  ["sw", "Kiswahili"],
  ["zh-Hant", "繁體中文"]
];
const newLanguages = [
  ["nl", "Nederlands"],
  ["pl", "Polski"],
  ["sv", "Svenska"],
  ["da", "Dansk"],
  ["nb", "Norsk bokmål"],
  ["fi", "Suomi"],
  ["cs", "Čeština"],
  ["el", "Ελληνικά"],
  ["he", "עברית"],
  ["hu", "Magyar"]
];
const expectedLanguageOptions = [
  ["en", "🇺🇸 English"], ["zh-Hans", "🇨🇳 简体中文"], ["es", "🇲🇽 Español"],
  ["fr", "🇫🇷 Français"], ["de", "🇩🇪 Deutsch"], ["ja", "🇯🇵 日本語"],
  ["ko", "🇰🇷 한국어"], ["pt", "🇧🇷 Português"], ["ar", "🇪🇬 العربية"],
  ["hi", "🇮🇳 हिन्दी"], ["bn", "🇧🇩 বাংলা"], ["id", "🇮🇩 Bahasa Indonesia"],
  ["ur", "🇵🇰 اردو"], ["ru", "🇷🇺 Русский"], ["it", "🇮🇹 Italiano"],
  ["vi", "🇻🇳 Tiếng Việt"], ["tr", "🇹🇷 Türkçe"], ["th", "🇹🇭 ไทย"],
  ["fa", "🇮🇷 فارسی"], ["sw", "🇹🇿 Kiswahili"], ["zh-Hant", "🇹🇼 繁體中文"],
  ["nl", "🇳🇱 Nederlands"], ["pl", "🇵🇱 Polski"], ["sv", "🇸🇪 Svenska"],
  ["da", "🇩🇰 Dansk"], ["nb", "🇳🇴 Norsk bokmål"], ["fi", "🇫🇮 Suomi"],
  ["cs", "🇨🇿 Čeština"], ["el", "🇬🇷 Ελληνικά"], ["he", "🇮🇱 עברית"],
  ["hu", "🇭🇺 Magyar"]
];

async function addDefaultTruck(page) {
  await page.locator("#addTruck").click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("evHeatCalc.units");
    localStorage.removeItem("evHeatCalc.unitsManual");
  });
  await page.goto("/index.html");
});

test("basic load renders finite zero results for empty inventory", async ({ page }) => {
  await expect(page).toHaveTitle("EV Fire Apparatus Charging Heat Calculator");
  await expect(page.locator("#totalKW")).toHaveText("0.00");
  await expect(page.locator("#totalBTU")).toHaveText("0");
  await expect(page.locator("#inventoryEmpty")).toBeVisible();
  await expectNoUnsafeVisibleOutput(page);
});

test("footer shows a secure external Buy Me a Coffee link", async ({ page }) => {
  const link = page.locator("#buyMeCoffeeLink");

  await expect(link).toBeVisible();
  await expect(link).toContainText("☕");
  await expect(link).toHaveAttribute("href", "https://buymeacoffee.com/blackrockcity");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test("default Rosenbauer RTX calculation renders expected heat", async ({ page }) => {
  await addDefaultTruck(page);

  await expect(page.locator("#totalKW")).toHaveText("19.50");
  await expect(page.locator("#totalBTU")).toHaveText("66,534");
  await expect(page.locator(".headline-values .main")).toContainText("BTU/h");
  await expect(page.locator(".headline-values .sub")).toContainText("kW");
  await expectNoUnsafeVisibleOutput(page);
});

test("bay square footage clamps to revised 200,000 limit", async ({ page }) => {
  await addDefaultTruck(page);
  await page.locator("#baySf").fill("999999999999999999999999");
  await page.locator("#baySf").dispatchEvent("change");

  await expect(page.locator("#baySf")).toHaveValue("200000");
  await expect(page.locator("#warningBox")).toBeVisible();
  await expectNoUnsafeVisibleOutput(page);
});

test("2 MW vehicle max charge is accepted and values above it clamp", async ({ page }) => {
  await addDefaultTruck(page);
  await page.locator("#chargePower").fill("1000");
  await page.locator("#chargePower").dispatchEvent("input");

  const maxChargeInput = page.locator("#inventoryBody tr input[type='number']").nth(1);
  await maxChargeInput.fill("2000");
  await maxChargeInput.dispatchEvent("change");
  await expect(maxChargeInput).toHaveValue("2000");
  await expect(page.locator("#totalKW")).toHaveText("130.00");

  await maxChargeInput.fill("999999");
  await maxChargeInput.dispatchEvent("change");
  await expect(maxChargeInput).toHaveValue("2000");
  await expect(page.locator("#warningBox")).toBeVisible();
  await expectNoUnsafeVisibleOutput(page);
});

test("Level 3 accepts 2,000 kW requested charge power", async ({ page }) => {
  await addDefaultTruck(page);
  await page.locator("#chargePower").fill("2000");
  await page.locator("#chargePower").dispatchEvent("change");

  await expect(page.locator("#chargePower")).toHaveValue("2000");
  await expectNoUnsafeVisibleOutput(page);
});

test("stale clamp warning clears after entering a valid value", async ({ page }) => {
  await addDefaultTruck(page);
  await page.locator("#baySf").fill("999999999999999999999999");
  await page.locator("#baySf").dispatchEvent("change");
  await expect(page.locator("#warningBox")).toBeVisible();

  await page.locator("#baySf").fill("3300");
  await page.locator("#baySf").dispatchEvent("change");
  await expect(page.locator("#warningBox")).toBeHidden();
  await expectNoUnsafeVisibleOutput(page);
});

test("efficiency below minimum normalizes to 80", async ({ page }) => {
  await addDefaultTruck(page);
  await page.locator("#etaCharger").fill("70");
  await page.locator("#etaCharger").dispatchEvent("change");
  await page.locator("#etaVehicle").fill("70");
  await page.locator("#etaVehicle").dispatchEvent("change");

  await expect(page.locator("#etaCharger")).toHaveValue("80");
  await expect(page.locator("#etaVehicle")).toHaveValue("80");
  await expectNoUnsafeVisibleOutput(page);
});

test("compact computed vehicle counts update without secondary note text", async ({ page }) => {
  await expect(page.locator("#numVehicles")).toHaveClass(/computed-value/);
  await expect(page.locator("#numVehicles")).toHaveClass(/readonly-metric/);
  await expect(page.locator("#concurrent")).toHaveClass(/computed-value/);
  await expect(page.locator("#concurrent")).toHaveClass(/readonly-metric/);
  await expect(page.getByText("Calculated from inventory")).toHaveCount(0);
  await expect(page.getByText("Calculated from checkboxes")).toHaveCount(0);

  await addDefaultTruck(page);
  await addDefaultTruck(page);
  await expect(page.locator("#numVehicles")).toHaveText("2");
  await expect(page.locator("#concurrent")).toHaveText("2");

  await page.locator("#inventoryBody input[type='checkbox']").nth(1).uncheck();
  await expect(page.locator("#numVehicles")).toHaveText("2");
  await expect(page.locator("#concurrent")).toHaveText("1");

  await page.locator("#inventoryBody .btn-icon").first().click();
  await expect(page.locator("#numVehicles")).toHaveText("1");
  await expect(page.locator("#concurrent")).toHaveText("0");
  await expectNoUnsafeVisibleOutput(page);
});

test("inventory remove control is the compact trashcan button", async ({ page }) => {
  await addDefaultTruck(page);
  const removeButton = page.locator("#inventoryBody .btn-icon");

  await expect(removeButton).toHaveText("🗑️");
  await expect(removeButton).toHaveAttribute("aria-label", "Remove truck");
  await expect(removeButton).toHaveAttribute("title", "Remove truck");
});

test("scenario help tags are visible and expose tooltip text", async ({ page }) => {
  const helpTags = page.locator(".tooltip");

  await expect(helpTags).toHaveCount(12);
  await expect(helpTags.filter({ hasText: "help" }).first()).toBeVisible();
  await expect(page.locator("label", { hasText: "Per-vehicle charge power" }).locator(".tooltip-text")).toContainText("0–2,000 kW");
  await expect(page.locator(".computed-field-label", { hasText: "Vehicles total" }).locator(".tooltip-text")).toContainText("greyed out");
  await expect(page.locator("label", { hasText: "Charger efficiency" }).locator(".tooltip-text")).toContainText("80–99.9%");
});

test("built-in preset updates visible scenario and results", async ({ page }) => {
  await page.locator("#scenarioSelect").selectOption("preset:mixed-all-charging");
  await page.locator("#applyScenario").click();

  await expect(page.locator("#invTotalTrucks")).toHaveText("3");
  await expect(page.locator("#invChargingCount")).toHaveText("3");
  await expect(page.locator("#baySf")).toHaveValue("5000");
  await expect(page.locator("#scenarioSummary")).toContainText("3 of 3 trucks charging");
  await expectNoUnsafeVisibleOutput(page);
});

test("saved scenario can be saved, applied, and deleted", async ({ page }) => {
  await addDefaultTruck(page);
  await page.locator("#scenarioName").fill("Browser saved scenario");
  await page.locator("#saveScenario").click();

  await expect(page.locator("#scenarioSelect optgroup[label='Saved scenarios'] option")).toHaveCount(1);
  await expect(page.locator("#scenarioApplyCard")).toBeVisible();
  await expect(page.locator("#scenarioSaveCard")).toBeVisible();
  await expect(page.locator("#scenarioName")).toHaveAttribute("placeholder", "Name this scenario…");
  await expect(page.locator("#deleteScenario")).toHaveText("🗑️");
  await page.locator("#reset").click();
  await page.locator("#scenarioSelect").selectOption(/^saved:/);
  await page.locator("#applyScenario").click();
  await expect(page.locator("#invTotalTrucks")).toHaveText("1");

  page.once("dialog", async dialog => {
    expect(dialog.message()).toBe("Delete this saved scenario? This cannot be undone.");
    await dialog.dismiss();
  });
  await page.locator("#deleteScenario").click();
  await expect(page.locator("#scenarioSelect optgroup[label='Saved scenarios'] option")).toHaveCount(1);

  page.once("dialog", async dialog => {
    expect(dialog.message()).toBe("Delete this saved scenario? This cannot be undone.");
    await dialog.accept();
  });
  await page.locator("#deleteScenario").click();
  await expect(page.locator("#scenarioSelect optgroup[label='Saved scenarios'] option")).toHaveCount(0);
  await expect(page.locator("#deleteScenario")).toBeDisabled();
});

test("language selector localizes controls while Arabic keeps formulas LTR", async ({ page }) => {
  const options = await page.locator("#languageSelect option").evaluateAll(items => items.map(option => [option.value, option.textContent]));
  expect(options).toEqual(expectedLanguageOptions);

  await page.locator("#languageSelect").selectOption("de");
  await expect(page.locator("[data-i18n='appTitle']")).toContainText("Wärmerechner");
  await expect(page.locator("#applyScenario")).toHaveText("Anwenden");
  await expect(page.locator("#saveScenario")).toHaveText("Aktuelles Szenario speichern");
  await expect(page.locator("#reset")).toHaveText("Standardwerte zurücksetzen");
  await expect(page.locator("#share")).toHaveText("Teilbare URL kopieren");
  await expect(page.locator("#openReport")).toHaveText("Bericht öffnen");
  await expect(page.locator("#scenarioName")).toHaveAttribute("placeholder", "Dieses Szenario benennen…");
  await expect(page.locator("#chargeType option[value='L3']")).toHaveText("Level 3 (DC-Schnellladen)");
  await expect(page.locator(".right-column .card.out h2")).toHaveText("Ergebnisse");
  await expect(page.locator("#scenarioSummary")).toContainText("Fahrzeugen");

  await page.locator("#languageSelect").selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".formula-math").first()).toHaveCSS("direction", "ltr");
  await expect(page.locator("#populatedEquation")).toHaveCSS("direction", "ltr");
  await expectNoUnsafeVisibleOutput(page);
});

test("all 10 new languages localize the app and preserve direction and units", async ({ page }) => {
  await addDefaultTruck(page);

  for (const [lang] of newLanguages) {
    await page.locator("#languageSelect").selectOption(lang);
    await expect(page.locator("#unitsSelect"), lang).toHaveValue("si");
    await expect(page.locator(".headline-values .main"), lang).toContainText("kW");
    await expect(page.locator("[data-i18n='appTitle']"), lang).not.toHaveText("EV Fire Apparatus Charging Heat Calculator");
    await expect(page.locator(".left-column > section.card").first().locator("h2"), lang).not.toHaveText("Scenario");
    await expect(page.locator(".right-column .card.out h2"), lang).not.toHaveText("Results");
    await expect(page.locator(".left-column section").nth(3).locator("h2"), lang).not.toHaveText("Fleet Inventory");
    await expect(page.locator("#scenarioSaveCard h2"), lang).not.toHaveText("Save Scenario");
    await expect(page.locator("#reset"), lang).not.toHaveText("Reset to Defaults");
    await expect(page.locator("#openReport"), lang).not.toHaveText("Open Report");
    await expect(page.locator("#scenarioName"), lang).not.toHaveAttribute("placeholder", "Name this scenario…");
    await expect(page.locator(".computed-field:first-child .tooltip-text"), lang).not.toContainText("Automatically calculated");
    await expectNoPlaceholderText(page);
    await expect(page.locator("html"), lang).toHaveAttribute("dir", lang === "he" ? "rtl" : "ltr");
    await expect(page.locator("#populatedEquation"), lang).toHaveCSS("direction", "ltr");
  }
});

test("representative emoji-labeled options remain usable in responsive headers", async ({ page }) => {
  for (const [code, label] of expectedLanguageOptions.filter(([code]) => ["en", "es", "pt", "ar", "sw", "he"].includes(code))) {
    await expect(page.locator(`#languageSelect option[value="${code}"]`)).toHaveText(label);
  }

  await page.locator("#languageSelect").selectOption("he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("[data-i18n='appTitle']")).not.toHaveText("EV Fire Apparatus Charging Heat Calculator");

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator("#languageSelect")).toBeVisible();
    await expect(page.locator("#unitsSelect")).toBeVisible();
  }
});

test("Dutch, Polish, Hebrew, and Greek reports are localized", async ({ page, context }) => {
  await addDefaultTruck(page);

  for (const lang of ["nl", "pl", "he", "el"]) {
    await page.locator("#languageSelect").selectOption(lang);
    const popupPromise = context.waitForEvent("page");
    await page.locator("#openReport").click();
    const report = await popupPromise;
    await report.waitForLoadState("domcontentloaded");
    await expect(report.locator("body"), lang).toContainText("19.50 kW / 66,534 BTU/h");
    await expect(report.locator("body"), lang).not.toContainText("Scenario Report");
    await expect(report.locator("body"), lang).not.toContainText("Print / Save as PDF");
    await expect(report.locator("body"), lang).toContainText("m²");
    await expectNoPlaceholderText(report);
    if (lang === "he") {
      await expect(report.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(report.locator(".formula-ltr").first()).toHaveCSS("direction", "ltr");
    }
    await report.close();
  }
});

test("long localized header keeps controls grouped across responsive widths", async ({ page }) => {
  await page.locator("#languageSelect").selectOption("fr");

  await expect(page.locator("header")).toHaveCSS("position", "static");
  await expect(page.locator("header")).toHaveCSS("backdrop-filter", "none");

  await page.setViewportSize({ width: 1280, height: 900 });
  const wideTitle = await box(page, ".header-title-block");
  const wideControls = await box(page, ".header-controls");
  const wideTitleCenter = wideTitle.y + (wideTitle.height / 2);
  const wideControlsCenter = wideControls.y + (wideControls.height / 2);
  expect(Math.abs(wideTitleCenter - wideControlsCenter)).toBeLessThan(12);

  await page.setViewportSize({ width: 760, height: 900 });
  const mediumTitle = await box(page, ".header-title-block");
  const mediumControls = await box(page, ".header-controls");
  const mediumLanguage = await box(page, ".header-controls .language-control:not(.units-control)");
  const mediumUnits = await box(page, ".units-control");
  expect(mediumControls.y).toBeGreaterThan(mediumTitle.y);
  expect(Math.abs(mediumLanguage.y - mediumUnits.y)).toBeLessThan(12);

  await page.setViewportSize({ width: 390, height: 844 });
  const narrowLanguage = await box(page, ".header-controls .language-control:not(.units-control)");
  const narrowUnits = await box(page, ".units-control");
  expect(narrowUnits.y).toBeGreaterThan(narrowLanguage.y);
  await expect(page.locator("#languageSelect")).toBeVisible();
  await expect(page.locator("#unitsSelect")).toBeVisible();
});

test("RTL header remains mirrored and usable", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.locator("#languageSelect").selectOption("ar");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".header-controls")).toBeVisible();
  await expect(page.locator("#languageSelect")).toBeEnabled();
  await expect(page.locator("#unitsSelect")).toBeEnabled();
  await expect(page.locator("#populatedEquation")).toHaveCSS("direction", "ltr");
});

test("all 11 additional languages localize the app and default to SI", async ({ page }) => {
  await addDefaultTruck(page);

  for (const [lang] of additionalLanguages) {
    await page.locator("#languageSelect").selectOption(lang);
    await expect(page.locator("#unitsSelect"), lang).toHaveValue("si");
    await expect(page.locator(".headline-values .main"), lang).toContainText("kW");
    await expect(page.locator("[data-i18n='appTitle']"), lang).not.toHaveText("EV Fire Apparatus Charging Heat Calculator");
    await expect(page.locator(".left-column > section.card").first().locator("h2"), lang).not.toHaveText("Scenario");
    await expect(page.locator(".right-column .card.out h2"), lang).not.toHaveText("Results");
    await expect(page.locator(".left-column section").nth(3).locator("h2"), lang).not.toHaveText("Fleet Inventory");
    await expect(page.locator("#scenarioSaveCard h2"), lang).not.toHaveText("Save Scenario");
    await expect(page.locator("#reset"), lang).not.toHaveText("Reset to Defaults");
    await expect(page.locator("#openReport"), lang).not.toHaveText("Open Report");
    await expect(page.locator("#scenarioName"), lang).not.toHaveAttribute("placeholder", "Name this scenario…");
    await expect(page.locator(".computed-field:first-child .tooltip-text"), lang).not.toContainText("Automatically calculated");
    await expectNoPlaceholderText(page);
    await expectNoUnsafeVisibleOutput(page);

    const expectedDirection = ["ur", "fa"].includes(lang) ? "rtl" : "ltr";
    await expect(page.locator("html"), lang).toHaveAttribute("dir", expectedDirection);
    await expect(page.locator("#populatedEquation"), lang).toHaveCSS("direction", "ltr");
  }
});

test("Urdu, Russian, and Traditional Chinese reports are localized", async ({ page, context }) => {
  await addDefaultTruck(page);

  for (const lang of ["ur", "ru", "zh-Hant"]) {
    await page.locator("#languageSelect").selectOption(lang);
    const popupPromise = context.waitForEvent("page");
    await page.locator("#openReport").click();
    const report = await popupPromise;
    await report.waitForLoadState("domcontentloaded");
    await expect(report.locator("body"), lang).toContainText("19.50 kW / 66,534 BTU/h");
    await expect(report.locator("body"), lang).not.toContainText("Scenario Report");
    await expect(report.locator("body"), lang).not.toContainText("Print / Save as PDF");
    await expect(report.locator("body"), lang).not.toContainText("Headline results");
    await expect(report.locator("body"), lang).toContainText("m²");
    await expectNoPlaceholderText(report);
    if (lang === "ur") {
      await expect(report.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(report.locator(".formula-ltr").first()).toHaveCSS("direction", "ltr");
    }
    await report.close();
  }
});

test("unit selector defaults, manual override, conversions, and result labels work in browser", async ({ page }) => {
  await expect(page.locator(".header-row")).toContainText("Units");
  await expect(page.locator("#unitsSelect")).toHaveValue("ip");
  await expect(page.locator("#unitsSelect option")).toHaveCount(2);

  await page.locator("#languageSelect").selectOption("fr");
  await expect(page.locator("#unitsSelect")).toHaveValue("si");
  await expect(page.locator(".header-row")).toContainText("Unités");

  await page.locator("#unitsSelect").selectOption("ip");
  await page.locator("#languageSelect").selectOption("de");
  await expect(page.locator("#unitsSelect")).toHaveValue("ip");

  await page.locator("#unitsSelect").selectOption("si");
  await expect(page.locator("#baySf")).toHaveValue("300");
  await expect(page.locator("#deltaT")).toHaveValue(/5\.6/);
  await expect(page.locator("#baySf").locator("xpath=..")).toContainText("m²");
  await expect(page.locator("#deltaT").locator("xpath=..")).toContainText("°C");

  await addDefaultTruck(page);
  await expect(page.locator(".headline-values .main")).toHaveText("19.50 kW");
  await expect(page.locator(".headline-values .sub")).toHaveText("66,534 BTU/h");
  await expect(page.locator(".right-column .card.out .stat .u").nth(3)).toContainText("W/m²");
  await expect(page.locator(".right-column .card.out .stat .u").nth(4)).toContainText("m³/h");
  await expect(page.locator("#cfm")).toHaveText("10,467");

  await page.locator("#unitsSelect").selectOption("ip");
  await expect(page.locator("#baySf")).toHaveValue("3300");
  await expect(page.locator("#deltaT")).toHaveValue("10");
  await expect(page.locator(".headline-values .main")).toHaveText("66,534 BTU/h");
  await expect(page.locator(".headline-values .sub")).toHaveText("19.50 kW");
  await expect(page.locator(".right-column .card.out .stat .u").nth(3)).toContainText("W/ft²");
  await expect(page.locator(".right-column .card.out .stat .u").nth(4)).toContainText("CFM");
  await expectNoUnsafeVisibleOutput(page);
});

test("reports use selected unit system and Arabic mirroring remains intact", async ({ page, context }) => {
  await addDefaultTruck(page);

  await page.locator("#unitsSelect").selectOption("si");
  const siPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const siReport = await siPopup;
  await siReport.waitForLoadState("domcontentloaded");
  await expect(siReport.locator("body")).toContainText("19.50 kW / 66,534 BTU/h");
  await expect(siReport.locator("body")).toContainText("m²");
  await expect(siReport.locator("body")).toContainText("m³/h");
  await expect(siReport.locator("body")).toContainText("W/m²");
  await expectNoPlaceholderText(siReport);
  await siReport.close();

  await page.locator("#unitsSelect").selectOption("ip");
  const ipPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const ipReport = await ipPopup;
  await ipReport.waitForLoadState("domcontentloaded");
  await expect(ipReport.locator("body")).toContainText("66,534 BTU/h / 19.50 kW");
  await expect(ipReport.locator("body")).toContainText("ft²");
  await expect(ipReport.locator("body")).toContainText("CFM");
  await expect(ipReport.locator("body")).toContainText("W/ft²");
  await ipReport.close();

  await page.locator("#languageSelect").selectOption("ar");
  await expect(page.locator("#unitsSelect")).toHaveValue("ip");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#populatedEquation")).toHaveCSS("direction", "ltr");
});

test("French selection does not leave observed English GUI fragments", async ({ page, context }) => {
  await addDefaultTruck(page);
  await page.locator("#languageSelect").selectOption("fr");

  await expect(page.locator(".headline-result .kicker")).toHaveText("Chaleur totale vers la baie");
  await expect(page.locator("#scenarioSummary")).toContainText("véhicules en charge");
  await expect(page.locator("#loadContextNote")).toContainText("Équivalent à");
  await expect(page.locator("#scenarioApplyCard")).not.toContainText("Presets replace");
  await expect(page.locator(".left-column section").nth(3).locator("p.muted").first()).toContainText("Construisez votre flotte");
  await expect(page.locator("#cabNote")).toContainText("chaleur de l’armoire");
  await expect(page.locator("#reset")).toHaveText("Réinitialiser");
  await expect(page.locator("#openReport")).toHaveText("Ouvrir le rapport");
  await expect(page.locator("body")).not.toContainText("Total heat to bay");
  await expect(page.locator("body")).not.toContainText("trucks charging");
  await expect(page.locator("body")).not.toContainText("Equivalent to");
  await expect(page.locator("body")).not.toContainText("Build your fleet");
  await expect(page.locator("body")).not.toContainText("cabinet heat is included");

  const popupPromise = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const report = await popupPromise;
  await report.waitForLoadState("domcontentloaded");
  await expect(report.getByText("Rapport de scénario")).toBeVisible();
  await expect(report.getByText("Imprimer / Enregistrer en PDF")).toBeVisible();
  await expect(report.getByText("Résultats principaux")).toBeVisible();
  await expect(report.locator("body")).not.toContainText("Total heat to bay");
  await expect(report.locator("body")).not.toContainText("Fleet Inventory");
  await expect(report.locator("body")).not.toContainText("Print / Save as PDF");
  await expectNoUnsafeVisibleOutput(page);
});

test("reported incomplete languages have no placeholder text and use kW headline primary", async ({ page }) => {
  await addDefaultTruck(page);
  const languages = ["es", "pt", "ar", "hi", "ko", "ja"];
  for (const lang of languages) {
    await page.locator("#languageSelect").selectOption(lang);
    await expect(page.locator(".headline-values .main"), lang).toContainText("kW");
    await expect(page.locator(".headline-values .sub"), lang).toContainText("BTU/h");
    await expectNoPlaceholderText(page);
    await expect(page.locator("#reset")).not.toHaveText("Reset to Defaults");
    await expect(page.locator("#openReport")).not.toHaveText("Open Report");
    await expect(page.locator(".right-column .card.out h2")).not.toHaveText("Results");
  }
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.locator("#languageSelect").selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#populatedEquation")).toHaveCSS("direction", "ltr");
});

test("Persian stays Persian and Swedish reads with idiomatic UI terms", async ({ page, context }) => {
  await addDefaultTruck(page);

  await page.locator("#languageSelect").selectOption("fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".right-column .card.out h2")).toHaveText("نتایج");
  await expect(page.locator(".right-column .card.out h3")).toHaveText("تفکیک");
  await expect(page.locator("#cabNote")).toContainText("کابینت شارژر");
  await expect(page.locator("#cabNote")).toContainText("سالن");
  await expectNoPersianArabicBleed(page);
  const persianPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const persianReport = await persianPopup;
  await persianReport.waitForLoadState("domcontentloaded");
  await expect(persianReport.locator("html")).toHaveAttribute("dir", "rtl");
  await expectNoPersianArabicBleed(persianReport);
  await persianReport.close();

  await page.locator("#languageSelect").selectOption("sv");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator(".right-column .card.out h3")).toHaveText("Uppdelning");
  await expect(page.locator("#cabNote")).toContainText("laddarskåp");
  await expect(page.locator("#cabNote")).toContainText("vagnhall");
  await expectNoAwkwardSwedishText(page);
  const swedishPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const swedishReport = await swedishPopup;
  await swedishReport.waitForLoadState("domcontentloaded");
  await expect(swedishReport.getByText("Scenariorapport")).toBeVisible();
  await expectNoAwkwardSwedishText(swedishReport);
  await swedishReport.close();
});

test("Japanese, Korean, Arabic, and Hindi reports use meaningful localized labels", async ({ page, context }) => {
  await addDefaultTruck(page);
  const expected = [
    ["ja", ["シナリオレポート", "主要結果", "入力条件", "内訳"]],
    ["ko", ["시나리오 보고서", "주요 결과", "입력 가정", "분석"]],
    ["ar", ["تقرير السيناريو", "النتائج الرئيسية", "افتراضات الإدخال", "التفصيل"]],
    ["hi", ["परिदृश्य रिपोर्ट", "मुख्य परिणाम", "इनपुट मान्यताएँ", "ऊष्मा विभाजन"]]
  ];

  for (const [lang, labels] of expected) {
    await page.locator("#languageSelect").selectOption(lang);
    const popupPromise = context.waitForEvent("page");
    await page.locator("#openReport").click();
    const report = await popupPromise;
    await report.waitForLoadState("domcontentloaded");

    await expectNoPlaceholderText(report);
    await expect(report.locator("body"), lang).toContainText("19.50 kW / 66,534 BTU/h");
    for (const label of labels) {
      await expect(report.getByText(label).first(), `${lang}: ${label}`).toBeVisible();
    }
    if (lang === "ar") {
      await expect(report.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(report.locator(".formula-ltr").first()).toHaveCSS("direction", "ltr");
    }
    await report.close();
  }
});

test("localized report uses selected language and preserves LTR equations", async ({ page, context }) => {
  await addDefaultTruck(page);
  const englishPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const englishReport = await englishPopup;
  await englishReport.waitForLoadState("domcontentloaded");
  await expect(englishReport.locator("body")).toContainText("66,534 BTU/h / 19.50 kW");

  await page.locator("#languageSelect").selectOption("es");
  const spanishPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const spanishReport = await spanishPopup;
  await spanishReport.waitForLoadState("domcontentloaded");
  await expect(spanishReport.locator("body")).toContainText("19.50 kW / 66,534 BTU/h");
  await expect(spanishReport.locator("body")).not.toContainText("Print / Save as PDF");
  await expectNoPlaceholderText(spanishReport);

  await page.locator("#languageSelect").selectOption("de");
  const germanPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const germanReport = await germanPopup;
  await germanReport.waitForLoadState("domcontentloaded");
  await expect(germanReport.getByText("Szenariobericht")).toBeVisible();
  await expect(germanReport.getByText("Drucken / Als PDF speichern")).toBeVisible();
  await expect(germanReport.getByText("Bericht schließen")).toBeVisible();
  await expect(germanReport.getByText("Flotteninventar")).toBeVisible();

  await page.locator("#languageSelect").selectOption("ar");
  const arabicPopup = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const arabicReport = await arabicPopup;
  await arabicReport.waitForLoadState("domcontentloaded");
  await expect(arabicReport.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(arabicReport.locator(".formula-ltr").first()).toHaveCSS("direction", "ltr");
  await expect(arabicReport.getByText("تقرير السيناريو")).toBeVisible();
});

test("Open Report creates safe report tab", async ({ page, context }) => {
  await page.evaluate(() => {
    truckInventory = [{
      id: "xss",
      name: "<script>window.__reportXss=true</script>",
      packKWh: 132,
      vehMaxKW: 150,
      charging: true
    }];
    updateInventoryDisplay();
    recalc();
  });
  const popupPromise = context.waitForEvent("page");
  await page.locator("#openReport").click();
  const report = await popupPromise;
  await report.waitForLoadState("domcontentloaded");

  await expect(report.getByText("Scenario Report")).toBeVisible();
  await expect(report.getByText("Print / Save as PDF")).toBeVisible();
  await expect(report.getByText("Close report")).toBeVisible();
  await expect.poll(() => report.evaluate(() => window.__reportXss === true)).toBe(false);
});

test("oversized URL inventory is limited to 100 trucks and remains responsive", async ({ page }) => {
  const inv = Array.from({ length: 101 }, (_, i) => ({
    id: i,
    name: "T",
    packKWh: 1,
    vehMaxKW: 1,
    charging: true
  }));
  await page.goto(`/index.html?inv=${encodeURIComponent(JSON.stringify(inv))}`);

  await expect(page.locator("#invTotalTrucks")).toHaveText("100");
  await expect(page.locator("#inventoryBody tr")).toHaveCount(100);
  await expect(page.locator("#warningBox")).toBeVisible();
  await expect(page.locator("#addTruck")).toBeEnabled();
  await expectNoUnsafeVisibleOutput(page);
});

test("truck names render as text and do not execute script injection", async ({ page }) => {
  const payload = `<img src=x onerror="window.__xss=true"><script>window.__xss=true</script>`;
  const inv = makeInventory(1, { name: payload });
  await page.goto(`/index.html?inv=${encodeURIComponent(JSON.stringify(inv))}`);

  await expect.poll(() => page.evaluate(() => window.__xss === true)).toBe(false);
  await expect(page.locator("#inventoryBody img")).toHaveCount(0);
  await expect(page.locator("#inventoryBody script")).toHaveCount(0);
  await expect(page.locator("#inventoryBody input[type='text']")).toHaveValue(payload);
  await expectNoUnsafeVisibleOutput(page);
});

test("Level 2 caps charge power and Level 3 restores the previous value", async ({ page }) => {
  await page.locator("#chargePower").fill("150");
  await page.locator("#chargePower").dispatchEvent("input");
  await page.locator("#chargeType").selectOption("L2");

  await expect(page.locator("#chargePower")).toHaveValue("19.2");

  await page.locator("#chargeType").selectOption("L3");
  await expect(page.locator("#chargePower")).toHaveValue("150");
  await expectNoUnsafeVisibleOutput(page);
});
