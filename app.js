const STORAGE_KEY = "daily-ledger-transactions-v1";
const NOTIFICATION_KEY = "daily-ledger-last-notified";
const MONTHLY_BUDGET = 8000;

const categoryMeta = {
  餐饮: { icon: "◌", className: "category-food", color: "#f36d5d" },
  交通: { icon: "↗", className: "category-transport", color: "#5a84d8" },
  购物: { icon: "◇", className: "category-shopping", color: "#8b78ce" },
  居住: { icon: "⌂", className: "category-living", color: "#2b9f7f" },
  娱乐: { icon: "✦", className: "category-fun", color: "#c99726" },
  健康: { icon: "+", className: "category-health", color: "#4d9e9d" },
  其他: { icon: "·", className: "category-other", color: "#8e8e93" }
};

const state = {
  selectedDate: todayISO(),
  showAll: false,
  transactions: loadTransactions()
};

const elements = {
  selectedDateButton: document.querySelector("#selected-date-button"),
  welcomeDate: document.querySelector("#welcome-date"),
  welcomeCopy: document.querySelector("#welcome-copy"),
  dayChipLabel: document.querySelector("#day-chip-label"),
  todayExpense: document.querySelector("#today-expense"),
  todayIncome: document.querySelector("#today-income"),
  monthExpense: document.querySelector("#month-expense"),
  monthAverage: document.querySelector("#month-average"),
  expenseComparison: document.querySelector("#expense-comparison"),
  monthTransactionCount: document.querySelector("#month-transaction-count"),
  monthBudgetRemaining: document.querySelector("#month-budget-remaining"),
  monthBudgetProgress: document.querySelector("#month-budget-progress"),
  monthBudgetCaption: document.querySelector("#month-budget-caption"),
  transactionsTitle: document.querySelector("#transactions-title"),
  transactionList: document.querySelector("#transaction-list"),
  digestTitle: document.querySelector("#digest-title"),
  digestCopy: document.querySelector("#digest-copy"),
  digestTotal: document.querySelector("#digest-total"),
  digestLargest: document.querySelector("#digest-largest"),
  categoryList: document.querySelector("#category-list"),
  transactionModal: document.querySelector("#transaction-modal"),
  transactionForm: document.querySelector("#transaction-form"),
  dateInput: document.querySelector("#date-input"),
  toast: document.querySelector("#toast")
};

