const state = {
  language: "en",
  networks: [],
  chainKey: "base",
  sessionId: "",
  chain: null,
  drop: null,
  wallets: [],
  rpcs: [],
  validation: null,
  prepared: false,
  armed: false,
  gasEdited: false,
  results: [],
  pollTimer: 0,
  countdownTimer: 0
};

const $ = (selector) => document.querySelector(selector);

const els = {
  statePill: $("#statePill"),
  languageButtons: document.querySelectorAll("[data-language]"),
  networkGrid: $("#networkGrid"),
  networkHint: $("#networkHint"),
  runtimeWarning: $("#runtimeWarning"),
  targetInput: $("#targetInput"),
  analyzeButton: $("#analyzeButton"),
  analyzeStatus: $("#analyzeStatus"),
  analysisPanel: $("#analysisPanel"),
  collectionLabel: $("#collectionLabel"),
  stageBadge: $("#stageBadge"),
  analysisMetrics: $("#analysisMetrics"),
  countdown: $("#countdown"),
  countdownBlock: $("#countdownBlock"),
  privateKeyInput: $("#privateKeyInput"),
  addWalletButton: $("#addWalletButton"),
  clearWalletsButton: $("#clearWalletsButton"),
  walletList: $("#walletList"),
  rpcInput: $("#rpcInput"),
  checkRpcButton: $("#checkRpcButton"),
  rpcList: $("#rpcList"),
  quantityInput: $("#quantityInput"),
  maxFeeInput: $("#maxFeeInput"),
  priorityFeeInput: $("#priorityFeeInput"),
  gasLimitInput: $("#gasLimitInput"),
  baseFeeLabel: $("#baseFeeLabel"),
  validateButton: $("#validateButton"),
  prepareButton: $("#prepareButton"),
  settingsStatus: $("#settingsStatus"),
  readinessList: $("#readinessList"),
  armButton: $("#armButton"),
  armStatus: $("#armStatus"),
  resultStatus: $("#resultStatus"),
  resultList: $("#resultList")
};

