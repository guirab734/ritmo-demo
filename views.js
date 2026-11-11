// Presentation functions from Ritmo. No original controller or personal plans.
import { currentSet, queueFor, elapsedMs, restRemainingSec, initialDurationSec, estimateRemainingSec } from './model.js';
export function createViews(state, ui, artManifest, openModal) {
const version = () => state.versions[0];
const day = () => version().days[ui.day];
const exercises = () => day().exercises;
const planGuidance = () => '';
const planUpdateNotice = () => '';
const averageLabel = () => 'Exemplo fictício';
const icons = {
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6h1M3 12h1M3 18h1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6M12 7v5l3 2"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M10.5 7.5v6M7.5 10.5h6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  sound:
    '<path d="m11 4-5 4H3v8h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-5 4H3v8h3l5 4zM16 9l5 6m-5 0 5-6"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  undo: '<path d="M9 5 3 11l6 6M3 11h11a6 6 0 0 1 0 12"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8L21 9h-8z"/>',
  flag: '<path d="M5 22V3c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>',
  screen:
    '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
  save: '<path d="M4 3h13l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.dumbbell}</svg>`;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const duration = (ms) => {
  const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  return s >= 3600
    ? `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}`
    : `${pad(s / 60)}:${pad(s % 60)}`;
};
const minLabel = (seconds) => `${Math.max(1, Math.round(seconds / 60))} min`;
const restLabel = (sec) => (sec % 60 === 0 ? `${sec / 60} min` : `${sec} s`);
const timeOf = (stamp) =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(stamp);
const stageLabel = (value) =>
  ({
    return1: "Retomada · semana 1",
    return2: "Retomada · semana 2",
    full: "Ficha completa",
  })[value] || "Ficha completa";
function art(ex) {
  if (ex.art?.src)
    return `<div class="art standalone"><img src="${esc(ex.art.src)}" alt="Ilustração de ${esc(ex.name)}" loading="lazy"></div>`;
  const sheet = artManifest?.sheets?.[ex.art?.sheet],
    crop = sheet?.rows?.[ex.art?.row];
  if (sheet && crop)
    return `<div class="art"><svg viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" role="img" aria-label="Ilustração de ${esc(ex.name)}" preserveAspectRatio="xMidYMid meet"><image href="${esc(sheet.src)}" x="0" y="0" width="${sheet.width}" height="${sheet.height}"/></svg></div>`;
  return `<div class="art fallback" role="img" aria-label="${esc(ex.name)}: consulte a orientação abaixo">${icon("dumbbell")}</div>`;
}
function previewArt(ex, index) {
  return `<button type="button" class="art-preview" data-action="image-preview" data-source="session" data-index="${index}" aria-haspopup="dialog" aria-label="Ampliar ilustração de ${esc(ex.name)}">${art(ex)}<span class="art-preview-label">${icon("zoom")}Ampliar imagem</span></button>`;
}
function openExercisePreview(source, index) {
  const ex = (source === "session" ? state.session?.exercises : exercises())?.[
    index
  ];
  if (!ex) return;
  const hasArt =
    ex.art?.src || artManifest?.sheets?.[ex.art?.sheet]?.rows?.[ex.art?.row];
  openModal(
    ex.name,
    `<div class="exercise-image-preview">${hasArt ? art(ex) : '<div class="help-box">Este exercício ainda não tem uma ilustração. Consulte a orientação abaixo.</div>'}</div><p class="preview-muscle">${esc(ex.muscle)}</p><div class="ex-chips"><span class="chip">${ex.sets} séries × ${esc(ex.reps)}</span><span class="chip">${icon("clock")}${restLabel(ex.restSec)}</span></div><div class="preview-instructions"><p><b>Execução:</b> ${esc(ex.cue)}</p>${ex.effort ? `<p><b>Esforço:</b> ${esc(ex.effort)}</p>` : ""}${ex.role ? `<p><b>Papel na ficha:</b> ${esc(ex.role)}</p>` : ""}<p><b>Também participam:</b> ${esc(ex.secondary || "Músculos estabilizadores do movimento.")}</p>${ex.note ? `<p><b>Observação:</b> ${esc(ex.note)}</p>` : ""}</div><button type="button" class="btn outline full" data-action="close-modal">Fechar imagem</button>`,
    "image-preview-modal",
  );
}
function dayTabs() {
  return (
    '<div class="day-tabs" role="group" aria-label="Escolher sessão">' +
    version()
      .days.map(
        (d, i) =>
          '<button class="day-tab ' +
          (ui.day === i ? "selected" : "") +
          '" data-action="day" data-index="' +
          i +
          '" aria-pressed="' +
          (ui.day === i) +
          '" aria-label="' +
          esc(d.label + ": " + d.title) +
          '"><span>' +
          esc(d.short) +
          "</span><small>" +
          pad(i + 1) +
          "</small></button>",
      )
      .join("") +
    "</div>"
  );
}
function exerciseCard(ex, index, session = null) {
  const done = session
      ? session.logs.filter((x) => x.exIndex === index).length
      : 0,
    current = session && currentSet(session)?.exIndex === index;
  return (
    '<article class="movement-tile ' +
    (current ? "current" : "") +
    '"><button class="movement-button" data-action="image-preview" data-source="' +
    (session ? "session" : "plan") +
    '" data-index="' +
    index +
    '" aria-haspopup="dialog" aria-label="Ver imagem e execução de ' +
    esc(ex.name) +
    '"><span class="movement-top"><span class="movement-index">' +
    pad(index + 1) +
    "</span><span>" +
    (done === ex.sets
      ? "Concluído"
      : session
        ? done + "/" + ex.sets + " séries"
        : "Ver execução") +
    icon(done === ex.sets ? "check" : "zoom") +
    "</span></span>" +
    art(ex) +
    '<span class="movement-info"><strong>' +
    esc(ex.name) +
    '</strong><span class="muscle">' +
    esc(ex.muscle) +
    '</span><span class="movement-prescription"><b>' +
    ex.sets +
    " × " +
    esc(ex.reps) +
    "</b><span>" +
    restLabel(ex.restSec) +
    " de descanso</span></span></span></button></article>"
  );
}
function todayView() {
  const exs = exercises(),
    d = day(),
    eta = initialDurationSec(exs),
    groups = d.title.split(" · ")[0].split(" + "),
    today = Math.max(0, Math.min(4, new Date().getDay() - 1));
  const heading = groups[0],
    support = groups.slice(1).join(" + "),
    secondary = d.title.split(" · ").slice(1).join(" · "),
    first = exs[0];
  return (
    '<div class="program-heading"><div><span class="eyebrow">Segunda a sexta</span><h1>Sua semana.</h1></div><button class="version-link" data-action="navigate" data-route="editor">' +
    icon("layers") +
    esc(version().name) +
    icon("arrow") +
    '</button></div><div class="mobile-week">' +
    dayTabs() +
    '</div><div class="session-mural" style="--selected-day:' +
    ui.day +
    '">' +
    version()
      .days.map((entry, i) => {
        const selected = i === ui.day,
          parts = entry.title.split(" · ")[0].split(" + ");
        if (!selected)
          return (
            '<button class="session-spine" data-action="day" data-index="' +
            i +
            '" aria-expanded="false" aria-controls="selected-session" aria-label="Abrir ' +
            esc(entry.label + ": " + entry.title) +
            '"><span class="spine-day"><span>' +
            esc(entry.short) +
            "</span>" +
            icon("plus") +
            '</span><span class="spine-title">' +
            parts.map((x) => "<span>" + esc(x) + "</span>").join("") +
            '</span><span class="spine-bottom"><span>' +
            pad(i + 1) +
            "</span>" +
            "</span></button>"
          );
        return (
          '<section class="session-open" id="selected-session" aria-labelledby="session-heading"><div class="session-cover-top"><span>' +
          (i === today ? "Hoje / " : "") +
          esc(entry.label) +
          "</span><span>Sessão " +
          pad(i + 1) +
          " / " +
          pad(version().days.length) +
          '</span></div><div class="session-cover-heading"><h2 id="session-heading" tabindex="-1">' +
          esc(heading) +
          "</h2>" +
          (support ? "<p>" + esc(support) + "</p>" : "") +
          (secondary ? "<small>" + esc(secondary) + "</small>" : "") +
          '</div><button class="cover-art" data-action="image-preview" data-source="plan" data-index="0" aria-label="Ampliar imagem de ' +
          esc(first.name) +
          '">' +
          art(first) +
          "<span>" +
          icon("zoom") +
          '</span></button><div class="cover-movement"><span>Primeiro movimento</span><strong>' +
          esc(first.name) +
          "</strong><p>" +
          first.sets +
          " séries × " +
          esc(first.reps) +
          " <span> / </span> " +
          restLabel(first.restSec) +
          ' de descanso</p></div><div class="cover-actions"><button class="btn cover-start" data-action="start">' +
          (state.session ? "Continuar treino" : "Iniciar treino") +
          icon("arrow") +
          '</button><button class="cover-board" data-action="navigate" data-route="program">Ver os ' +
          exs.length +
          " movimentos " +
          icon("list") +
          '</button></div><div class="cover-meta"><span>' +
          exs.reduce((n, e) => n + e.sets, 0) +
          " séries de trabalho</span><span>~" +
          minLabel(eta) +
          "</span></div></section>"
        );
      })
      .join("") +
    '</div><div class="program-bottom"><button class="link-btn" data-action="volume">' +
    icon("settings") +
    esc(stageLabel(state.settings.stage)) +
    icon("chevron") +
    '</button><p>Aqueça antes das séries de trabalho.</p><button class="link-btn" data-action="read-plan-guide">Como progredir ' +
    icon("arrow") +
    "</button></div>" +
    (state.planNotice?.type === "activated" ? planUpdateNotice() : "")
  );
}
function programView() {
  const d = day(),
    exs = exercises();
  return (
    '<div class="board-top"><button class="link-btn" data-action="navigate" data-route="today">' +
    icon("arrow", "back-arrow") +
    'Voltar à semana</button><button class="btn" data-action="start">' +
    (state.session ? "Continuar treino" : "Iniciar treino") +
    icon("arrow") +
    '</button></div><div class="board-heading"><span class="eyebrow">' +
    esc(d.label) +
    " / " +
    esc(stageLabel(state.settings.stage)) +
    "</span><h1>" +
    esc(d.title) +
    "</h1><p>" +
    exs.length +
    " movimentos · " +
    exs.reduce((n, e) => n + e.sets, 0) +
    " séries de trabalho · ~" +
    minLabel(initialDurationSec(exs)) +
    "</p></div>" +
    dayTabs() +
    '<div class="movement-grid">' +
    exs.map((e, i) => exerciseCard(e, i)).join("") +
    "</div>" +
    planGuidance()
  );
}
function activeView() {
  const s = state.session;
  if (!s) {
    ui.route = "today";
    return todayView();
  }
  const info = currentSet(s),
    e = info.exercise,
    q = queueFor(s),
    rest = s.phase === "rest",
    paused = s.pausedAt !== null,
    done = s.logs.length,
    value = state.weights[e.id] ?? "";
  const phase = paused
    ? "Treino pausado"
    : rest
      ? "Recuperação"
      : "Em movimento";
  return (
    '<div class="live-header"><div><span class="eyebrow">' +
    esc(s.dayLabel) +
    " / exercício " +
    pad(info.exIndex + 1) +
    " de " +
    pad(s.exercises.length) +
    "</span><h1>" +
    esc(e.name) +
    '</h1></div><div class="live-controls"><span class="live-phase" role="status">' +
    phase +
    '</span><span data-live="elapsed">' +
    duration(elapsedMs(s)) +
    '</span><button class="icon-btn" data-action="pause" aria-label="' +
    (paused ? "Retomar" : "Pausar") +
    ' treino">' +
    icon(paused ? "play" : "pause") +
    '</button></div></div><section class="training-stage ' +
    (rest ? "is-rest" : "") +
    " " +
    (paused ? "is-paused" : "") +
    '" id="session-timer" data-series-key="' +
    s.startedAt +
    "-" +
    s.position +
    "-" +
    s.phase +
    '" aria-label="Série atual"><div class="stage-visual">' +
    (rest
      ? '<div class="rest-display"><span class="eyebrow">' +
        (paused ? "Descanso pausado" : "Respire. Recupere.") +
        '</span><strong data-live="main-timer">' +
        duration(restRemainingSec(s) * 1000) +
        '</strong><p>até a próxima série</p><span class="rest-sound">' +
        icon(state.settings.sound ? "sound" : "mute") +
        (state.settings.sound
          ? "Aviso sonoro ativado"
          : "Aviso sonoro desativado") +
        "</span></div>"
      : '<div class="focus-art">' + previewArt(e, info.exIndex) + "</div>") +
    '<div class="stage-foot"><span>' +
    esc(e.muscle) +
    '</span><button class="link-btn" data-action="image-preview" data-source="session" data-index="' +
    info.exIndex +
    '">Ver execução ' +
    icon("zoom") +
    '</button></div></div><div class="exercise-console"><div class="console-heading"><span class="eyebrow">' +
    (rest ? "A seguir" : "Sua série") +
    '</span><span class="set-circles" aria-label="Série ' +
    (info.setIndex + 1) +
    " de " +
    e.sets +
    '">' +
    Array.from(
      { length: e.sets },
      (_, i) =>
        '<span class="set-circle ' +
        (i < info.setIndex ? "done" : i === info.setIndex ? "now" : "") +
        '">' +
        (i < info.setIndex ? icon("check") : i + 1) +
        "</span>",
    ).join("") +
    '</span></div><div class="rep-target"><strong>' +
    esc(e.reps) +
    "</strong><span>" +
    (e.logUnit === "seconds" ? "segundos por lado" : "repetições") +
    "</span></div>" +
    (rest
      ? '<p class="next-set-label"><strong>Próxima: série ' +
        (info.setIndex + 1) +
        " de " +
        e.sets +
        "</strong></p>"
      : "") +
    (paused
      ? '<p class="paused-note">O tempo e o descanso estão pausados.</p>'
      : "") +
    (ui.ready && !rest && !paused
      ? '<p class="timer-complete-banner" role="status">Descanso concluído. Pode começar.</p>'
      : "") +
    (!rest
      ? '<p class="effort-note">' +
        esc(e.effort || "Mantenha a amplitude e a execução controlada.") +
        '</p><div class="log-inputs"><div><label for="log-weight">Carga · kg <small>opcional</small></label><input id="log-weight" inputmode="decimal" type="number" min="0" max="2000" step="0.5" placeholder="—" value="' +
        esc(value) +
        '" ' +
        (paused ? "disabled" : "") +
        '></div><div><label for="log-reps">' +
        (e.logUnit === "seconds" ? "Segundos" : "Repetições") +
        ' <small>opcional</small></label><input id="log-reps" inputmode="numeric" type="number" min="1" max="500" step="1" placeholder="' +
        esc(e.reps) +
        '" ' +
        (paused ? "disabled" : "") +
        "></div></div>"
      : "") +
    '<button class="btn full session-main-action" data-action="' +
    (rest ? "skip-rest" : "complete-set") +
    '" ' +
    (paused ? "disabled" : "") +
    ">" +
    icon(rest ? "arrow" : "check") +
    (rest ? "Pular descanso" : "Concluir série") +
    '</button><details class="coaching-details" id="coaching-details"><summary>Técnica e orientações ' +
    icon("plus") +
    '</summary><div class="coaching-body"><p>' +
    esc(e.cue) +
    "</p>" +
    (e.role ? "<p>" + esc(e.role) + "</p>" : "") +
    (e.note ? "<p>" + esc(e.note) + "</p>" : "") +
    '<p>Nos halteres, registre o peso de cada halter.</p></div></details></div></section><div class="session-progress"><div class="progress-track" role="progressbar" aria-label="Séries concluídas" aria-valuenow="' +
    done +
    '" aria-valuemin="0" aria-valuemax="' +
    q.length +
    '"><i style="width:' +
    (done / q.length) * 100 +
    '%"></i></div><div class="progress-meta"><span><b>' +
    done +
    " / " +
    q.length +
    '</b> séries concluídas</span><span>Término estimado <strong data-live="eta">' +
    (paused ? "Pausado" : timeOf(Date.now() + estimateRemainingSec(s) * 1000)) +
    '</strong> · <span data-live="remaining">~' +
    minLabel(estimateRemainingSec(s)) +
    '</span></span><div><button class="link-btn" data-action="undo" ' +
    (done ? "" : "disabled") +
    ">" +
    icon("undo") +
    'Desfazer</button><button class="link-btn danger" data-action="end-session">Encerrar treino</button></div></div></div><p class="session-insight">Média deste dia: <strong>' +
    averageLabel(s.dayId) +
    '</strong></p><details class="session-sequence" id="session-sequence"><summary><span>Sequência do treino <small>' +
    s.exercises.length +
    " movimentos</small></span>" +
    icon("plus") +
    '</summary><div class="movement-grid">' +
    s.exercises.map((ex, i) => exerciseCard(ex, i, s)).join("") +
    "</div></details>"
  );
}
function completedView() {
  const s = ui.completed;
  if (!s) {
    ui.route = "history";
    return historyView();
  }
  return (
    '<section class="completion-receipt"><div class="receipt-heading"><span class="receipt-check">' +
    icon("check") +
    '</span><span class="eyebrow">' +
    (s.partial ? "Sessão encerrada" : "Treino concluído") +
    "</span><h1>" +
    (s.partial ? "Progresso salvo." : "Feito por hoje.") +
    "</h1><p>" +
    esc(s.dayLabel) +
    "<br>" +
    esc(s.title) +
    '</p></div><div class="receipt-record"><span class="eyebrow">Seu registro</span><dl><div><dt>Tempo de treino</dt><dd>' +
    duration(s.durationMs) +
    "</dd></div><div><dt>Séries concluídas</dt><dd>" +
    s.completedSets +
    "</dd></div><div><dt>Movimentos realizados</dt><dd>" +
    new Set(s.logs.map((x) => x.exIndex)).size +
    '</dd></div></dl><p>As séries e cargas registradas estão no seu histórico.</p><button class="btn full" data-action="navigate" data-route="history">Ver meu histórico ' +
    icon("arrow") +
    '</button><button class="link-btn" data-action="navigate" data-route="today">Voltar aos treinos</button></div></section>'
  );
}
return { todayView, programView, activeView, completedView, openExercisePreview, icon, esc, duration };
}