function todayISO() {
  const date = new Date();
  return toISODate(date);
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function getDateInfo(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return {
    isoDate,
    date,
    isToday: isoDate === todayISO(),
    short: `${date.getMonth() + 1}月${date.getDate()}日`,
    long: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
  };
}

function formatMoney(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactMoney(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
}

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    console.warn("无法读取本地账单", error);
  }
  const today = todayISO();
  return [
    { id: crypto.randomUUID(), date: today, title: "精品咖啡", category: "餐饮", amount: 32, type: "expense", note: "上午的清醒" },
    { id: crypto.randomUUID(), date: today, title: "地铁通勤", category: "交通", amount: 6, type: "expense", note: "" },
    { id: crypto.randomUUID(), date: today, title: "自由职业收入", category: "其他", amount: 1800, type: "income", note: "项目结算" },
    { id: crypto.randomUUID(), date: shiftDate(today, -1), title: "晚餐", category: "餐饮", amount: 86, type: "expense", note: "" },
    { id: crypto.randomUUID(), date: shiftDate(today, -1), title: "书店购书", category: "购物", amount: 128, type: "expense", note: "" },
    { id: crypto.randomUUID(), date: shiftDate(today, -2), title: "网约车", category: "交通", amount: 31, type: "expense", note: "" },
    { id: crypto.randomUUID(), date: shiftDate(today, -2), title: "水果和食材", category: "居住", amount: 156, type: "expense", note: "" }
  ];
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

function getTransactionsForDate(date) {
  return state.transactions.filter((transaction) => transaction.date === date).sort((a, b) => a.id < b.id ? 1 : -1);
}

function getMonthTransactions(date) {
  const monthKey = date.slice(0, 7);
  return state.transactions.filter((transaction) => transaction.date.startsWith(monthKey));
}

function getTotals(transactions) {
  return transactions.reduce((totals, transaction) => {
    totals[transaction.type] += Number(transaction.amount);
    return totals;
  }, { expense: 0, income: 0 });
}

function render() {
  const info = getDateInfo(state.selectedDate);
  const dailyTransactions = getTransactionsForDate(state.selectedDate);
  const monthTransactions = getMonthTransactions(state.selectedDate);
  const dailyTotals = getTotals(dailyTransactions);
  const monthTotals = getTotals(monthTransactions);
  const previousTotals = getTotals(getTransactionsForDate(shiftDate(state.selectedDate, -1)));
  const recordedDays = new Set(monthTransactions.map((transaction) => transaction.date)).size;
  const average = recordedDays ? monthTotals.expense / recordedDays : 0;
  const remaining = Math.max(0, MONTHLY_BUDGET - monthTotals.expense);

  elements.selectedDateButton.textContent = info.isToday ? "今天" : info.short;
  elements.welcomeDate.textContent = info.long;
  elements.welcomeCopy.textContent = info.isToday ? "你的每一笔都已被温柔地整理好。" : "这是你在这一天留下的财务轨迹。";
  elements.todayExpense.textContent = formatMoney(dailyTotals.expense);
  elements.todayIncome.textContent = formatMoney(dailyTotals.income);
  elements.monthExpense.textContent = formatMoney(monthTotals.expense);
  elements.monthAverage.textContent = formatMoney(average);
  elements.monthTransactionCount.textContent = `${monthTransactions.length} 笔交易`;
  elements.expenseComparison.textContent = comparisonText(dailyTotals.expense, previousTotals.expense);
  elements.dayChipLabel.textContent = dailyTotals.expense === 0 ? "等待新的记录" : dailyTotals.expense <= 180 ? "今日状态良好" : "留意今日节奏";
  elements.monthBudgetRemaining.textContent = formatCompactMoney(remaining);
  elements.monthBudgetCaption.textContent = remaining > 0 ? "剩余可用预算" : "本月预算已用完";
  elements.monthBudgetProgress.style.width = `${Math.min(100, monthTotals.expense / MONTHLY_BUDGET * 100)}%`;
  elements.transactionsTitle.textContent = state.showAll ? `${info.short}附近的账单` : (info.isToday ? "今日账单" : `${info.short}账单`);

  const visibleTransactions = state.showAll
    ? [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
    : dailyTransactions;
  renderTransactions(visibleTransactions);
  renderDigest(dailyTransactions, dailyTotals, info);
  renderCategories(monthTransactions);
}

function comparisonText(current, previous) {
  if (current === 0 && previous === 0) return "较昨日 —";
  if (previous === 0) return "较昨日新增记录";
  const difference = ((current - previous) / previous) * 100;
  if (Math.abs(difference) < 1) return "与昨日基本持平";
  return `较昨日${difference > 0 ? "增加" : "减少"} ${Math.abs(difference).toFixed(0)}%`;
}

function renderTransactions(transactions) {
  if (!transactions.length) {
    elements.transactionList.innerHTML = `<div class="empty-state"><div><strong>这一天还没有账单</strong><p>记下第一笔，让今天有迹可循。</p></div></div>`;
    return;
  }
  elements.transactionList.innerHTML = transactions.map((transaction) => {
    const meta = categoryMeta[transaction.category] || categoryMeta.其他;
    const sign = transaction.type === "income" ? "+" : "−";
    const dateLabel = state.showAll ? `${getDateInfo(transaction.date).short} · ` : "";
    const note = transaction.note ? ` · ${escapeHTML(transaction.note)}` : "";
    return `<div class="transaction-item">
      <div class="transaction-icon ${meta.className}">${meta.icon}</div>
      <div class="transaction-copy">
        <p class="transaction-title">${escapeHTML(transaction.title)}</p>
        <p class="transaction-meta">${dateLabel}${escapeHTML(transaction.category)}${note}</p>
      </div>
      <strong class="transaction-amount ${transaction.type}">${sign}${formatMoney(transaction.amount)}</strong>
    </div>`;
  }).join("");
}

function renderDigest(transactions, totals, info) {
  const largestExpense = transactions.filter((transaction) => transaction.type === "expense").sort((a, b) => b.amount - a.amount)[0];
  elements.digestTitle.textContent = info.isToday ? "今天的账单已整理" : `${info.short}的账单已整理`;
  elements.digestCopy.textContent = transactions.length ? `今天记录了 ${transactions.length} 笔交易，生活的流向正在变得清晰。` : "记录每一笔，才能看见生活真正的流向。";
  elements.digestTotal.textContent = formatMoney(totals.expense);
  elements.digestLargest.textContent = largestExpense ? `${escapeHTML(largestExpense.title)} ${formatCompactMoney(largestExpense.amount)}` : "暂无";
}

function renderCategories(transactions) {
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const grouped = expenses.reduce((result, transaction) => {
    result[transaction.category] = (result[transaction.category] || 0) + Number(transaction.amount);
    return result;
  }, {});
  const total = expenses.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const rows = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!rows.length) {
    elements.categoryList.innerHTML = `<p class="transaction-meta">本月还没有可分析的支出。</p>`;
    return;
  }
  elements.categoryList.innerHTML = rows.map(([category, amount]) => {
    const meta = categoryMeta[category] || categoryMeta.其他;
    const percent = total ? amount / total * 100 : 0;
    return `<div class="category-row">
      <div class="category-label-row"><span>${category}</span><strong>${formatCompactMoney(amount)}</strong></div>
      <div class="category-bar"><span style="width:${percent}%; background:${meta.color}"></span></div>
    </div>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character]);
}

function openModal() {
  elements.transactionModal.hidden = false;
  elements.dateInput.value = state.selectedDate;
  requestAnimationFrame(() => document.querySelector("#amount-input").focus());
}

function closeModal() {
  elements.transactionModal.hidden = true;
  elements.transactionForm.reset();
  document.querySelectorAll(".segment").forEach((segment, index) => segment.classList.toggle("is-selected", index === 0));
}

function setSelectedDate(date) {
  state.selectedDate = date;
  state.showAll = false;
  render();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("is-visible"), 3000);
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("当前浏览器不支持系统通知");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    showToast("通知权限未开启，你仍可在页面内查看每日整理");
    return;
  }
  localStorage.setItem(NOTIFICATION_KEY, todayISO());
  const totals = getTotals(getTransactionsForDate(todayISO()));
  new Notification("今日账单已整理", { body: `今日支出 ${formatMoney(totals.expense)}，打开 Daily Ledger 查看详情。` });
  showToast("每日提醒已开启，今天的整理已发送");
}

function setupEvents() {
  document.querySelector("#previous-day").addEventListener("click", () => setSelectedDate(shiftDate(state.selectedDate, -1)));
  document.querySelector("#next-day").addEventListener("click", () => setSelectedDate(shiftDate(state.selectedDate, 1)));
  elements.selectedDateButton.addEventListener("click", () => setSelectedDate(todayISO()));
  document.querySelector("#add-transaction-button").addEventListener("click", openModal);
  document.querySelector("#close-modal-button").addEventListener("click", closeModal);
  document.querySelector("#cancel-modal-button").addEventListener("click", closeModal);
  document.querySelector("#notification-button").addEventListener("click", enableNotifications);
  document.querySelector("#digest-notification-button").addEventListener("click", enableNotifications);
  document.querySelector("#clear-filter-button").addEventListener("click", () => {
    state.showAll = !state.showAll;
    document.querySelector("#clear-filter-button").innerHTML = state.showAll ? '仅看当天 <span aria-hidden="true">→</span>' : '查看全部 <span aria-hidden="true">→</span>';
    showToast(state.showAll ? "已切换到当天记录" : "已回到当天视图");
    render();
  });

  document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((navItem) => navItem.classList.remove("is-active"));
    item.classList.add("is-active");
    const view = item.dataset.view;
    if (view === "ledger") document.querySelector("#transactions-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    if (view === "insights") document.querySelector("#insights-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    if (view === "overview") window.scrollTo({ top: 0, behavior: "smooth" });
  }));

  document.querySelectorAll('.segment input').forEach((input) => input.addEventListener("change", () => {
    document.querySelectorAll(".segment").forEach((segment) => segment.classList.toggle("is-selected", segment.querySelector("input").checked));
  }));

  elements.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.transactionForm);
    const transaction = {
      id: crypto.randomUUID(),
      date: formData.get("date"),
      title: formData.get("title").trim(),
      category: formData.get("category"),
      amount: Number(formData.get("amount")),
      type: formData.get("type"),
      note: formData.get("note").trim()
    };
    if (!transaction.title || !transaction.amount || transaction.amount <= 0) return;
    state.transactions.push(transaction);
    saveTransactions();
    state.selectedDate = transaction.date;
    closeModal();
    render();
    showToast("账单已保存，今日总结已更新");
  });

  elements.transactionModal.addEventListener("click", (event) => {
    if (event.target === elements.transactionModal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.transactionModal.hidden) closeModal();
  });
}

setupEvents();
render();