const copy = {
  en: {
    appTitle: "Public Mint Tool",
    securityLead: "Use dedicated mint wallets.",
    securityCopy:
      "Private keys are held only in this local Node process memory for the active session and are cleared on cancel, completion, timeout, or server restart.",
    wrongRuntime:
      "Open this app from http://localhost:3000 or http://127.0.0.1:3000. If it is opened from another preview/file URL, wallet and mint API calls will fail.",
    navNetwork: "Network",
    navTarget: "Target",
    navWallets: "Wallets",
    navRpc: "RPC",
    navMint: "Mint",
    navReview: "Review",
    navResults: "Results",
    step1: "Step 1",
    step2: "Step 2",
    step3: "Step 3",
    step4: "Step 4",
    step5: "Step 5",
    step7: "Step 7",
    selectNetwork: "Select Network",
    loadingNetworks: "Loading networks...",
    chooseChain: "Choose a chain",
    selected: "selected",
    chainId: "Chain ID",
    nftTarget: "NFT Target",
    targetHint: "Raw contract or OpenSea URL",
    targetLabel: "Contract or OpenSea URL",
    analyzeMint: "Analyze Mint",
    sourceOnchain: "Source: on-chain SeaDrop configuration",
    mintConfiguration: "Mint Configuration",
    mintOpensIn: "Mint opens in",
    mintStageEnded: "Mint stage ended",
    mintStageLive: "Mint stage is live",
    localWallets: "Local Wallets",
    clearAll: "Clear All",
    privateKey: "Private key",
    addWallet: "Add Wallet",
    rpcEndpoints: "RPC Endpoints",
    checkRpcs: "Check RPCs",
    customRpcUrls: "Custom RPC URLs",
    customRpcPlaceholder: "Paste several endpoints. Wrong-chain endpoints are excluded.",
    quantityGas: "Quantity and Gas",
    baseFee: "Base fee",
    nftsPerWallet: "NFTs per wallet",
    maxFeeGas: "Max fee per gas (gwei)",
    priorityFee: "Priority fee (gwei)",
    gasLimit: "Gas limit",
    autoTiming: "Execution timing is automatic. Live stages broadcast immediately; upcoming stages wait for the on-chain start time.",
    refreshGas: "Gas refreshes immediately before broadcast and transactions are re-signed locally.",
    validate: "Validate",
    prepareMint: "Prepare Mint",
    executionControlStep: "Execution",
    executionControl: "Execution Control",
    fastPath: "Fast path",
    nonceWarning: "Prepared transactions use current wallet nonces. Do not use these wallets elsewhere before broadcast.",
    confirmArm: "Confirm & Arm",
    walletResults: "Wallet Results",
    readConfig: "Reading public mint configuration...",
    configLoaded: "Mint configuration loaded.",
    analyzeBeforeWallet: "Analyze a mint target before adding wallets.",
    checkingBalance: "Checking wallet balance...",
    walletAdded: "Wallet added.",
    analyzeBeforeRpc: "Analyze a mint target before checking RPCs.",
    checkingRpcs: "Checking RPC endpoints...",
    rpcsChecked: "RPC endpoints checked.",
    analyzeFirst: "Analyze a mint target first.",
    validating: "Checking wallet balances and mint requirements...",
    validationComplete: "Validation complete.",
    preparing: "Preparing transactions...",
    signed: "Transactions signed locally.",
    arming: "Arming mint...",
    waitingStart: "Waiting for stage start...",
    broadcasting: "Broadcasting transactions...",
    cancelled: "Mint cancelled. Prepared transactions were discarded.",
    confirming: "Waiting for confirmation...",
    completed: "Mint execution completed.",
    failed: "Mint execution failed.",
    nftContract: "NFT contract",
    mintPrice: "Mint price",
    stageStartLabel: "Stage start",
    stageEnd: "Stage end",
    maxPerWallet: "Max per wallet",
    feeRecipient: "Fee recipient",
    publicStage: "Public stage",
    wallet: "Wallet",
    balance: "Balance",
    remove: "Remove",
    noWallets: "No wallets added.",
    readCapable: "Read-capable",
    broadcastOnly: "Broadcast-only candidate",
    noRpcChecks: "No RPC checks yet.",
    mintValue: "Mint value",
    maxGas: "Max gas",
    network: "Network",
    totalNfts: "Total NFTs",
    maxFee: "Max fee",
    priorityFeeShort: "Priority fee",
    enabled: "Enabled",
    disabled: "Disabled",
    trackingWallets: "Tracking each wallet independently",
    noExecution: "No execution yet",
    status: "Status",
    transaction: "Transaction",
    block: "Block",
    gasUsed: "Gas used",
    explorer: "Explorer",
    preparedResults: "Prepared and broadcast results will appear here.",
  },
  tr: {
    appTitle: "Public Mint Aracı",
    securityLead: "Sadece mint için ayrılmış cüzdanlar kullan.",
    securityCopy:
      "Private key'ler yalnızca aktif session boyunca yerel Node sürecinin belleğinde tutulur; iptal, tamamlanma, zaman aşımı veya server restart ile temizlenir.",
    wrongRuntime:
      "Bu uygulamayı http://localhost:3000 veya http://127.0.0.1:3000 üzerinden aç. Başka preview/file URL'den açılırsa wallet ve mint API çağrıları çalışmaz.",
    navNetwork: "Ağ",
    navTarget: "Hedef",
    navWallets: "Cüzdanlar",
    navRpc: "RPC",
    navMint: "Mint",
    navReview: "Kontrol",
    navResults: "Sonuçlar",
    step1: "Adım 1",
    step2: "Adım 2",
    step3: "Adım 3",
    step4: "Adım 4",
    step5: "Adım 5",
    step7: "Adım 7",
    selectNetwork: "Ağ Seç",
    loadingNetworks: "Ağlar yükleniyor...",
    chooseChain: "Bir ağ seç",
    selected: "seçildi",
    chainId: "Chain ID",
    nftTarget: "NFT Hedefi",
    targetHint: "Raw contract veya OpenSea URL",
    targetLabel: "Contract veya OpenSea URL",
    analyzeMint: "Mint Analiz Et",
    sourceOnchain: "Kaynak: on-chain SeaDrop konfigürasyonu",
    mintConfiguration: "Mint Konfigürasyonu",
    mintOpensIn: "Mint açılışına kalan",
    mintStageEnded: "Mint stage bitti",
    mintStageLive: "Mint stage canlı",
    localWallets: "Yerel Cüzdanlar",
    clearAll: "Hepsini Temizle",
    privateKey: "Private key",
    addWallet: "Cüzdan Ekle",
    rpcEndpoints: "RPC Endpointleri",
    checkRpcs: "RPC Kontrol Et",
    customRpcUrls: "Özel RPC URL'leri",
    customRpcPlaceholder: "Birden fazla endpoint yapıştır. Yanlış-chain endpointler hariç tutulur.",
    quantityGas: "Adet ve Gas",
    baseFee: "Base fee",
    nftsPerWallet: "Cüzdan başı NFT",
    maxFeeGas: "Max fee per gas (gwei)",
    priorityFee: "Priority fee (gwei)",
    gasLimit: "Gas limiti",
    autoTiming: "Execution zamanı otomatik. Live stage hemen broadcast edilir; upcoming stage on-chain başlangıç zamanını bekler.",
    refreshGas: "Broadcast öncesi gas yenilenir ve transaction'lar local olarak tekrar imzalanır.",
    validate: "Doğrula",
    prepareMint: "Mint Hazırla",
    executionControlStep: "Execution",
    executionControl: "Execution Kontrolü",
    fastPath: "Hızlı akış",
    nonceWarning: "Hazırlanan transaction'lar mevcut wallet nonce'larını kullanır. Broadcast öncesi bu cüzdanları başka yerde kullanma.",
    confirmArm: "Onayla ve Kur",
    walletResults: "Cüzdan Sonuçları",
    readConfig: "Public mint konfigürasyonu okunuyor...",
    configLoaded: "Mint konfigürasyonu yüklendi.",
    analyzeBeforeWallet: "Cüzdan eklemeden önce mint hedefini analiz et.",
    checkingBalance: "Cüzdan bakiyesi kontrol ediliyor...",
    walletAdded: "Cüzdan eklendi.",
    analyzeBeforeRpc: "RPC kontrolünden önce mint hedefini analiz et.",
    checkingRpcs: "RPC endpointleri kontrol ediliyor...",
    rpcsChecked: "RPC endpointleri kontrol edildi.",
    analyzeFirst: "Önce mint hedefini analiz et.",
    validating: "Cüzdan bakiyeleri ve mint gereksinimleri kontrol ediliyor...",
    validationComplete: "Doğrulama tamamlandı.",
    preparing: "Transaction'lar hazırlanıyor...",
    signed: "Transaction'lar local olarak imzalandı.",
    arming: "Mint kuruluyor...",
    waitingStart: "Stage başlangıcı bekleniyor...",
    broadcasting: "Transaction'lar broadcast ediliyor...",
    cancelled: "Mint iptal edildi. Hazırlanan transaction'lar silindi.",
    confirming: "Confirmation bekleniyor...",
    completed: "Mint yürütmesi tamamlandı.",
    failed: "Mint yürütmesi başarısız.",
    nftContract: "NFT contract",
    mintPrice: "Mint fiyatı",
    stageStartLabel: "Stage başlangıcı",
    stageEnd: "Stage bitişi",
    maxPerWallet: "Cüzdan başı maksimum",
    feeRecipient: "Fee recipient",
    publicStage: "Public stage",
    wallet: "Cüzdan",
    balance: "Bakiye",
    remove: "Kaldır",
    noWallets: "Cüzdan eklenmedi.",
    readCapable: "Okuma destekli",
    broadcastOnly: "Sadece broadcast adayı",
    noRpcChecks: "RPC kontrolü yapılmadı.",
    mintValue: "Mint değeri",
    maxGas: "Maks gas",
    network: "Ağ",
    totalNfts: "Toplam NFT",
    maxFee: "Max fee",
    priorityFeeShort: "Priority fee",
    enabled: "Açık",
    disabled: "Kapalı",
    trackingWallets: "Her cüzdan ayrı takip ediliyor",
    noExecution: "Henüz execution yok",
    status: "Durum",
    transaction: "Transaction",
    block: "Blok",
    gasUsed: "Kullanılan gas",
    explorer: "Explorer",
    preparedResults: "Hazırlık ve broadcast sonuçları burada görünecek.",
  }
};

