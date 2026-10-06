var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/scraper.js
var scraper_exports = {};
__export(scraper_exports, {
  runScraper: () => runScraper
});
module.exports = __toCommonJS(scraper_exports);
var import_node_path = __toESM(require("node:path"), 1);
var import_promises2 = require("node:fs/promises");

// src/browser.js
var import_node_fs = __toESM(require("node:fs"), 1);
var import_puppeteer_extra = __toESM(require("puppeteer-extra"), 1);
var import_puppeteer_extra_plugin_stealth = __toESM(require("puppeteer-extra-plugin-stealth"), 1);

// src/utils.js
var import_promises = __toESM(require("node:fs/promises"), 1);
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
async function humanDelay(minMs, maxMs) {
  const ms = randomInt(minMs, maxMs);
  await sleep(ms);
}
function normalizeWhitespace(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
async function retry(fn, retries = 3, baseDelayMs = 1e3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        break;
      }
      const waitMs = baseDelayMs * 2 ** (attempt - 1) + randomInt(200, 1200);
      console.warn(`Retry ${attempt}/${retries} failed. Waiting ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}
function toCsv(rows) {
  if (!rows.length) {
    return "";
  }
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, /* @__PURE__ */ new Set())
  );
  const escapeCsv = (value) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    const line = headers.map((header) => escapeCsv(row[header])).join(",");
    lines.push(line);
  }
  return `${lines.join("\n")}
`;
}
async function writeJson(filePath, data) {
  await import_promises.default.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
async function writeCsv(filePath, rows) {
  const csv = toCsv(rows);
  await import_promises.default.writeFile(filePath, "\uFEFF" + csv, "utf8");
}

// src/browser.js
import_puppeteer_extra.default.use((0, import_puppeteer_extra_plugin_stealth.default)());
var CHROME_PATHS = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ]
};
function findSystemChrome() {
  const candidates = CHROME_PATHS[process.platform] ?? [];
  return candidates.find((p) => import_node_fs.default.existsSync(p)) ?? null;
}
async function launchBrowser({ headless = false, proxyUrl } = {}) {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1440,900"
  ];
  if (proxyUrl) {
    args.push(`--proxy-server=${proxyUrl}`);
  }
  const launchOptions = {
    headless,
    args,
    defaultViewport: {
      width: randomInt(1280, 1600),
      height: randomInt(800, 1e3),
      deviceScaleFactor: 1
    }
  };
  const systemChrome = findSystemChrome();
  if (systemChrome) {
    launchOptions.executablePath = systemChrome;
  }
  return import_puppeteer_extra.default.launch(launchOptions);
}
async function preparePage(page) {
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9,mn-MN;q=0.8,mn;q=0.7"
  });
}
async function simulateHumanBehavior(page) {
  await page.bringToFront();
  const moveCount = randomInt(3, 8);
  for (let i = 0; i < moveCount; i += 1) {
    await page.mouse.move(randomInt(50, 1200), randomInt(50, 700), {
      steps: randomInt(8, 20)
    });
  }
  const scrollSteps = randomInt(2, 5);
  for (let i = 0; i < scrollSteps; i += 1) {
    const delta = Math.round(randomBetween(200, 700));
    await page.mouse.wheel({ deltaY: delta });
    await new Promise((resolve) => setTimeout(resolve, randomInt(300, 1e3)));
  }
}
async function waitForCloudflareChallenge(page, timeoutMs = 45e3, contextLabel = "page") {
  const start = Date.now();
  let tick = 0;
  while (Date.now() - start < timeoutMs) {
    tick += 1;
    const state = await page.evaluate(() => {
      const title = document.title?.toLowerCase() ?? "";
      const text = document.body?.innerText?.toLowerCase() ?? "";
      const html = document.documentElement?.outerHTML?.toLowerCase() ?? "";
      const challengeDetected = title.includes("just a moment") || text.includes("just a moment") || text.includes("checking your browser") || text.includes("verify you are human") || html.includes("challenge-platform") || html.includes("cf-chl-") || html.includes("/cdn-cgi/challenge-platform");
      const pageLooksReady = document.querySelectorAll('a[href*="/adv/"]').length > 0 || Boolean(document.querySelector("h1"));
      return { challengeDetected, pageLooksReady };
    });
    if (!state.challengeDetected || state.pageLooksReady) {
      const elapsedMs2 = Date.now() - start;
      console.log(
        `Cloudflare check passed on ${contextLabel} after ${Math.round(elapsedMs2 / 1e3)}s`
      );
      return;
    }
    const elapsedMs = Date.now() - start;
    console.log(
      `Waiting Cloudflare on ${contextLabel}... ${Math.round(elapsedMs / 1e3)}s/${Math.round(timeoutMs / 1e3)}s (tick ${tick})`
    );
    await new Promise((resolve) => setTimeout(resolve, 2e3));
  }
  throw new Error("Cloudflare challenge did not resolve in time");
}

// src/extractors.js
function normalizeListingUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    const trackingParams = /* @__PURE__ */ new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid"
    ]);
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (trackingParams.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.searchParams.sort();
    parsed.search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : "";
    let normalized = parsed.toString();
    if (normalized.endsWith("/?")) {
      normalized = normalized.slice(0, -2);
    }
    return normalized;
  } catch {
    return null;
  }
}
async function extractListingPageData(page, listingUrl, rootListingUrl, options = {}) {
  return page.evaluate((url, rootUrl, { brands, brandSlug, excludeServices }) => {
    const toAbsolute = (href) => {
      try {
        return new URL(href, url).toString();
      } catch {
        return null;
      }
    };
    const trimSlashes = (pathname) => pathname.replace(/\/+$/, "");
    const root = new URL(rootUrl, url);
    const rootBasePath = trimSlashes(root.pathname);
    const serviceWords = ["\u04AF\u0439\u043B\u0447\u0438\u043B\u0433\u044D\u044D", "\u0437\u0430\u0441\u0432\u0430\u0440", "service", "repair"];
    const adAnchors = Array.from(document.querySelectorAll('a[href*="/adv/"]'));
    const listingCardAnchors = adAnchors.filter((anchor) => {
      const card = anchor.closest("[itemscope], article, li");
      if (!card || !card.querySelector('[itemprop="price"]')) {
        return false;
      }
      const cardText = (card.textContent || "").toLowerCase();
      if (brands && !brands.some((brand) => cardText.includes(brand))) {
        return false;
      }
      return !(excludeServices && serviceWords.some((word) => cardText.includes(word)));
    });
    const anchorSource = listingCardAnchors.length > 0 ? listingCardAnchors : adAnchors;
    const adLinks = anchorSource.map((a) => toAbsolute(a.getAttribute("href"))).filter(Boolean).filter((href) => {
      if (!brandSlug) {
        return true;
      }
      const path2 = new URL(href).pathname.toLowerCase();
      return new RegExp(`/adv/\\d+_[^/]*${brandSlug}`, "i").test(path2);
    });
    const paginationLinks = Array.from(document.querySelectorAll("a[href]")).map((a) => toAbsolute(a.getAttribute("href"))).filter(Boolean).filter((href) => {
      const parsed = new URL(href);
      return parsed.origin === root.origin && trimSlashes(parsed.pathname) === rootBasePath && /[?&]page=\d+/.test(parsed.search);
    });
    return {
      adLinks: Array.from(new Set(adLinks)),
      paginationLinks: Array.from(new Set(paginationLinks))
    };
  }, listingUrl, rootListingUrl, {
    brands: options.brands ?? null,
    brandSlug: options.brandSlug ?? null,
    excludeServices: Boolean(options.excludeServices)
  });
}
function formatUlaanbaatarTime(raw) {
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) {
    return raw ?? null;
  }
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
async function revealSellerPhone(page) {
  const showPhoneSelector = '[data-marker^="advert-cta_call"]';
  if (!await page.$(showPhoneSelector)) {
    return null;
  }
  const phoneResponse = page.waitForResponse(
    (response) => response.url().includes("/get_phone/") && response.request().method() === "GET",
    { timeout: 15e3 }
  ).then((response) => response.json()).catch(() => null);
  const termsDialog = page.waitForSelector('[data-component="TermsDialog"]', { timeout: 5e3 }).catch(() => null);
  await page.$eval(showPhoneSelector, (button) => button.click());
  const first = await Promise.race([
    phoneResponse.then(() => "phone"),
    termsDialog.then((dialog) => dialog ? "terms" : null)
  ]);
  if (first === "terms") {
    await page.evaluate(() => {
      const accept = Array.from(document.querySelectorAll('[data-component="TermsDialog"] button')).find((button) => button.textContent.trim() === "\u0417\u04E9\u0432\u0448\u04E9\u04E9\u0440\u04E9\u0445");
      accept?.click();
    });
  }
  const data = await phoneResponse;
  return data?.phone ? String(data.phone) : null;
}
async function extractAdData(page, adUrl, { collectPhone = true } = {}) {
  let revealedPhone = null;
  if (collectPhone) {
    try {
      revealedPhone = await revealSellerPhone(page);
    } catch (error) {
      console.warn(`Could not reveal phone for ${adUrl}: ${error.message}`);
    }
  }
  const extracted = await page.evaluate(async (url) => {
    const normalizeText = (value) => value?.replace(/\s+/g, " ")?.trim() ?? "";
    const text = (selector) => {
      const el = document.querySelector(selector);
      return normalizeText(el?.textContent) || null;
    };
    const readAdvertDetail = () => {
      const chunks = [];
      for (const script of document.querySelectorAll("script:not([src])")) {
        const match = script.textContent.match(/^\s*self\.__next_f\.push\((\[[\s\S]*\])\)\s*;?\s*$/);
        if (!match) {
          continue;
        }
        try {
          const entry = JSON.parse(match[1]);
          if (entry[0] === 1 && typeof entry[1] === "string") {
            chunks.push(entry[1]);
          }
        } catch {
          continue;
        }
      }
      for (const row of chunks.join("").split("\n")) {
        if (!row.includes('"adverts","detail"')) {
          continue;
        }
        let parsed;
        try {
          parsed = JSON.parse(row.slice(row.indexOf(":") + 1));
        } catch {
          continue;
        }
        const stack = [parsed];
        while (stack.length > 0) {
          const node = stack.pop();
          if (!node || typeof node !== "object") {
            continue;
          }
          const key = node.queryKey;
          const data = node.state?.data;
          if (Array.isArray(key) && key[0] === "adverts" && key[1] === "detail" && data && typeof data === "object") {
            return data;
          }
          stack.push(...Object.values(node));
        }
      }
      return null;
    };
    const readLinkedData = () => {
      const result = { product: null, webPage: null };
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const raw = JSON.parse(script.textContent || "null");
          const entries = raw?.["@graph"] ?? (Array.isArray(raw) ? raw : [raw]);
          for (const entry of entries) {
            const types = [].concat(entry?.["@type"] ?? []);
            if (types.includes("Product")) result.product ??= entry;
            if (types.includes("WebPage")) result.webPage ??= entry;
          }
        } catch {
          continue;
        }
      }
      return result;
    };
    const readItemApi = async (id) => {
      if (!id) {
        return null;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1e4);
      try {
        const response = await fetch(`/api/items/${id}/`, {
          credentials: "include",
          headers: { accept: "application/json" },
          signal: controller.signal
        });
        return response.ok ? await response.json() : null;
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    };
    const formatFeatureValue = (feature) => {
      if (feature?.value != null && feature.value !== "") {
        return String(feature.value);
      }
      if (Array.isArray(feature?.values)) {
        return feature.values.map((v) => typeof v === "object" ? v?.name ?? v?.value : v).filter(Boolean).join(", ");
      }
      return "";
    };
    const detail = readAdvertDetail();
    const { product, webPage } = readLinkedData();
    const idFromUrl = new URL(url).pathname.match(/\/adv\/(\d+)/)?.[1] ?? null;
    const adNumber = detail?.id ?? product?.sku ?? idFromUrl;
    const itemApi = await readItemApi(adNumber);
    const attributes = {};
    if (Array.isArray(detail?.features) && detail.features.length > 0) {
      for (const feature of detail.features) {
        const value = formatFeatureValue(feature);
        if (feature?.name && value) {
          attributes[`${normalizeText(feature.name)}:`] = value;
        }
      }
    } else {
      const kvCandidates = [
        ...Array.from(document.querySelectorAll("li")),
        ...Array.from(document.querySelectorAll("tr")),
        ...Array.from(document.querySelectorAll("dl div"))
      ];
      for (const node of kvCandidates) {
        const childText = Array.from(node.children).map((c) => c.textContent?.replace(/\s+/g, " ").trim()).filter(Boolean);
        if (childText.length >= 2) {
          const key = childText[0];
          const value = childText.slice(1).join(" | ");
          if (key && value && key.length < 60 && value.length < 240) {
            attributes[key] = value;
          }
        }
      }
    }
    const descriptionNode = document.querySelector('[data-component="AdvertDescriptionApp"] h2')?.parentElement?.nextElementSibling;
    return {
      url,
      title: detail?.name ?? product?.name ?? text("h1"),
      price: detail?.price?.price ?? text('[data-component="SidebarPrice"] span'),
      location: detail?.location?.name ?? text('[data-component="AdvertHeaderApp"] button span'),
      publishedRaw: itemApi?.raise_dt ?? null,
      publishedFallback: webPage?.datePublished ?? detail?.counters?.published ?? null,
      adNumber: adNumber != null ? String(adNumber) : null,
      description: detail?.description ?? product?.description ?? normalizeText(descriptionNode?.textContent),
      seller: {
        name: detail?.user?.name ?? product?.offers?.seller?.name ?? null,
        type: itemApi?.user?.account_type || null
      },
      attributes
    };
  }, adUrl);
  const normalizedAttributes = {};
  for (const [key, value] of Object.entries(extracted.attributes ?? {})) {
    const cleanedKey = normalizeWhitespace(key);
    const cleanedValue = normalizeWhitespace(value);
    if (cleanedKey && cleanedValue) {
      normalizedAttributes[cleanedKey] = cleanedValue;
    }
  }
  const publishedDate = extracted.publishedRaw ? formatUlaanbaatarTime(extracted.publishedRaw) : extracted.publishedFallback;
  return {
    url: extracted.url,
    title: normalizeWhitespace(extracted.title),
    price: normalizeWhitespace(extracted.price),
    location: normalizeWhitespace(extracted.location),
    publishedDate: normalizeWhitespace(publishedDate),
    adNumber: normalizeWhitespace(extracted.adNumber),
    description: normalizeWhitespace(extracted.description),
    seller: {
      name: normalizeWhitespace(extracted.seller?.name),
      type: normalizeWhitespace(extracted.seller?.type),
      phone: normalizeWhitespace(revealedPhone)
    },
    attributes: normalizedAttributes
  };
}

// src/cars.js
var BRANDS = ["toyota", "lexus"];
var SERVICE_WORDS = ["\u04AF\u0439\u043B\u0447\u0438\u043B\u0433\u044D\u044D", "\u0437\u0430\u0441\u0432\u0430\u0440", "service", "repair"];
var cars = {
  filePrefix: "unegui-toyota",
  forStartUrl(startUrl) {
    const urlText = String(startUrl).toLowerCase();
    const brandSlug = BRANDS.find((brand) => urlText.includes(`/${brand}/`)) ?? null;
    const requireRightSteering = urlText.includes("ruli---zv");
    const minYear = Number.parseInt(urlText.match(/year_min---(\d{4})/)?.[1], 10);
    return {
      // On a listing without a brand in the URL, only Toyota and Lexus cards are kept
      listingOptions: {
        brands: brandSlug ? [brandSlug] : BRANDS,
        brandSlug,
        excludeServices: true
      },
      accepts(ad) {
        const title = ad.title.toLowerCase();
        if (SERVICE_WORDS.some((word) => title.includes(word))) {
          return false;
        }
        if (brandSlug && !title.includes(brandSlug) && !ad.url.toLowerCase().includes(brandSlug)) {
          return false;
        }
        const steering = ad.attributes["\u0425\u04AF\u0440\u0434:"]?.toLowerCase();
        if (requireRightSteering && steering && !steering.includes("\u0437\u04E9\u0432")) {
          return false;
        }
        const year = Number.parseInt(ad.attributes["\u04AE\u0439\u043B\u0434\u0432\u044D\u0440\u043B\u044D\u0441\u044D\u043D \u043E\u043D:"], 10);
        return !(Number.isFinite(minYear) && Number.isFinite(year) && year < minYear);
      }
    };
  },
  toCsvRow(ad) {
    return {
      url: ad.url,
      title: ad.title,
      price: ad.price,
      location: ad.location,
      published_date: ad.publishedDate,
      ad_number: ad.adNumber,
      description: ad.description,
      seller_name: ad.seller.name,
      seller_type: ad.seller.type,
      seller_phone: ad.seller.phone,
      ...Object.fromEntries(
        Object.entries(ad.attributes).map(([key, value]) => [`attr_${key}`, value])
      )
    };
  }
};

// src/realestate.js
var ATTRIBUTE_FIELDS = {
  "\u04E9\u0440\u04E9\u04E9\u043D\u0438\u0439 \u0442\u043E\u043E": "rooms",
  "\u0445\u044D\u0434\u044D\u043D \u04E9\u0440\u04E9\u04E9": "rooms",
  "\u0445\u044D\u0434\u044D\u043D \u0434\u0430\u0432\u0445\u0430\u0440\u0442": "floor",
  "\u0434\u0430\u0432\u0445\u0430\u0440": "floor",
  "\u0431\u0430\u0439\u0440\u043D\u044B \u0434\u0430\u0432\u0445\u0430\u0440": "floor",
  "\u0431\u0430\u0440\u0438\u043B\u0433\u044B\u043D \u0434\u0430\u0432\u0445\u0430\u0440": "totalFloors",
  "\u043D\u0438\u0439\u0442 \u0434\u0430\u0432\u0445\u0430\u0440": "totalFloors",
  "\u0442\u0430\u043B\u0431\u0430\u0439": "totalArea",
  "\u043D\u0438\u0439\u0442 \u0442\u0430\u043B\u0431\u0430\u0439": "totalArea",
  "\u0437\u0430\u0430\u043B \u0442\u0430\u043B\u0431\u0430\u0439": "livingArea",
  "\u0430\u0448\u0438\u0433\u043B\u0430\u043B\u0442\u0430\u043D\u0434 \u043E\u0440\u0441\u043E\u043D \u043E\u043D": "builtYear",
  "\u0430\u0448\u0438\u0433\u043B\u0430\u043B\u0442\u0430\u0434 \u043E\u0440\u0441\u043E\u043D \u043E\u043D": "builtYear",
  "\u0431\u0430\u0440\u0438\u043B\u0433\u044B\u043D \u043E\u043D": "builtYear",
  "\u0434\u0443\u043B\u0430\u0430\u043D\u044B \u0441\u0438\u0441\u0442\u0435\u043C": "heating",
  "\u0446\u043E\u043D\u0445": "window",
  "\u0445\u0430\u0430\u043B\u0433\u0430": "door",
  "\u0442\u0430\u0433\u0442": "balcony",
  "\u0446\u0430\u0445\u0438\u043B\u0433\u0430\u0430\u043D \u0448\u0430\u0442\u0442\u0430\u0439 \u044D\u0441\u044D\u0445": "elevator",
  "\u043B\u0438\u0444\u0442": "elevator",
  "\u0437\u0430\u0441\u0430\u043B\u0442": "renovation",
  "\u0445\u0430\u0448\u0430\u0430": "fence",
  "\u0434\u04AF\u04AF\u0440\u044D\u0433": "district",
  "\u0445\u043E\u0440\u043E\u043E": "subdistrict",
  "\u0431\u0430\u0439\u0440\u043D\u044B \u0442\u04E9\u0440\u04E9\u043B": "propertyType",
  "\u043E\u0440\u043E\u043D \u0441\u0443\u0443\u0446\u043D\u044B \u0442\u04E9\u0440\u04E9\u043B": "propertyType"
};
function fieldFor(attributeKey) {
  const label = normalizeWhitespace(attributeKey).replace(/:$/, "").toLowerCase();
  return ATTRIBUTE_FIELDS[label] ?? null;
}
var realEstate = {
  filePrefix: "unegui-realestate",
  forStartUrl() {
    return { listingOptions: {}, accepts: () => true };
  },
  enrich(ad) {
    for (const [key, value] of Object.entries(ad.attributes)) {
      const field = fieldFor(key);
      if (field && !ad[field]) {
        ad[field] = value;
      }
    }
    return ad;
  },
  toCsvRow(ad) {
    const remainingAttrs = Object.fromEntries(
      Object.entries(ad.attributes).filter(([key]) => !fieldFor(key)).map(([key, value]) => [`attr_${key}`, value])
    );
    return {
      url: ad.url,
      title: ad.title,
      price: ad.price,
      location: ad.location,
      district: ad.district,
      subdistrict: ad.subdistrict,
      published_date: ad.publishedDate,
      ad_number: ad.adNumber,
      description: ad.description,
      seller_name: ad.seller.name,
      seller_type: ad.seller.type,
      seller_phone: ad.seller.phone,
      property_type: ad.propertyType,
      rooms: ad.rooms,
      floor: ad.floor,
      total_floors: ad.totalFloors,
      total_area: ad.totalArea,
      living_area: ad.livingArea,
      built_year: ad.builtYear,
      heating: ad.heating,
      renovation: ad.renovation,
      balcony: ad.balcony,
      elevator: ad.elevator,
      window: ad.window,
      door: ad.door,
      fence: ad.fence,
      ...remainingAttrs
    };
  }
};

// src/scraper.js
var MODES = { cars, realestate: realEstate };
async function runScraper(config) {
  const mode = MODES[config.mode ?? "cars"];
  if (!mode) {
    throw new Error(`Unknown mode: ${config.mode}`);
  }
  if (!config.startUrls?.length) {
    throw new Error("No start URLs provided. Please enter a listing URL.");
  }
  const browser = await launchBrowser({
    headless: config.headless,
    proxyUrl: config.proxyUrl
  });
  const tabs = {};
  const getTab = async (name) => {
    if (!tabs[name] || tabs[name].isClosed()) {
      tabs[name] = await browser.newPage();
      await preparePage(tabs[name]);
    }
    return tabs[name];
  };
  const visit = async (name, url, label) => {
    const page = await getTab(name);
    console.log(`Opening ${name} page...`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: config.navigationTimeoutMs
    });
    try {
      await waitForCloudflareChallenge(page, config.cfChallengeTimeoutMs, label);
    } catch (error) {
      console.warn(`Cloudflare wait timeout on ${name} page: ${error.message}`);
      if (config.failOnCloudflareTimeout) {
        throw error;
      }
    }
    await simulateHumanBehavior(page);
    await humanDelay(config.minDelayMs, config.maxDelayMs);
    return page;
  };
  try {
    const seenAdUrls = /* @__PURE__ */ new Set();
    const adGroups = [];
    let totalListingPages = 0;
    for (const startUrl of config.startUrls) {
      const normalizedStart = normalizeListingUrl(startUrl) ?? startUrl;
      const { listingOptions, accepts } = mode.forStartUrl(startUrl);
      const groupAdUrls = [];
      const listingQueue = [normalizedStart];
      const queuedListings = /* @__PURE__ */ new Set([normalizedStart]);
      const visitedListings = /* @__PURE__ */ new Set();
      console.log(`
Crawling listings from: ${normalizedStart}`);
      while (listingQueue.length > 0) {
        if (visitedListings.size >= config.maxListingPages) {
          console.warn(`Reached listing page cap: ${config.maxListingPages}`);
          break;
        }
        const listingUrl = listingQueue.shift();
        visitedListings.add(listingUrl);
        console.log(`Listing page: ${listingUrl}`);
        const { adLinks, paginationLinks } = await retry(async () => {
          const page = await visit("listing", listingUrl, `listing ${visitedListings.size}`);
          return extractListingPageData(page, listingUrl, normalizedStart, listingOptions);
        }, config.retries);
        for (const link of adLinks) {
          if (!seenAdUrls.has(link)) {
            seenAdUrls.add(link);
            groupAdUrls.push(link);
          }
        }
        for (const link of paginationLinks) {
          const normalized = normalizeListingUrl(link);
          if (normalized && !queuedListings.has(normalized)) {
            queuedListings.add(normalized);
            listingQueue.push(normalized);
          }
        }
        console.log(
          `Collected ad links: ${seenAdUrls.size} total, pending listing pages: ${listingQueue.length}`
        );
      }
      totalListingPages += visitedListings.size;
      adGroups.push({ adUrls: groupAdUrls, accepts });
    }
    const adEntries = [];
    const maxLen = Math.max(...adGroups.map((g) => g.adUrls.length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const group of adGroups) {
        if (i < group.adUrls.length) {
          adEntries.push([group.adUrls[i], group.accepts]);
        }
      }
    }
    const desiredCount = config.maxAds > 0 ? config.maxAds : adEntries.length;
    const results = [];
    for (const [index, [adUrl, accepts]] of adEntries.entries()) {
      if (results.length >= desiredCount) {
        break;
      }
      console.log(`Ad ${index + 1}/${adEntries.length}: ${adUrl}`);
      try {
        const adData = await retry(async () => {
          const page = await visit("ad", adUrl, `ad ${index + 1}/${adEntries.length}`);
          return extractAdData(page, adUrl, { collectPhone: config.collectPhones !== false });
        }, config.retries);
        if (!accepts(adData)) {
          console.log(`Skipped out-of-filter ad: ${adUrl}`);
          continue;
        }
        results.push(mode.enrich ? mode.enrich(adData) : adData);
      } catch (error) {
        console.error(`Failed ad: ${adUrl}`);
        console.error(error.message);
      }
    }
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const outputDir = config.outputDir ?? import_node_path.default.join(process.cwd(), "output");
    await (0, import_promises2.mkdir)(outputDir, { recursive: true });
    const outputBase = import_node_path.default.join(outputDir, `${mode.filePrefix}-${stamp}`);
    let savedFile;
    if (config.outputFormat === "csv") {
      savedFile = `${outputBase}.csv`;
      await writeCsv(savedFile, results.map(mode.toCsvRow));
      console.log(`Saved CSV: ${savedFile}`);
    } else {
      savedFile = `${outputBase}.json`;
      await writeJson(savedFile, results);
      console.log(`Saved JSON: ${savedFile}`);
    }
    return {
      listingPages: totalListingPages,
      adCount: results.length,
      savedFile
    };
  } finally {
    await browser.close().catch((error) => {
      console.warn(`Ignoring browser close error: ${error.message}`);
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runScraper
});
