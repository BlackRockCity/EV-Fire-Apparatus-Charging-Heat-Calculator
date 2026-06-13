import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve("index.html"), "utf8");
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
const numericFields = {
  baySf: { min: 1, max: 200_000 },
  chargePower: { min: 0, max: 2_000 },
  etaCharger: { min: 80, max: 99.9 },
  etaVehicle: { min: 80, max: 99.9 },
  btmsToRoom: { min: 0, max: 100 },
  deltaT: { min: 1, max: 100 },
  diversity: { min: 0, max: 1 },
  safetyPct: { min: 0, max: 100 }
};
const abusiveValues = [
  "",
  "0",
  "-1",
  "12.7",
  "999999999999999999999999",
  "1e309",
  "Infinity",
  "NaN",
  "abc",
  "   ",
  "1<script>alert(1)</script>"
];

function createApp(url = "https://example.test/index.html") {
  const dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = vi.fn();
      window.history.replaceState = vi.fn();
      window.navigator.clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
      window.jspdf = {
        jsPDF: class {
          constructor() {
            this.internal = {
              pageSize: { getWidth: () => 210, getHeight: () => 297 }
            };
            this.GState = class {};
            this.saved = false;
            this.pages = 1;
          }
          setFillColor() {}
          roundedRect() {}
          setDrawColor() {}
          setLineWidth() {}
          setGState() {}
          line() {}
          setFontSize() {}
          setTextColor() {}
          setFont() {}
          text() {}
          addPage() { this.pages += 1; }
          getNumberOfPages() { return this.pages; }
          setPage() {}
          save() { this.saved = true; }
        }
      };
    }
  });

  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  return dom;
}

function addTruck(window, { name = "Rosenbauer RTX", packKWh = 132, vehMaxKW = 150, charging = true } = {}) {
  window.eval(`truckInventory.push({
    id: Date.now() + Math.random(),
    name: ${JSON.stringify(name)},
    packKWh: ${JSON.stringify(packKWh)},
    vehMaxKW: ${JSON.stringify(vehMaxKW)},
    charging: ${JSON.stringify(charging)}
  })`);
  window.updateInventoryDisplay();
  window.recalc();
}

function inventory(window) {
  return window.eval("truckInventory");
}

function assertNoUnsafeRenderedOutput(window) {
  for (const id of resultIds) {
    const text = window.document.getElementById(id).textContent;
    expect(text).not.toMatch(/\b(?:NaN|Infinity|undefined|null)\b|1e\+|∞/i);
  }
}

function dispatch(window, id, eventName) {
  window.document.getElementById(id).dispatchEvent(new window.Event(eventName, { bubbles: true }));
}

function tooltipForLabel(document, labelText) {
  const containers = Array.from(document.querySelectorAll("label, .computed-field-label, th"));
  const label = containers.find((candidate) => {
    const clone = candidate.cloneNode(true);
    clone.querySelectorAll(".tooltip").forEach((tooltip) => tooltip.remove());
    return clone.textContent.replace(/\s+/g, " ").trim().includes(labelText);
  });
  return label?.querySelector(".tooltip-text")?.textContent.replace(/\s+/g, " ").trim() ?? "";
}

const untranslatedFragments = [
  "Total heat to bay",
  "trucks charging",
  "charger cabinets",
  "produces",
  "of heat",
  "Presets replace",
  "Build your fleet",
  "Each truck will charge",
  "Equivalent to",
  "before considering",
  "other bay loads",
  "cabinet heat is included",
  "Cabinet outdoors",
  "charger losses excluded",
  "Power per vehicle",
  "up to veh max",
  "Coincident",
  "diversity",
  "Calculation Method",
  "Populated Equation",
  "Fleet Inventory",
  "Save current scenario",
  "Open Report",
  "Reset to Defaults",
  "Copy shareable URL"
];

function visibleGuiText(document) {
  const hiddenTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const chunks = [];
  const walker = document.createTreeWalker(document.body, document.defaultView.NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (hiddenTags.has(node.parentElement?.tagName)) return document.defaultView.NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest("[hidden], script, style, noscript, template, .formula-box")) {
        return document.defaultView.NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.trim() ? document.defaultView.NodeFilter.FILTER_ACCEPT : document.defaultView.NodeFilter.FILTER_REJECT;
    }
  });
  while (walker.nextNode()) chunks.push(walker.currentNode.nodeValue.trim());
  return chunks.join(" ").replace(/\s+/g, " ");
}

function expectNoUntranslatedFragments(text, context) {
  for (const fragment of untranslatedFragments) {
    expect(text, `${context}: ${fragment}`).not.toContain(fragment);
  }
}