function t(key) {
  return copy[state.language][key] || copy.en[key] || key;
}

init();

async function init() {
  bindEvents();
  clearStartupInputs();
  checkRuntimeOrigin();
  await loadNetworks();
  renderAll();
}

function clearStartupInputs() {
  const clear = () => {
    els.targetInput.value = "";
    els.rpcInput.value = "";
    els.privateKeyInput.value = "";
  };
  clear();
  window.setTimeout(clear, 50);
  window.setTimeout(clear, 250);
  window.setTimeout(clear, 800);
}

function bindEvents() {
  els.languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.language = button.dataset.language || "en";
      applyLanguage();
      renderAll();
    });
  });
  [els.targetInput, els.privateKeyInput].forEach((input) => {
    input.addEventListener("focus", () => input.removeAttribute("readonly"));
    input.addEventListener("pointerdown", () => input.removeAttribute("readonly"));
  });
  [els.maxFeeInput, els.priorityFeeInput, els.gasLimitInput].forEach((input) => {
    input.addEventListener("input", () => {
      state.gasEdited = true;
    });
  });
  els.analyzeButton.addEventListener("click", analyzeMint);
  els.addWalletButton.addEventListener("click", addWallet);
  els.clearWalletsButton.addEventListener("click", clearWallets);
  els.checkRpcButton.addEventListener("click", checkRpcs);
  els.validateButton.addEventListener("click", validateMint);
  els.prepareButton.addEventListener("click", prepareMint);
  els.armButton.addEventListener("click", armMint);
}

