// This controller only navigates fixed examples. It never reads or writes
// browser storage, imports backups, calls a backend or records a workout.
import { DAYS } from "./data.js";
import { newSession, queueFor } from "./model.js";
import { createViews } from "./views.js";

const ui = { route: "today", day: 0, phase: "work", completed: null };
const state = {
  versions: [{ name: "Ficha demonstrativa", days: DAYS }],
  settings: { stage: "full", sound: false },
  weights: {}, session: null,
};
let lastFocused = null;
let views;
const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");

function closeModal() {
  modalRoot.replaceChildren();
  app.inert = false;
  document.body.style.overflow = "";
  if (lastFocused?.isConnected) lastFocused.focus();
}
function openModal(title, body, className = "") {
  lastFocused = document.activeElement;
  app.inert = true;
  modalRoot.innerHTML = `<div class="overlay" data-overlay><section class="modal ${views.esc(className)}" role="dialog" aria-modal="true" aria-label="${views.esc(title)}"><div class="modal-top"><h2>${views.esc(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="Fechar">${views.icon("close")}</button></div>${body}</section></div>`;
  document.body.style.overflow = "hidden";
  modalRoot.querySelector("button").focus();
}

function sampleSession() {
  const session = newSession(DAYS[ui.day], DAYS[ui.day].exercises, "Ficha demonstrativa", "full", Date.now() - 180000);
  session.logs = [{ exIndex: 0, setIndex: 0, exerciseId: session.exercises[0].id, reps: "10", weight: "12" }];
  session.position = 1;
  if (ui.phase === "rest") {
    session.phase = "rest";
    session.restDeadline = Date.now() + 45000;
  }
  return session;
}

function historyView() {
  return `<div class="board-heading"><span class="eyebrow">Arquivo demonstrativo</span><h1>Um treino de cada vez.</h1><p>Abra os registros para conhecer a apresentação do histórico. Todos os exemplos abaixo são fictícios.</p></div><div class="demo-history">${[
    ["28", "Outubro", "Costas + Bíceps", "18:30"],
    ["27", "Outubro", "Peito + Ombros", "20:00"],
    ["26", "Outubro", "Pernas", "22:15"],
  ].map(([date, month, name, duration], index) => `<details class="demo-record"><summary><span class="demo-date"><b>${date}</b>${month}</span><span><strong>${name}</strong><small>4 séries · exemplo fictício</small></span><span>${duration}</span>${views.icon("chevron")}</summary><div class="demo-record-body"><p>Ficha demonstrativa · 2 movimentos · 4 séries</p>${DAYS[index].exercises.map((ex) => `<div><strong>${views.esc(ex.name)}</strong><span>1ª série: 10 repetições · 12 kg</span><span>2ª série: 10 repetições · 12 kg</span></div>`).join("")}</div></details>`).join("")}</div>`;
}

function scenarioNav() {
  return `<div class="demo-scenarios" role="group" aria-label="Telas da sessão"><span>Conheça as etapas</span>${[["work", "Série"], ["rest", "Descanso"], ["completed", "Conclusão"]].map(([phase, label]) => `<button data-action="scenario" data-phase="${phase}" aria-pressed="${ui.phase === phase}">${label}</button>`).join("")}<p>Prévia fixa. Nenhum treino é registrado.</p></div>`;
}