const placeholderTextPattern = /localized text|localised text|Texto localizado|Texte localisé|(^|\s)(TODO|TRANSLATE|TBD|placeholder|untranslated)(\s|$|:)|ローカライズ|翻訳テキスト|プレースホルダー|(^|\s)説明(\s|$|:)|현지화|현지화된 텍스트|번역 텍스트|자리 표시자|(^|\s)설명(\s|$|:)|نص مترجم|نص محلي|عنصر نائب|(^|\s)ترجمة(\s|$|:)|^شرح$|स्थानीयकृत पाठ|अनुवादित पाठ|प्लेसहोल्डर|(^|\s)विवरण(\s|$|:)/i;
const additionalPlaceholderTextPattern = /স্থানীয়কৃত পাঠ|অনুবাদ|প্লেসহোল্ডার|(^|\s)বিবরণ(\s|$|:)|teks lokal|teks terjemahan|(^|\s)(placeholder|deskripsi)(\s|$|:)|مقامی متن|ترجمہ شدہ متن|پلیس ہولڈر|(^|\s)تفصیل(\s|$|:)|локализованный текст|(^|\s)(перевод|заполнитель|описание)(\s|$|:)|testo localizzato|testo tradotto|segnaposto|(^|\s)descrizione(\s|$|:)|văn bản được bản địa hóa|văn bản dịch|trình giữ chỗ|(^|\s)mô tả(\s|$|:)|yerelleştirilmiş metin|çeviri metni|yer tutucu|(^|\s)açıklama(\s|$|:)|ข้อความที่แปลแล้ว|ข้อความท้องถิ่น|ตัวยึดตำแหน่ง|(^|\s)คำอธิบาย(\s|$|:)|متن محلی|متن ترجمه‌شده|جای‌نگهدار|(^|\s)توضیح(\s|$|:)|maandishi yaliyotafsiriwa|maandishi ya ndani|kishika nafasi|(^|\s)maelezo(\s|$|:)|本地化文字|翻譯文字|佔位符|(^|\s)說明(\s|$|:)/i;
const europeanPlaceholderTextPattern = /gelokaliseerde tekst|vertaalde tekst|tijdelijke aanduiding|(^|\s)beschrijving(\s|$|:)|tekst zlokalizowany|przet[łl]umaczony tekst|symbol zast[eę]pczy|(^|\s)opis(\s|$|:)|lokaliserad text|[öo]versatt text|platsh[åa]llare|(^|\s)beskrivning(\s|$|:)|lokaliseret tekst|oversat tekst|pladsholder|lokalisert tekst|oversatt tekst|plassholder|lokalisoitu teksti|k[äa][äa]nnetty teksti|paikkamerkki|(^|\s)kuvaus(\s|$|:)|lokalizovan[ýy] text|p[řr]elo[žz]en[ýy] text|z[áa]stupn[ýy] symbol|(^|\s)popis(\s|$|:)|τοπικοποιημένο κείμενο|μεταφρασμένο κείμενο|σύμβολο κράτησης|(^|\s)περιγραφή(\s|$|:)|טקסט מקומי|טקסט מתורגם|מציין מיקום|(^|\s)תיאור(\s|$|:)|lokaliz[áa]lt sz[öo]veg|leford[íi]tott sz[öo]veg|hely[őo]rz[őo]|(^|\s)le[íi]r[áa]s(\s|$|:)/i;
const additionalLanguageCodes = ["bn", "id", "ur", "ru", "it", "vi", "tr", "th", "fa", "sw", "zh-Hant"];
const newLanguageCodes = ["nl", "pl", "sv", "da", "nb", "fi", "cs", "el", "he", "hu"];
const expectedLanguageOptions = [
  ["en", "🇺🇸 English"],
  ["zh-Hans", "🇨🇳 简体中文"],
  ["es", "🇲🇽 Español"],
  ["fr", "🇫🇷 Français"],
  ["de", "🇩🇪 Deutsch"],
  ["ja", "🇯🇵 日本語"],
  ["ko", "🇰🇷 한국어"],
  ["pt", "🇧🇷 Português"],
  ["ar", "🇪🇬 العربية"],
  ["hi", "🇮🇳 हिन्दी"],
  ["bn", "🇧🇩 বাংলা"],
  ["id", "🇮🇩 Bahasa Indonesia"],
  ["ur", "🇵🇰 اردو"],
  ["ru", "🇷🇺 Русский"],
  ["it", "🇮🇹 Italiano"],
  ["vi", "🇻🇳 Tiếng Việt"],
  ["tr", "🇹🇷 Türkçe"],
  ["th", "🇹🇭 ไทย"],
  ["fa", "🇮🇷 فارسی"],
  ["sw", "🇹🇿 Kiswahili"],
  ["zh-Hant", "🇹🇼 繁體中文"],
  ["nl", "🇳🇱 Nederlands"],
  ["pl", "🇵🇱 Polski"],
  ["sv", "🇸🇪 Svenska"],
  ["da", "🇩🇰 Dansk"],
  ["nb", "🇳🇴 Norsk bokmål"],
  ["fi", "🇫🇮 Suomi"],
  ["cs", "🇨🇿 Čeština"],
  ["el", "🇬🇷 Ελληνικά"],
  ["he", "🇮🇱 עברית"],
  ["hu", "🇭🇺 Magyar"]
];

function expectNoPlaceholderText(text, context) {
  expect(text, context).not.toMatch(placeholderTextPattern);
  expect(text, context).not.toMatch(additionalPlaceholderTextPattern);
  expect(text, context).not.toMatch(europeanPlaceholderTextPattern);
}