async function loadNetworks() {
  const data = await api("/api/networks");
  state.networks = data.networks;
  if (!state.networks.some((network) => network.key === state.chainKey)) {
    state.chainKey = state.networks[0]?.key || "";
  }
}

async function analyzeMint() {
  setStatus("INSPECTING", t("readConfig"));
  try {
    const data = await api("/api/inspect", {
      method: "POST",
      body: {
        chainKey: state.chainKey,
        target: els.targetInput.value,
        rpcUrls: ""
      }
    });
    state.sessionId = data.sessionId;
    state.chain = data.chain;
    state.drop = data.drop;
    state.rpcs = data.rpcs;
    state.wallets = [];
    state.validation = null;
    state.prepared = false;
    state.results = [];
    els.baseFeeLabel.textContent = "Fee";
    applySuggestedGas(data.baseFeeWei);
    els.analysisPanel.hidden = false;
    setStatus("CONFIGURING", t("configLoaded"));
    els.analyzeStatus.textContent = t("configLoaded");
    startCountdown();
    renderAll();
  } catch (error) {
    setStatus("FAILED", error.message);
  }
}

async function addWallet() {
  if (!state.sessionId) return setStatus("CONFIGURING", t("analyzeBeforeWallet"));
  setStatus("CONFIGURING", t("checkingBalance"));
  try {
    const data = await api(`/api/sessions/${state.sessionId}/wallets`, {
      method: "POST",
      body: { privateKey: els.privateKeyInput.value }
    });
    els.privateKeyInput.value = "";
    state.wallets = data.wallets;
    setStatus("CONFIGURING", t("walletAdded"));
    renderWallets();
  } catch (error) {
    setStatus("FAILED", error.message);
  }
}

async function clearWallets() {
  if (!state.sessionId) return;
  const data = await api(`/api/sessions/${state.sessionId}/wallets`, { method: "DELETE" });
  state.wallets = data.wallets;
  renderWallets();
}

async function removeWallet(walletId) {
  const data = await api(`/api/sessions/${state.sessionId}/wallets/${walletId}`, { method: "DELETE" });
  state.wallets = data.wallets;
  renderWallets();
}

async function checkRpcs() {
  if (!state.sessionId) return setStatus("CONFIGURING", t("analyzeBeforeRpc"));
  setStatus("VALIDATING", t("checkingRpcs"));
  try {
    const data = await api(`/api/sessions/${state.sessionId}/rpcs`, {
      method: "POST",
      body: { rpcUrls: els.rpcInput.value }
    });
    state.rpcs = data.rpcs;
    setStatus("CONFIGURING", t("rpcsChecked"));
    renderRpcs();
  } catch (error) {
    setStatus("FAILED", error.message);
  }
}