function render(focus = false) {
  state.session = sampleSession();
  ui.completed = { ...state.session, dayLabel: DAYS[ui.day].label, title: DAYS[ui.day].title, durationMs: 1110000, completedSets: 4, logs: queueFor(state.session).map((entry) => ({ ...entry, reps: "10", weight: "12" })) };
  const nav = (bottom = false) => `<nav class="${bottom ? "bottom-nav" : "nav"}" aria-label="${bottom ? "Navegação no celular" : "Navegação principal"}">${[["today", "Semana"], ["program", "Ficha"], ["history", "Registros"]].map(([route, label]) => `<button data-action="navigate" data-route="${route}" ${ui.route === route ? 'aria-current="page" class="active"' : ""}>${views.icon(route === "history" ? "history" : route === "program" ? "list" : "dumbbell")}<span>${label}</span></button>`).join("")}</nav>`;
  const content = ui.route === "today" ? views.todayView()
    : ui.route === "program" ? views.programView()
    : ui.route === "history" ? historyView()
    : scenarioNav() + (ui.phase === "completed" ? views.completedView() : views.activeView());
  app.innerHTML = `<a class="skip-link" href="#main-content">Pular para o conteúdo</a><div class="shell"><header class="masthead"><button class="brand" data-action="navigate" data-route="today" aria-label="Ritmo início"><svg class="brand-symbol" viewBox="0 0 36 36" aria-hidden="true"><path d="M4 26V10h7v16zM15 31V5h7v26zM26 26V10h7v16z" fill="currentColor"/></svg><span>ritmo</span></button>${nav()}<span class="demo-readonly">Somente consulta</span></header><main id="main-content" tabindex="-1" class="main ${ui.route === "active" ? "active-view" : ""}">${content}</main><footer class="site-footer"><span>Ritmo / demonstração de portfólio</span><span>Ficha e registros fictícios</span></footer>${nav(true)}</div>`;

  // The imported presentation is explicitly reduced to navigation and fixed
  // scenarios. Configuration and recording controls are removed, not hidden.
  const actions = new Set(["navigate", "day", "image-preview", "start", "scenario", "complete-set", "skip-rest", "end-session"]);
  app.querySelectorAll("[data-action]").forEach((button) => {
    if (!actions.has(button.dataset.action)) return button.remove();
    if (button.dataset.route === "editor") button.dataset.route = "program";
    if (button.dataset.action === "start") button.innerHTML = `Ver sessão de exemplo ${views.icon("arrow")}`;
    if (button.dataset.action === "complete-set") button.innerHTML = `Ver tela de descanso ${views.icon("arrow")}`;
    if (button.dataset.action === "skip-rest") button.innerHTML = `Ver conclusão ${views.icon("arrow")}`;
    if (button.dataset.action === "end-session") button.textContent = "Voltar à semana";
  });
  app.querySelector(".log-inputs")?.replaceWith(Object.assign(document.createElement("p"), { className: "demo-example", textContent: "Exemplo de registro: 12 kg · 10 repetições. Valores fixos." }));
  app.querySelector(".program-bottom")?.remove();
  app.querySelector(".session-insight")?.remove();
  app.querySelector(".progress-meta > span:nth-child(2)")?.remove();
  app.querySelector(".live-controls [data-live]")?.remove();
  app.querySelectorAll(".completion-receipt p").forEach((p) => {
    if (p.textContent.includes("histórico")) p.textContent = "Prévia de conclusão com dados fictícios. Nenhum registro foi salvo.";
  });
  app.querySelectorAll(".completion-receipt .eyebrow").forEach((el) => {
    if (el.textContent === "Seu registro") el.textContent = "Exemplo de registro";
  });
  if (focus) document.getElementById("main-content").focus({ preventScroll: true });
}

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-overlay]")) return closeModal();
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, route, phase, source } = button.dataset;
  if (action === "close-modal") return closeModal();
  if (action === "image-preview") return views.openExercisePreview(source, Number(button.dataset.index));
  if (action === "navigate" && ["today", "program", "history"].includes(route)) ui.route = route;
  else if (action === "day" && DAYS[Number(button.dataset.index)]) ui.day = Number(button.dataset.index);
  else if (action === "start") { ui.route = "active"; ui.phase = "work"; }
  else if (action === "scenario" && ["work", "rest", "completed"].includes(phase)) ui.phase = phase;
  else if (action === "complete-set") ui.phase = "rest";
  else if (action === "skip-rest") ui.phase = "completed";
  else if (action === "end-session") ui.route = "today";
  else return;
  render(action !== "day");
  if (action !== "day") window.scrollTo({ top: 0, behavior: "instant" });
});
document.addEventListener("keydown", (event) => {
  const modal = modalRoot.querySelector(".modal");
  if (!modal) return;
  if (event.key === "Escape") { event.preventDefault(); closeModal(); }
  if (event.key === "Tab") {
    const controls = [...modal.querySelectorAll("button, a[href]")];
    const next = event.shiftKey ? controls.at(-1) : controls[0];
    if (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) { event.preventDefault(); next.focus(); }
  }
});
try {
  const response = await fetch("./assets/exercise-art.json");
  if (!response.ok) throw new Error("Illustrations unavailable");
  views = createViews(state, ui, await response.json(), openModal);
  render();
} catch {
  app.innerHTML = '<p class="demo-loading">Não foi possível abrir a demonstração. Recarregue a página para tentar novamente.</p>';
}