describe("normal calculation scenarios", () => {
  let dom;

  beforeEach(() => {
    dom = createApp();
  });

  it("renders zero outputs when no trucks are in inventory", () => {
    const { document } = dom.window;

    for (const id of ["totalKW", "totalBTU", "tons", "wPerSf", "cfm", "perVehKW", "cabKW", "vehKW"]) {
      expect(document.getElementById(id).textContent).toMatch(/^0(?:\.0+)?$/);
    }
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("renders a secure localized Buy Me a Coffee footer link", () => {
    const { document, I18N } = dom.window;
    const link = document.getElementById("buyMeCoffeeLink");

    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("https://buymeacoffee.com/blackrockcity");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toContain("☕");

    for (const [code, dictionary] of Object.entries(I18N)) {
      expect(dictionary).toHaveProperty("buyMeCoffee");
      expect(dictionary.buyMeCoffee, `${code}.buyMeCoffee`).toContain("☕");
      expectNoPlaceholderText(dictionary.buyMeCoffee, `${code}.buyMeCoffee`);
      if (code !== "en") {
        expect(dictionary.buyMeCoffee, `${code}.buyMeCoffee`).not.toBe(I18N.en.buyMeCoffee);
      }
    }

    dom.window.applyLanguage("de");
    expect(link.textContent).toBe(I18N.de.buyMeCoffee);
  });

  it("calculates one Rosenbauer RTX at 150 kW with cabinet in bay", () => {
    addTruck(dom.window);

    expect(dom.window.document.getElementById("totalKW").textContent).toBe("19.50");
    expect(dom.window.document.getElementById("totalBTU").textContent).toBe("66,534");
    expect(dom.window.document.getElementById("tons").textContent).toBe("5.54");
    expect(dom.window.document.getElementById("wPerSf").textContent).toBe("5.91");
    expect(dom.window.document.getElementById("cfm").textContent).toBe("6,161");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("caps requested charge power by each truck maximum", () => {
    const { document } = dom.window;
    document.getElementById("chargePower").value = "250";
    addTruck(dom.window, { name: "Truck A", vehMaxKW: 150 });
    addTruck(dom.window, { name: "Truck B", vehMaxKW: 80 });

    expect(document.getElementById("totalKW").textContent).toBe("29.90");
    expect(document.getElementById("totalBTU").textContent).toBe("102,019");
    expect(document.getElementById("tons").textContent).toBe("8.50");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("accepts a 2,000 kW vehicle maximum and calculates safely", () => {
    const { document } = dom.window;
    document.getElementById("chargePower").value = "2000";
    addTruck(dom.window, { name: "2 MW-capable truck", vehMaxKW: 2000 });

    expect(inventory(dom.window)[0].vehMaxKW).toBe(2000);
    expect(document.getElementById("chargePower").value).toBe("2000");
    expect(document.getElementById("totalKW").textContent).toBe("260.00");
    expect(document.getElementById("totalBTU").textContent).toBe("887,120");
    assertNoUnsafeRenderedOutput(dom.window);
  });
});

describe("UI summary, presets, and report mode", () => {
  it("adds a localized unit selector with language defaults and manual persistence", () => {
    const dom = createApp();
    const { document, localStorage } = dom.window;

    expect(document.getElementById("unitsSelect")).not.toBeNull();
    expect(document.getElementById("unitsSelect").value).toBe("ip");
    expect(Array.from(document.querySelectorAll("#unitsSelect option")).map(option => option.value)).toEqual(["ip", "si"]);
    expect(document.querySelector("label.units-control").textContent).toContain("Units");

    dom.window.applyLanguage("fr");
    expect(document.getElementById("unitsSelect").value).toBe("si");
    expect(document.querySelector("label.units-control").textContent).toContain("Unités");

    document.getElementById("unitsSelect").value = "ip";
    document.getElementById("unitsSelect").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    expect(localStorage.getItem("evHeatCalc.units")).toBe("ip");
    expect(localStorage.getItem("evHeatCalc.unitsManual")).toBe("true");

    dom.window.applyLanguage("de");
    expect(document.getElementById("unitsSelect").value).toBe("ip");
  });

  it("uses unit-specific fresh bay-area defaults", () => {
    const dom = createApp();
    const { document } = dom.window;

    expect(document.getElementById("unitsSelect").value).toBe("ip");
    expect(document.getElementById("baySf").value).toBe("3300");

    dom.window.applyLanguage("fr");
    expect(document.getElementById("unitsSelect").value).toBe("si");
    expect(document.getElementById("baySf").value).toBe("300");

    dom.window.setUnitSystem("ip", { manual: true });
    expect(document.getElementById("baySf").value).toBe("3300");

    dom.window.setUnitSystem("si", { manual: true });
    expect(document.getElementById("baySf").value).toBe("300");
  });

  it("converts edited bay areas without replacing them with unit defaults", () => {
    const dom = createApp();
    const { document } = dom.window;
    const baySf = document.getElementById("baySf");

    baySf.value = "4000";
    baySf.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

    dom.window.setUnitSystem("si", { manual: true });
    expect(Number(baySf.value)).toBeCloseTo(371.6, 1);

    dom.window.setUnitSystem("ip", { manual: true });
    expect(Number(baySf.value)).toBeCloseTo(4000, 0);
  });

  it("resets bay area to the active unit system default", () => {
    const dom = createApp();
    const { document } = dom.window;

    dom.window.setUnitSystem("si", { manual: true });
    document.getElementById("baySf").value = "450";
    document.getElementById("reset").click();
    expect(document.getElementById("baySf").value).toBe("300");

    dom.window.setUnitSystem("ip", { manual: true });
    document.getElementById("baySf").value = "4500";
    document.getElementById("reset").click();
    expect(document.getElementById("baySf").value).toBe("3300");
  });

  it("converts bay area and ventilation delta T without accumulating rounding error", () => {
    const dom = createApp();
    const { document } = dom.window;

    expect(document.getElementById("baySf").value).toBe("3300");
    expect(document.getElementById("deltaT").value).toBe("10");

    document.getElementById("baySf").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    dom.window.setUnitSystem("si", { manual: true });
    expect(Number(document.getElementById("baySf").value)).toBeCloseTo(306.6, 1);
    expect(Number(document.getElementById("deltaT").value)).toBeCloseTo(5.6, 1);

    dom.window.setUnitSystem("ip", { manual: true });
    expect(Number(document.getElementById("baySf").value)).toBeCloseTo(3300, 0);
    expect(Number(document.getElementById("deltaT").value)).toBeCloseTo(10, 1);

    for (let i = 0; i < 6; i += 1) {
      dom.window.setUnitSystem("si", { manual: true });
      dom.window.setUnitSystem("ip", { manual: true });
    }
    expect(Number(document.getElementById("baySf").value)).toBeCloseTo(3300, 0);
    expect(Number(document.getElementById("deltaT").value)).toBeCloseTo(10, 1);
  });

  it("renders SI and I-P units while keeping calculations numerically consistent", () => {
    const dom = createApp();
    addTruck(dom.window);
    const { document } = dom.window;

    document.getElementById("baySf").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    dom.window.setUnitSystem("si", { manual: true });
    expect(document.querySelector("label[for='baySf']")?.textContent || document.querySelector("#baySf").closest("div").querySelector("label").textContent).toContain("m²");
    expect(document.querySelector("#deltaT").closest("div").querySelector("label").textContent).toContain("°C");
    expect(document.querySelector(".headline-values .main").textContent).toBe("19.50 kW");
    expect(document.querySelector(".headline-values .sub").textContent).toBe("66,534 BTU/h");
    expect(document.querySelectorAll(".right-column .card.out .stat .u")[3].textContent).toContain("W/m²");
    expect(document.querySelectorAll(".right-column .card.out .stat .u")[4].textContent).toContain("m³/h");
    expect(document.getElementById("wPerSf").textContent).toBe("63.60");
    expect(document.getElementById("cfm").textContent).toBe("10,467");
    expect(document.getElementById("loadContextNote").textContent).toContain("19.50 kW");

    dom.window.setUnitSystem("ip", { manual: true });
    expect(document.querySelector(".headline-values .main").textContent).toBe("66,534 BTU/h");
    expect(document.querySelector(".headline-values .sub").textContent).toBe("19.50 kW");
    expect(document.querySelectorAll(".right-column .card.out .stat .u")[3].textContent).toContain("W/ft²");
    expect(document.querySelectorAll(".right-column .card.out .stat .u")[4].textContent).toContain("CFM");
    expect(document.getElementById("wPerSf").textContent).toBe("5.91");
    expect(document.getElementById("cfm").textContent).toBe("6,161");
    expect(document.getElementById("totalKW").textContent).toBe("19.50");
    expect(document.getElementById("totalBTU").textContent).toBe("66,534");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("preserves units in URLs, old URLs, saved scenarios, and localized reports", () => {
    const oldUrlDom = createApp("https://example.test/index.html?sf=3300&dt=10");
    expect(oldUrlDom.window.document.getElementById("unitsSelect").value).toBe("ip");
    expect(oldUrlDom.window.document.getElementById("baySf").value).toBe("3300");

    const dom = createApp();
    addTruck(dom.window);
    dom.window.setUnitSystem("si", { manual: true });
    const latestUrl = dom.window.history.replaceState.mock.calls.at(-1)?.[2] || "";
    expect(latestUrl).toContain("units=si");
    const serializedSf = Number(new URL(latestUrl, "https://example.test").searchParams.get("sf"));
    expect(serializedSf).toBeCloseTo(3229.17, 2);

    const saved = dom.window.saveCurrentScenario("Metric display scenario");
    expect(saved.data.units).toBe("si");
    expect(saved.data.sf).toBeCloseTo(3229.17, 2);
    expect(saved.data.deltaT).toBe(10);

    dom.window.setUnitSystem("ip", { manual: true });
    dom.window.applySavedScenario(saved.id);
    expect(Number(dom.window.document.getElementById("baySf").value)).toBeCloseTo(3229, 0);
    dom.window.setUnitSystem("si", { manual: true });
    expect(Number(dom.window.document.getElementById("baySf").value)).toBeCloseTo(300, 1);

    const report = dom.window.generateReportHTML();
    expect(report).toContain("m²");
    expect(report).toContain("m³/h");
    expect(report).toContain("W/m²");
    expect(report).toContain("19.50 kW / 66,534 BTU/h");
    expectNoPlaceholderText(report, "SI report");
  });

  it("updates scenario summary, read-only stats, and load context note", () => {
    const dom = createApp();
    addTruck(dom.window);
    addTruck(dom.window);
    dom.window.toggleCharging(inventory(dom.window)[1].id, false);

    expect(dom.window.document.getElementById("numVehicles").textContent).toBe("2");
    expect(dom.window.document.getElementById("concurrent").textContent).toBe("1");
    expect(dom.window.document.getElementById("numVehicles").classList.contains("computed-value")).toBe(true);
    expect(dom.window.document.getElementById("numVehicles").classList.contains("readonly-metric")).toBe(true);
    expect(dom.window.document.getElementById("concurrent").classList.contains("computed-value")).toBe(true);
    expect(dom.window.document.getElementById("concurrent").classList.contains("readonly-metric")).toBe(true);
    expect(dom.window.document.querySelector(".computed-field-grid")).not.toBeNull();
    expect(dom.window.document.body.textContent).not.toContain("Calculated from inventory");
    expect(dom.window.document.body.textContent).not.toContain("Calculated from checkboxes");
    expect(dom.window.document.getElementById("scenarioSummary").textContent).toContain("1 of 2 trucks charging at 150 kW");
    expect(dom.window.document.getElementById("scenarioSummary").textContent).toContain("19.50 kW / 66,534 BTU/h");
    expect(dom.window.document.getElementById("loadContextNote").textContent).toContain("Equivalent to 5.54 tons");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("keeps compact computed counts live when trucks are added, toggled, and removed", () => {
    const dom = createApp();
    addTruck(dom.window);
    addTruck(dom.window);
    addTruck(dom.window);

    expect(dom.window.document.getElementById("numVehicles").textContent).toBe("3");
    expect(dom.window.document.getElementById("concurrent").textContent).toBe("3");

    dom.window.toggleCharging(inventory(dom.window)[0].id, false);
    expect(dom.window.document.getElementById("numVehicles").textContent).toBe("3");
    expect(dom.window.document.getElementById("concurrent").textContent).toBe("2");

    dom.window.removeTruckFromInventory(inventory(dom.window)[1].id);
    expect(dom.window.document.getElementById("numVehicles").textContent).toBe("2");
    expect(dom.window.document.getElementById("concurrent").textContent).toBe("1");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("renders clearer inventory table state", () => {
    const dom = createApp();
    addTruck(dom.window);
    addTruck(dom.window);
    dom.window.toggleCharging(inventory(dom.window)[1].id, false);

    expect(dom.window.document.querySelector("#chargingNowHeader").textContent).toContain("Charging now");
    expect(dom.window.document.querySelector("#chargingNowHeader .tooltip-text").textContent).toContain("simultaneous charging heat load");
    const rows = dom.window.document.querySelectorAll("#inventoryBody tr");
    expect(rows[0].classList.contains("charging-active")).toBe(true);
    expect(rows[1].classList.contains("charging-inactive")).toBe(true);
    expect(dom.window.document.querySelector("#inventoryBody input[data-field='packKWh']").classList.contains("numeric-cell")).toBe(true);
    expect(dom.window.document.querySelector("#inventoryBody input[data-field='vehMaxKW']").classList.contains("numeric-cell")).toBe(true);
  });

  it("applies built-in presets with validated scenario data", () => {
    const dom = createApp();

    dom.window.applyScenarioPreset("mixed-all-charging");
    const trucks = inventory(dom.window);

    expect(trucks).toHaveLength(3);
    expect(trucks.filter((truck) => truck.charging)).toHaveLength(3);
    expect(dom.window.document.getElementById("baySf").value).toBe("5000");
    expect(dom.window.document.getElementById("chargePower").value).toBe("150");
    expect(dom.window.document.getElementById("cabinetLocation").value).toBe("in");
    expect(dom.window.document.getElementById("scenarioSummary").textContent).toContain("3 of 3 trucks charging");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("saves, loads, caps, deletes, and sanitizes local scenarios", () => {
    const dom = createApp();
    dom.window.localStorage.clear();
    addTruck(dom.window, { name: "<script>bad()</script>" });

    dom.window.saveCurrentScenario("<img src=x onerror=alert(1)>Scenario");
    let saved = dom.window.getSavedScenarios();
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("<img src=x onerror=alert(1)>Scenario");
    expect(saved[0].data.inventory[0].name).toBe("<script>bad()</script>");

    for (let i = 0; i < 25; i += 1) {
      dom.window.saveCurrentScenario(`Saved ${i}`);
    }
    saved = dom.window.getSavedScenarios();
    expect(saved).toHaveLength(20);
    expect(saved[0].name).toBe("Saved 24");

    dom.window.applySavedScenario(saved[0].id);
    expect(inventory(dom.window)).toHaveLength(1);
    dom.window.deleteSavedScenario(saved[0].id);
    expect(dom.window.getSavedScenarios()).toHaveLength(19);
    expect(dom.window.document.querySelector("#scenarioSelect optgroup[label='Saved scenarios']")).not.toBeNull();
  });

  it("splits scenario apply and save controls into separate cards", () => {
    const dom = createApp();
    const presetCard = dom.window.document.getElementById("scenarioApplyCard");
    const saveCard = dom.window.document.getElementById("scenarioSaveCard");

    expect(presetCard).not.toBeNull();
    expect(saveCard).not.toBeNull();
    expect(presetCard.querySelector("#scenarioSelect")).not.toBeNull();
    expect(presetCard.querySelector("#applyScenario")).not.toBeNull();
    expect(presetCard.querySelector("#deleteScenario")).not.toBeNull();
    expect(saveCard.querySelector("#scenarioName")).not.toBeNull();
    expect(saveCard.querySelector("#saveScenario")).not.toBeNull();
    expect(dom.window.document.getElementById("scenarioName").placeholder).toBe("Name this scenario…");
    expect(dom.window.document.getElementById("deleteScenario").title).toBe("Delete the currently selected saved scenario.");
    expect(dom.window.document.getElementById("deleteScenario").textContent.trim()).toBe("🗑️");
    expect(dom.window.document.querySelector(".scenario-apply-row").classList.contains("scenario-control-row")).toBe(true);
    expect(dom.window.document.querySelector(".scenario-save-row").classList.contains("scenario-control-row")).toBe(true);
  });

  it("disables built-in preset deletion and confirms saved scenario deletion", () => {
    const dom = createApp();
    dom.window.localStorage.clear();
    dom.window.confirm = vi.fn(() => false);

    expect(dom.window.document.getElementById("deleteScenario").disabled).toBe(true);
    dom.window.saveCurrentScenario("Delete me");
    const saved = dom.window.getSavedScenarios()[0];
    dom.window.document.getElementById("scenarioSelect").value = `saved:${saved.id}`;
    dom.window.updateScenarioDeleteState();
    expect(dom.window.document.getElementById("deleteScenario").disabled).toBe(false);

    dom.window.deleteSelectedScenario();
    expect(dom.window.confirm).toHaveBeenCalledWith("Delete this saved scenario? This cannot be undone.");
    expect(dom.window.getSavedScenarios()).toHaveLength(1);

    dom.window.confirm = vi.fn(() => true);
    dom.window.deleteSelectedScenario();
    expect(dom.window.getSavedScenarios()).toHaveLength(0);
    expect(dom.window.document.getElementById("scenarioSelect").value.startsWith("preset:")).toBe(true);
    expect(dom.window.document.getElementById("deleteScenario").disabled).toBe(true);
  });

  it("replaces PDF export with safe HTML report generation", () => {
    const dom = createApp();
    addTruck(dom.window, { name: "<script>window.__reportXss=true</script>" });

    expect(dom.window.document.getElementById("exportPDF")).toBeNull();
    expect(dom.window.document.getElementById("openReport").textContent).toBe("Open Report");
    const html = dom.window.generateReportHTML();

    expect(html).toContain("Scenario Report");
    expect(html).toContain("Print / Save as PDF");
    expect(html).toContain("Close report");
    expect(html).toContain("Fleet Inventory");
    expect(html).toContain("Calculation Method");
    expect(html).toContain("Populated Equation");
    expect(html).toContain("Equivalent to");
    expect(html).toContain("&lt;script&gt;window.__reportXss=true&lt;/script&gt;");
    expect(html).not.toContain("<script>window.__reportXss=true</script>");
  });

  it("localizes static controls, attributes, presets, dynamic copy, and report labels", () => {
    const dom = createApp();
    const expectedCodes = expectedLanguageOptions.map(([code]) => code);

    expect(dom.window.I18N.en.appTitle).toBe("EV Fire Apparatus Charging Heat Calculator");
    expect(dom.window.document.getElementById("languageSelect").value).toBe("en");
    expect(dom.window.document.querySelector("[data-i18n='appTitle']").textContent).toContain("EV Fire Apparatus");
    const options = Array.from(dom.window.document.querySelectorAll("#languageSelect option")).map(option => [option.value, option.textContent]);
    expect(options).toEqual(expectedLanguageOptions);
    for (const code of expectedCodes) {
      expect(Object.keys(dom.window.I18N[code]).sort()).toEqual(Object.keys(dom.window.I18N.en).sort());
      for (const [key, value] of Object.entries(dom.window.I18N[code])) {
        expect(value, `${code}.${key}`).not.toBe("");
        expect(value, `${code}.${key}`).not.toBeUndefined();
        expect(value, `${code}.${key}`).not.toBeNull();
        expectNoPlaceholderText(String(value), `${code}.${key}`);
      }
    }

    dom.window.applyLanguage("de");
    expect(dom.window.document.querySelector("[data-i18n='appTitle']").textContent).toBe(dom.window.I18N.de.appTitle);
    expect(dom.window.document.querySelector(".pill").textContent).toBe(dom.window.I18N.de.unitPillSi);
    expect(dom.window.document.getElementById("applyScenario").textContent).toBe("Anwenden");
    expect(dom.window.document.getElementById("saveScenario").textContent).toBe("Aktuelles Szenario speichern");
    expect(dom.window.document.getElementById("reset").textContent).toBe("Standardwerte zurücksetzen");
    expect(dom.window.document.getElementById("share").textContent).toBe("Teilbare URL kopieren");
    expect(dom.window.document.getElementById("openReport").textContent).toBe("Bericht öffnen");
    expect(dom.window.document.getElementById("scenarioName").placeholder).toBe("Dieses Szenario benennen…");
    expect(dom.window.document.getElementById("deleteScenario").getAttribute("aria-label")).toBe("Das aktuell gewählte gespeicherte Szenario löschen.");
    expect(dom.window.document.querySelector("#chargeType option[value='L3']").textContent).toBe("Level 3 (DC-Schnellladen)");
    expect(dom.window.document.querySelector("#scenarioSelect optgroup").label).toBe("Beispielvorgaben");
    expect(dom.window.document.querySelector(".right-column .card.out h2").textContent).toBe("Ergebnisse");
    expect(dom.window.document.querySelector(".computed-field:first-child .computed-field-label").textContent).toContain("Fahrzeuge gesamt");
    expect(dom.window.document.querySelector(".computed-field:first-child .tooltip-text").textContent).toContain("Flotteninventar");
    expect(dom.window.document.getElementById("scenarioSummary").textContent).toContain("Fahrzeugen");

    addTruck(dom.window, { name: "User Saved Name" });
    dom.window.saveCurrentScenario("My untranslated scenario");
    dom.window.applyLanguage("es");
    expect(dom.window.document.querySelector("#scenarioSelect option[value^='saved:']").textContent).toBe("My untranslated scenario");
    expect(dom.window.document.getElementById("applyScenario").textContent).toBe("Aplicar");
    expect(dom.window.document.getElementById("saveScenario").textContent).toBe("Guardar escenario actual");

    dom.window.applyLanguage("ar");
    expect(dom.window.document.documentElement.dir).toBe("rtl");
    expect(dom.window.document.querySelector(".formula-math").style.direction || dom.window.getComputedStyle(dom.window.document.querySelector(".formula-math")).direction).toBe("ltr");
    expect(dom.window.document.getElementById("populatedEquation").style.direction || dom.window.getComputedStyle(dom.window.document.getElementById("populatedEquation")).direction).toBe("ltr");

    const arabicReport = dom.window.generateReportHTML();
    expect(arabicReport).toContain('lang="ar" dir="rtl"');
    expect(arabicReport).toContain('dir="ltr"');
    expect(arabicReport).toContain("تقرير السيناريو");

    dom.window.applyLanguage("de");
    const germanReport = dom.window.generateReportHTML();
    expect(germanReport).toContain("Szenariobericht");
    expect(germanReport).toContain("Drucken / Als PDF speichern");
    expect(germanReport).toContain("Bericht schließen");
    expect(germanReport).toContain("Flotteninventar");
    expect(germanReport).not.toContain("Scenario summary");
  });

  it("does not leave known English GUI fragments visible in non-English languages", () => {
    const dom = createApp();
    addTruck(dom.window);
    const languages = ["zh-Hans", "es", "fr", "de", "ja", "ko", "pt", "ar", "hi"];

    for (const lang of languages) {
      dom.window.applyLanguage(lang);
      expectNoUntranslatedFragments(visibleGuiText(dom.window.document), `visible GUI ${lang}`);
    }
  });

  it("uses BTU/h as English headline primary and kW as non-English headline primary", () => {
    const dom = createApp();
    addTruck(dom.window);

    dom.window.applyLanguage("en");
    expect(dom.window.document.querySelector(".headline-values .main").textContent).toMatch(/BTU\/h$/);
    expect(dom.window.document.querySelector(".headline-values .sub").textContent).toMatch(/kW$/);
    expect(dom.window.generateReportHTML()).toContain("66,534 BTU/h / 19.50 kW");

    for (const lang of ["zh-Hans", "es", "fr", "de", "ja", "ko", "pt", "ar", "hi"]) {
      dom.window.applyLanguage(lang);
      expect(dom.window.document.querySelector(".headline-values .main").textContent, lang).toMatch(/kW$/);
      expect(dom.window.document.querySelector(".headline-values .sub").textContent, lang).toMatch(/BTU\/h$/);
      expect(dom.window.generateReportHTML(), lang).toContain("19.50 kW / 66,534 BTU/h");
    }
  });

  it("fully localizes French GUI and report templates", () => {
    const dom = createApp();
    addTruck(dom.window);
    dom.window.applyLanguage("fr");

    expect(dom.window.document.querySelector(".headline-result .kicker").textContent).toBe("Chaleur totale vers la baie");
    expect(dom.window.document.getElementById("scenarioSummary").textContent).toContain("véhicules en charge");
    expect(dom.window.document.getElementById("scenarioSummary").textContent).not.toContain("trucks charging");
    expect(dom.window.document.getElementById("loadContextNote").textContent).toContain("Équivalent à");
    expect(dom.window.document.getElementById("scenarioApplyCard").textContent).not.toContain("Presets replace");
    expect(dom.window.document.querySelector(".left-column section:nth-of-type(4) > p.muted").textContent).toContain("Construisez votre flotte");
    expect(dom.window.document.getElementById("cabNote").textContent).toContain("chaleur de l’armoire");
    expect(dom.window.document.getElementById("reset").textContent).toBe("Réinitialiser");
    expect(dom.window.document.getElementById("openReport").textContent).toBe("Ouvrir le rapport");
    expectNoUntranslatedFragments(visibleGuiText(dom.window.document), "visible GUI fr");

    const report = dom.window.generateReportHTML();
    expect(report).toContain("Rapport de scénario");
    expect(report).toContain("Imprimer / Enregistrer en PDF");
    expect(report).toContain("Résultats principaux");
    expect(report).toContain("Hypothèses d’entrée");
    expect(report).not.toContain("Total heat to bay");
    expect(report).not.toContain("Headline Results");
    expect(report).not.toContain("Input Assumptions");
    expect(report).not.toContain("Fleet Inventory");
    expect(report).not.toContain("Print / Save as PDF");
    expectNoUntranslatedFragments(report, "report fr");
  });

  it("uses meaningful Japanese, Korean, Arabic, and Hindi strings in rendered UI and reports", () => {
    const dom = createApp();
    addTruck(dom.window);
    const expected = {
      ja: ["シナリオレポート", "主要結果", "入力条件", "内訳"],
      ko: ["시나리오 보고서", "주요 결과", "입력 가정", "분석"],
      ar: ["تقرير السيناريو", "النتائج الرئيسية", "افتراضات الإدخال", "التفصيل"],
      hi: ["परिदृश्य रिपोर्ट", "मुख्य परिणाम", "इनपुट मान्यताएँ", "ऊष्मा विभाजन"]
    };

    for (const [lang, labels] of Object.entries(expected)) {
      dom.window.applyLanguage(lang);
      const visibleText = visibleGuiText(dom.window.document);
      expectNoPlaceholderText(visibleText, `visible GUI ${lang}`);
      expect(dom.window.document.querySelector(".headline-values .main").textContent, lang).toMatch(/kW$/);

      const report = dom.window.generateReportHTML();
      expectNoPlaceholderText(report, `report ${lang}`);
      for (const label of labels) {
        expect(report, `${lang}: ${label}`).toContain(label);
      }
    }
  });

  it("fully localizes all 11 additional languages with SI defaults and RTL where required", () => {
    const dom = createApp();
    addTruck(dom.window);
    const { document, I18N } = dom.window;
    const english = I18N.en;

    for (const lang of additionalLanguageCodes) {
      dom.window.localStorage.removeItem("evHeatCalc.units");
      dom.window.localStorage.removeItem("evHeatCalc.unitsManual");
      dom.window.unitsManual = false;
      dom.window.applyLanguage(lang);

      expect(Object.keys(I18N[lang]).sort(), lang).toEqual(Object.keys(english).sort());
      for (const [key, value] of Object.entries(I18N[lang])) {
        expect(value, `${lang}.${key}`).not.toBe("");
        expect(value, `${lang}.${key}`).not.toBeNull();
        expect(value, `${lang}.${key}`).not.toBeUndefined();
        expectNoPlaceholderText(String(value), `${lang}.${key}`);
      }

      expect(document.getElementById("languageSelect").value, lang).toBe(lang);
      expect(document.getElementById("unitsSelect").value, lang).toBe("si");
      expect(document.querySelector("[data-i18n='appTitle']").textContent, lang).toBe(I18N[lang].appTitle);
      expect(document.querySelector("[data-i18n='appTitle']").textContent, lang).not.toBe(english.appTitle);
      expect(document.querySelector(".left-column > section.card:first-of-type h2").textContent, lang).toBe(I18N[lang].scenarioTitle);
      expect(document.querySelector(".right-column .card.out h2").textContent, lang).toBe(I18N[lang].resultsTitle);
      expect(document.querySelector(".left-column section:nth-of-type(4) h2").textContent, lang).toBe(I18N[lang].fleetTitle);
      expect(document.getElementById("scenarioName").placeholder, lang).toBe(I18N[lang].saveNamePlaceholder);
      expect(document.querySelector(".computed-field:first-child .tooltip-text").textContent, lang).toBe(I18N[lang].vehiclesTotalTooltip);
      expect(document.querySelector(".headline-values .main").textContent, lang).toMatch(/kW$/);
      expectNoPlaceholderText(visibleGuiText(document), `visible GUI ${lang}`);

      const expectedDirection = ["ur", "fa"].includes(lang) ? "rtl" : "ltr";
      expect(document.documentElement.dir, lang).toBe(expectedDirection);
      expect(document.getElementById("populatedEquation").style.direction || dom.window.getComputedStyle(document.getElementById("populatedEquation")).direction, lang).toBe("ltr");

      const report = dom.window.generateReportHTML();
      expect(report, lang).toContain(I18N[lang].reportSubtitle);
      expect(report, lang).toContain(I18N[lang].printReport);
      expect(report, lang).toContain(I18N[lang].reportHeadlineResults);
      expect(report, lang).toContain("m²");
      expectNoPlaceholderText(report, `report ${lang}`);
      if (["ur", "fa"].includes(lang)) {
        expect(report, lang).toContain(`lang="${lang}" dir="rtl"`);
        expect(report, lang).toContain('class="formula-ltr" dir="ltr"');
      }
    }
  });

  it("fully localizes the 10 European and Middle Eastern additions", () => {
    const dom = createApp();
    addTruck(dom.window);
    const { document, I18N } = dom.window;

    for (const lang of newLanguageCodes) {
      dom.window.localStorage.removeItem("evHeatCalc.units");
      dom.window.localStorage.removeItem("evHeatCalc.unitsManual");
      dom.window.unitsManual = false;
      dom.window.applyLanguage(lang);

      expect(Object.keys(I18N[lang]).sort(), lang).toEqual(Object.keys(I18N.en).sort());
      for (const [key, value] of Object.entries(I18N[lang])) {
        expect(value, `${lang}.${key}`).not.toBe("");
        expect(value, `${lang}.${key}`).not.toBeNull();
        expect(value, `${lang}.${key}`).not.toBeUndefined();
        expectNoPlaceholderText(String(value), `${lang}.${key}`);
      }

      expect(document.getElementById("unitsSelect").value, lang).toBe("si");
      expect(document.querySelector("[data-i18n='appTitle']").textContent, lang).toBe(I18N[lang].appTitle);
      expect(document.querySelector(".left-column > section.card:first-of-type h2").textContent, lang).toBe(I18N[lang].scenarioTitle);
      expect(document.querySelector(".right-column .card.out h2").textContent, lang).toBe(I18N[lang].resultsTitle);
      expect(document.querySelector(".left-column section:nth-of-type(4) h2").textContent, lang).toBe(I18N[lang].fleetTitle);
      expect(document.getElementById("scenarioName").placeholder, lang).toBe(I18N[lang].saveNamePlaceholder);
      expect(document.querySelector(".computed-field:first-child .tooltip-text").textContent, lang).toBe(I18N[lang].vehiclesTotalTooltip);
      expect(document.getElementById("reset").textContent, lang).toBe(I18N[lang].resetDefaults);
      expect(document.getElementById("buyMeCoffeeLink").textContent, lang).toBe(I18N[lang].buyMeCoffee);
      expect(document.querySelector(".headline-values .main").textContent, lang).toMatch(/kW$/);
      expectNoPlaceholderText(visibleGuiText(document), `visible GUI ${lang}`);

      const expectedDirection = lang === "he" ? "rtl" : "ltr";
      expect(document.documentElement.dir, lang).toBe(expectedDirection);
      expect(document.getElementById("populatedEquation").style.direction || dom.window.getComputedStyle(document.getElementById("populatedEquation")).direction, lang).toBe("ltr");
    }

    for (const lang of ["nl", "pl", "el", "he", "hu"]) {
      dom.window.applyLanguage(lang);
      const report = dom.window.generateReportHTML();
      expect(report, lang).toContain(I18N[lang].reportSubtitle);
      expect(report, lang).toContain(I18N[lang].printReport);
      expect(report, lang).toContain(I18N[lang].reportHeadlineResults);
      expect(report, lang).toContain("m²");
      expectNoPlaceholderText(report, `report ${lang}`);
      if (lang === "he") {
        expect(report).toContain('lang="he" dir="rtl"');
        expect(report).toContain('class="formula-ltr" dir="ltr"');
      }
    }
  });
});

describe("numeric field bounds", () => {
  it("clamps or defaults abusive scalar inputs without unsafe output", () => {
    for (const [fieldId, bounds] of Object.entries(numericFields)) {
      for (const value of abusiveValues) {
        const dom = createApp();
        addTruck(dom.window);
        const input = dom.window.document.getElementById(fieldId);
        input.value = value;
        input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

        const actual = Number(input.value);
        expect(Number.isFinite(actual), `${fieldId}=${value}`).toBe(true);
        expect(actual, `${fieldId}=${value}`).toBeGreaterThanOrEqual(bounds.min);
        expect(actual, `${fieldId}=${value}`).toBeLessThanOrEqual(bounds.max);
        assertNoUnsafeRenderedOutput(dom.window);
      }
    }
  });

  it("normalizes editable truck numeric fields", () => {
    const dom = createApp();
    addTruck(dom.window);

    const bounds = {
      packKWh: { min: 0, max: 2_000 },
      vehMaxKW: { min: 0, max: 2_000 }
    };
    for (const property of ["packKWh", "vehMaxKW"]) {
      for (const value of abusiveValues) {
        dom.window.updateTruckProperty(inventory(dom.window)[0].id, property, value);
        const truck = inventory(dom.window)[0];
        expect(Number.isFinite(truck[property]), `${property}=${value}`).toBe(true);
        expect(truck[property], `${property}=${value}`).toBeGreaterThanOrEqual(bounds[property].min);
        expect(truck[property], `${property}=${value}`).toBeLessThanOrEqual(bounds[property].max);
      }
    }
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("allows 2,000 kW Level 3 requested charge power and clamps above it", () => {
    const dom = createApp();
    addTruck(dom.window, { vehMaxKW: 2000 });
    const input = dom.window.document.getElementById("chargePower");

    input.value = "2000";
    dispatch(dom.window, "chargePower", "change");
    expect(input.value).toBe("2000");
    expect(dom.window.document.getElementById("totalKW").textContent).toBe("260.00");

    input.value = "999999";
    dispatch(dom.window, "chargePower", "change");
    expect(input.value).toBe("2000");
    expect(dom.window.document.getElementById("warningBox").textContent).toMatch(/clamped/i);
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("still caps requested charge power to 19.2 kW for Level 2", () => {
    const dom = createApp();
    addTruck(dom.window, { vehMaxKW: 2000 });
    dom.window.document.getElementById("chargePower").value = "2000";
    dispatch(dom.window, "chargePower", "change");
    dom.window.document.getElementById("chargeType").value = "L2";
    dispatch(dom.window, "chargeType", "change");

    expect(dom.window.document.getElementById("chargePower").value).toBe("19.2");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("clears transient clamp warnings after invalid values are replaced with valid values", () => {
    const dom = createApp();
    addTruck(dom.window);
    const baySf = dom.window.document.getElementById("baySf");

    baySf.value = "999999999999999999999999";
    dispatch(dom.window, "baySf", "change");
    expect(dom.window.document.getElementById("warningBox").textContent).toMatch(/clamped/i);

    baySf.value = "3300";
    dispatch(dom.window, "baySf", "change");
    expect(dom.window.document.getElementById("warningBox").classList.contains("show")).toBe(false);
    expect(dom.window.document.getElementById("warningBox").textContent).toBe("");
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("normalizes efficiency fields predictably", () => {
    const dom = createApp();
    addTruck(dom.window);
    const cases = [
      ["etaCharger", "70", "80"],
      ["etaVehicle", "70", "80"],
      ["etaCharger", "1000", "99.9"],
      ["etaVehicle", "1000", "99.9"],
      ["etaCharger", "92", "92"],
      ["etaVehicle", "92", "92"]
    ];

    for (const [id, value, expected] of cases) {
      const input = dom.window.document.getElementById(id);
      input.value = value;
      dispatch(dom.window, id, "change");
      expect(input.value, `${id}=${value}`).toBe(expected);
      assertNoUnsafeRenderedOutput(dom.window);
    }

    for (const id of ["etaCharger", "etaVehicle"]) {
      const input = dom.window.document.getElementById(id);
      input.value = "";
      dispatch(dom.window, id, "input");
      assertNoUnsafeRenderedOutput(dom.window);
    }
  });

  it("uses a compact trashcan remove control", () => {
    const dom = createApp();
    addTruck(dom.window);
    const button = dom.window.document.querySelector("#inventoryBody .btn-icon");

    expect(button).not.toBeNull();
    expect(button.textContent.trim()).toBe("🗑️");
    expect(button.getAttribute("aria-label")).toBe("Remove truck");
    expect(button.title).toBe("Remove truck");
  });
});

describe("help tooltips", () => {
  it("adds help text for scenario fields and includes relevant limits", () => {
    const dom = createApp();
    const { document } = dom.window;
    const expected = [
      ["Vehicles total", ["Fleet Inventory", "greyed out", "100 trucks"]],
      ["Simultaneous charging vehicles", ["Charging?", "greyed out", "100 trucks"]],
      ["Charging type", ["Level 2", "19.2 kW", "Level 3", "2,000 kW"]],
      ["Per-vehicle charge power", ["Requested charging power", "Max Charge", "0–2,000 kW", "19.2 kW"]],
      ["Diversity factor", ["coincident peak load", "1.0", "0–1"]],
      ["Charger cabinet location", ["charger cabinet losses", "In bay", "Outdoor / Elec. room"]],
      ["Charger efficiency", ["charger loss heat", "In bay", "80–99.9%"]],
      ["Vehicle charging efficiency", ["vehicle-side heat", "BTMS exhaust to room", "80–99.9%"]],
      ["BTMS exhaust to room", ["vehicle-side heat", "0%", "100%", "0–100%"]],
      ["Ventilation ΔT", ["CFM", "1.08 × ΔT", "1–100°F"]],
      ["Safety factor", ["design headroom", "0–100%"]]
    ];

    for (const [label, snippets] of expected) {
      const text = tooltipForLabel(document, label);
      expect(text, label).not.toBe("");
      for (const snippet of snippets) {
        expect(text, `${label}: ${snippet}`).toContain(snippet);
      }
    }
  });

  it("makes help tags accessible by title, aria-label, and keyboard focus", () => {
    const dom = createApp();
    const helpTags = Array.from(dom.window.document.querySelectorAll(".tooltip"));

    expect(helpTags.length).toBeGreaterThanOrEqual(12);
    for (const tag of helpTags) {
      expect(tag.getAttribute("tabindex")).toBe("0");
      expect(tag.getAttribute("aria-label")).toBe(tag.querySelector(".tooltip-text").textContent.trim());
      expect(tag.getAttribute("title")).toBe(tag.querySelector(".tooltip-text").textContent.trim());
    }
  });
});

describe("inventory abuse and URL attack surface", () => {
  it("limits manual inventory additions to a hard maximum", () => {
    const dom = createApp();
    for (let i = 0; i < 250; i += 1) {
      dom.window.addTruckToInventory();
    }

    expect(inventory(dom.window)).toHaveLength(100);
    expect(dom.window.document.getElementById("warningBox").textContent).toMatch(/limited to 100 trucks/i);
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it.each([100, 1_000, 10_000, 100_000])("limits URL inventory with %i trucks", (count) => {
    const inv = Array.from({ length: count }, (_, i) => ({
      id: i % 3,
      name: `<script>window.injected=${i}</script>`,
      packKWh: i % 2 ? -100 : "1e309",
      vehMaxKW: i % 2 ? 150 : 999999999999,
      charging: true,
      extra: { ignored: true }
    }));
    const dom = createApp(`https://example.test/index.html?inv=${encodeURIComponent(JSON.stringify(inv))}`);

    expect(inventory(dom.window)).toHaveLength(100);
    expect(dom.window.injected).toBeUndefined();
    expect(dom.window.document.querySelector("#inventoryBody script")).toBeNull();
    assertNoUnsafeRenderedOutput(dom.window);
  });

  it("ignores malformed and absurdly long URL data safely", () => {
    const malformed = createApp("https://example.test/index.html?sf=1e309&p=Infinity&df=NaN&inv=%7Bbad");
    expect(inventory(malformed.window)).toHaveLength(0);
    expect(malformed.window.document.getElementById("warningBox").textContent).toMatch(/invalid shared URL data/i);
    assertNoUnsafeRenderedOutput(malformed.window);

    const huge = createApp(`https://example.test/index.html?inv=${"x".repeat(60_000)}`);
    expect(inventory(huge.window)).toHaveLength(0);
    expect(huge.window.document.getElementById("warningBox").textContent).toMatch(/invalid shared URL data/i);
    assertNoUnsafeRenderedOutput(huge.window);
  });

  it("normalizes hostile truck shapes and duplicate IDs", () => {
    const inv = [
      null,
      42,
      "bad",
      { id: "__proto__", name: { bad: true }, packKWh: ["100"], vehMaxKW: { value: 150 }, charging: "yes" },
      { id: "same", name: "One", packKWh: -1, vehMaxKW: -2, charging: true },
      { id: "same", name: "Two", packKWh: 999999999999999999999999, vehMaxKW: "1e309", charging: true }
    ];
    const dom = createApp(`https://example.test/index.html?inv=${encodeURIComponent(JSON.stringify(inv))}`);
    const trucks = inventory(dom.window);

    expect(trucks).toHaveLength(3);
    expect(new Set(trucks.map((truck) => truck.id)).size).toBe(trucks.length);
    for (const truck of trucks) {
      expect(typeof truck.name).toBe("string");
      expect(Number.isFinite(truck.packKWh)).toBe(true);
      expect(Number.isFinite(truck.vehMaxKW)).toBe(true);
    }

    dom.window.removeTruckFromInventory(trucks[0].id);
    dom.window.toggleCharging(trucks[1].id, false);
    dom.window.updateTruckProperty(trucks[1].id, "name", "<img src=x onerror=alert(1)>");
    expect(dom.window.document.querySelector("#inventoryBody img")).toBeNull();
    assertNoUnsafeRenderedOutput(dom.window);
  });
});

describe("report mode safety", () => {
  it("opens a generated HTML report without using the old PDF path", () => {
    const dom = createApp();
    addTruck(dom.window);
    const written = [];
    dom.window.open = vi.fn(() => ({
      document: {
        open: vi.fn(),
        write: vi.fn((html) => written.push(html)),
        close: vi.fn()
      }
    }));

    expect(() => dom.window.openReport()).not.toThrow();
    expect(dom.window.open).toHaveBeenCalled();
    expect(written[0]).toContain("Scenario Report");
    expect(written[0]).toContain("Print / Save as PDF");
  });
});