async function validateMint() {
  if (!state.sessionId) return setStatus("CONFIGURING", t("analyzeFirst"));
  setStatus("VALIDATING", t("validating"));
  try {
    const data = await api(`/api/sessions/${state.sessionId}/validate`, {
      method: "POST",
      body: {
        quantity: els.quantityInput.value,
        maxFeeGwei: els.maxFeeInput.value,
        priorityFeeGwei: els.priorityFeeInput.value,
        gasLimit: els.gasLimitInput.value
      }
    });
    state.validation = data;
    els.prepareButton.disabled = data.wallets.every((wallet) => !wallet.ready);
    els.baseFeeLabel.textContent = "Fee";
    setStatus("READY", t("validationComplete"));
    renderReadiness();
  } catch (error) {
    els.prepareButton.disabled = true;
    setStatus("FAILED", error.message);
  }
}

async function prepareMint() {
  setStatus("PREPARING", t("preparing"));
  try {
    const data = await api(`/api/sessions/${state.sessionId}/prepare`, { method: "POST" });
    state.prepared = data.preparedCount > 0;
    state.results = data.results;
    els.armButton.disabled = !state.prepared;
    setStatus("PREPARED", t("signed"));
    renderResults();
    document.getElementById("executionControl").scrollIntoView({ block: "center", behavior: "smooth" });
  } catch (error) {
    setStatus("FAILED", error.message);
  }
}

async function armMint() {
  setStatus("ARMED", t("arming"));
  try {
    const data = await api(`/api/sessions/${state.sessionId}/arm`, {
      method: "POST",
      body: {}
    });
    state.armed = true;
    setStatus(data.state, data.state === "WAITING" ? t("waitingStart") : t("broadcasting"));
    pollStatus();
    state.pollTimer = window.setInterval(pollStatus, 2500);
  } catch (error) {
    setStatus("FAILED", error.message);
  }
}

async function pollStatus() {
  if (!state.sessionId) return;
  try {
    const data = await api(`/api/sessions/${state.sessionId}/status`);
    state.results = data.results || [];
    setStatus(data.state, statusMessage(data.state));
    renderResults();
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(data.state)) {
      window.clearInterval(state.pollTimer);
    }
  } catch (error) {
    window.clearInterval(state.pollTimer);
    setStatus("FAILED", error.message);
  }
}

function renderAll() {
  applyLanguage();
  renderNetworks();
  renderAnalysis();
  renderWallets();
  renderRpcs();
  renderReadiness();
  renderResults();
}

function renderNetworks() {
  els.networkHint.textContent = state.chain ? `${state.chain.name} ${t("selected")}` : t("chooseChain");
  els.networkGrid.innerHTML = state.networks
    .map(
      (network) => `
        <button class="network-card ${network.key === state.chainKey ? "is-selected" : ""}" type="button" data-chain="${network.key}">
          <span>${escapeHtml(network.name)}</span>
          <strong>${t("chainId")} ${network.chainId}</strong>
        </button>
      `
    )
    .join("");
  els.networkGrid.querySelectorAll("[data-chain]").forEach((button) => {
    button.addEventListener("click", () => {
      state.chainKey = button.dataset.chain;
      renderNetworks();
    });
  });
}

function renderAnalysis() {
  if (!state.drop) return;
  els.collectionLabel.textContent = state.drop.label || t("mintConfiguration");
  els.stageBadge.textContent = state.drop.status;
  els.stageBadge.className = `badge ${state.drop.status === "Live" ? "live" : state.drop.status === "Unsupported" || state.drop.status === "Ended" ? "bad" : ""}`;
  const rows = [
    [t("nftContract"), state.drop.nftContract],
    ["SeaDrop", state.drop.seaDropAddress],
    [t("mintPrice"), state.drop.mintPrice],
    [t("stageStartLabel"), state.drop.startTimeIso],
    [t("stageEnd"), state.drop.endTimeIso],
    [t("maxPerWallet"), state.drop.maxTotalMintableByWallet],
    [t("feeRecipient"), state.drop.feeRecipient],
    [t("publicStage"), state.drop.unsupportedReason || state.drop.status]
  ];
  els.analysisMetrics.innerHTML = rows.map(([label, value]) => metric(label, value)).join("");
}

function renderWallets() {
  els.walletList.innerHTML = state.wallets.length
    ? state.wallets
        .map(
          (wallet, index) => `
          <div class="wallet-card">
            <div>
              <strong>${t("wallet")} ${index + 1}</strong>
              <div class="card-meta mono">${wallet.shortAddress}</div>
              <div class="card-meta">${t("balance")}: ${wallet.balance}</div>
            </div>
            <button class="ghost" type="button" data-remove-wallet="${wallet.id}">${t("remove")}</button>
          </div>
        `
        )
        .join("")
    : "";
  els.walletList.querySelectorAll("[data-remove-wallet]").forEach((button) => {
    button.addEventListener("click", () => removeWallet(button.dataset.removeWallet));
  });
}

function renderRpcs() {
  els.rpcList.innerHTML = state.rpcs.length
    ? state.rpcs
        .map(
          (rpc) => `
          <div class="rpc-card">
            <div>
              <strong>${escapeHtml(rpc.label)}</strong>
              <div class="card-meta mono">${escapeHtml(rpc.url)}</div>
              <div class="card-meta">${rpc.readCapable ? t("readCapable") : t("broadcastOnly")}</div>
            </div>
            <div class="${rpc.status === "Connected" ? "ok" : rpc.status === "Wrong network" || rpc.status === "Unavailable" ? "bad" : "warn"}">
              ${rpc.status}${rpc.latencyMs ? `<br>${rpc.latencyMs}ms` : ""}
            </div>
          </div>
        `
        )
        .join("")
    : `<div class="card-meta">${t("noRpcChecks")}</div>`;
}

function renderReadiness() {
  if (!state.validation) {
    els.readinessList.innerHTML = "";
    return;
  }
  els.readinessList.innerHTML = state.validation.wallets
    .map(
      (wallet, index) => `
        <div class="ready-card">
          <div>
            <strong>${t("wallet")} ${index + 1}</strong>
            <div class="card-meta mono">${wallet.shortAddress}</div>
            <div class="card-meta">${t("balance")}: ${wallet.balance}</div>
            <div class="card-meta">${t("mintValue")}: ${weiToEth(BigInt(wallet.mintValueWei))}</div>
            <div class="card-meta">${t("maxGas")}: ${weiToEth(BigInt(wallet.gasReservationWei))}</div>
          </div>
          <strong class="${wallet.ready ? "ok" : "bad"}">${wallet.status}</strong>
        </div>
      `
    )
    .join("");
  if (state.validation.gas?.warnings?.length) {
    els.settingsStatus.textContent = state.validation.gas.warnings.join(" ");
  }
}

function renderResults() {
  els.resultStatus.textContent = state.results.length ? t("trackingWallets") : t("noExecution");
  els.resultList.innerHTML = state.results.length
    ? state.results
        .map(
          (result, index) => `
        <div class="result-card">
          <div>
            <strong>${t("wallet")} ${index + 1}</strong>
            <div class="card-meta mono">${escapeHtml(result.address)}</div>
            <div class="card-meta">${t("status")}: <span class="${result.status === "Confirmed" ? "ok" : result.status === "Rejected" || result.status === "Reverted" || result.status === "Timeout" ? "bad" : "warn"}">${escapeHtml(result.status)}</span></div>
            ${result.txHash ? `<div class="card-meta mono">${t("transaction")}: ${escapeHtml(result.txHash)}</div>` : ""}
            ${result.blockNumber ? `<div class="card-meta">${t("block")}: ${result.blockNumber}</div>` : ""}
            ${result.gasUsed ? `<div class="card-meta">${t("gasUsed")}: ${result.gasUsed}</div>` : ""}
            ${result.message ? `<div class="card-meta">${escapeHtml(result.message)}</div>` : ""}
          </div>
          ${result.explorerUrl ? `<a href="${escapeAttr(result.explorerUrl)}" target="_blank" rel="noreferrer">${t("explorer")}</a>` : ""}
        </div>
      `
        )
        .join("")
    : `<div class="card-meta">${t("preparedResults")}</div>`;
}

function startCountdown() {
  window.clearInterval(state.countdownTimer);
  updateCountdown();
  state.countdownTimer = window.setInterval(updateCountdown, 125);
}

function updateCountdown() {
  if (!state.drop?.startTime) {
    els.countdown.textContent = "--:--:--.---";
    return;
  }
  const diff = state.drop.startTime * 1000 - Date.now();
  if (diff <= 0) {
    els.countdownBlock.querySelector("span").textContent = state.drop.status === "Ended" ? t("mintStageEnded") : t("mintStageLive");
    els.countdown.textContent = "00:00:00.000";
    return;
  }
  els.countdownBlock.querySelector("span").textContent = t("mintOpensIn");
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const millis = Math.floor(diff % 1000);
  els.countdown.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${String(millis).padStart(3, "0")}`;
}

function applySuggestedGas(baseFeeWei) {
  if (state.gasEdited || !baseFeeWei) {
    return;
  }
  const baseFee = BigInt(baseFeeWei);
  const priority = parseGweiInput(els.priorityFeeInput.value || "0.05");
  const currentMax = parseGweiInput(els.maxFeeInput.value || "0");
  const minimumFastMax = parseGweiInput("2");
  const suggestedMax = maxBigInt(currentMax, maxBigInt(minimumFastMax, baseFee * 3n + priority));
  els.priorityFeeInput.value = formatGweiInput(priority);
  els.maxFeeInput.value = formatGweiInput(suggestedMax);
}

function parseGweiInput(value) {
  const [whole = "0", fraction = ""] = String(value).trim().split(".");
  const normalizedFraction = fraction.padEnd(9, "0").slice(0, 9);
  return BigInt(whole || "0") * 1_000_000_000n + BigInt(normalizedFraction || "0");
}

function formatGweiInput(wei) {
  const whole = wei / 1_000_000_000n;
  const fraction = (wei % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function maxBigInt(left, right) {
  return left > right ? left : right;
}

async function api(path, options = {}) {
  const url = new URL(path, window.location.origin);
  let response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers: { "content-type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    throw new Error(`Cannot reach local API at ${url.href}. Open the app from http://localhost:3000 and keep npm start running.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function checkRuntimeOrigin() {
  const allowed =
    window.location.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "3000";
  if (!allowed) {
    els.runtimeWarning.hidden = false;
    els.runtimeWarning.textContent = `${t("wrongRuntime")} Current URL: ${window.location.href}`;
  } else {
    els.runtimeWarning.hidden = true;
  }
}

function setStatus(nextState, message) {
  if (els.statePill) {
    els.statePill.textContent = nextState;
  }
  if (message) {
    const target = ["FAILED", "INSPECTING"].includes(nextState) ? els.analyzeStatus : els.settingsStatus;
    target.textContent = message;
    els.armStatus.textContent = ["ARMED", "WAITING", "BROADCASTING", "CONFIRMING", "COMPLETED"].includes(nextState) ? message : els.armStatus.textContent;
  }
}

function statusMessage(current) {
  return {
    WAITING: t("waitingStart"),
    BROADCASTING: t("broadcasting"),
    CONFIRMING: t("confirming"),
    COMPLETED: t("completed"),
    FAILED: t("failed")
  }[current] || current;
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  els.languageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.language === state.language);
  });
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  checkRuntimeOrigin();
  if (!state.results.length) {
    els.resultStatus.textContent = t("noExecution");
  }
}

function metric(label, value) {
  return `<div class="metric">${escapeHtml(String(label))}<strong>${escapeHtml(String(value))}</strong></div>`;
}

function weiToGwei(wei) {
  const whole = Number(wei) / 1e9;
  return `${whole.toFixed(4).replace(/\.?0+$/, "")} gwei`;
}

function weiToEth(wei) {
  const whole = Number(wei) / 1e18;
  return `${whole.toFixed(6).replace(/\.?0+$/, "")} ETH`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}
