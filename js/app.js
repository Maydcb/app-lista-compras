(function () {
  "use strict";
  var ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  };
  var COMMON = [
    "Arroz",
    "Feijão",
    "Macarrão",
    "Açúcar",
    "Café",
    "Sal",
    "Óleo",
    "Azeite",
    "Farinha de trigo",
    "Molho de tomate",
    "Leite",
    "Manteiga",
    "Queijo",
    "Presunto",
    "Iogurte",
    "Requeijão",
    "Ovos",
    "Pão de forma",
    "Biscoito",
    "Carne",
    "Frango",
    "Linguiça",
    "Batata",
    "Cebola",
    "Alho",
    "Tomate",
    "Alface",
    "Cenoura",
    "Banana",
    "Maçã",
    "Laranja",
    "Limão",
    "Detergente",
    "Sabão em pó",
    "Amaciante",
    "Água sanitária",
    "Desinfetante",
    "Esponja",
    "Papel higiênico",
    "Papel toalha",
    "Saco de lixo",
    "Sabonete",
    "Shampoo",
    "Condicionador",
    "Pasta de dente",
    "Desodorante",
  ];

  var S = {
    templates: {},
    lists: {},
    view: "home",
    tab: "lists",
    openId: null,
    filter: "all",
    editItems: false,
    loaded: false,
    mode: "starting",
    readOnly: false,
    note: "",
  };
  var db = null;
  var LS_KEY = "lista-compras-v1";
  var $app = document.getElementById("app");
  var $modal = document.getElementById("modal");

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }
  function str(v, max) {
    if (typeof v === "number") v = String(v);
    return typeof v === "string" ? v.slice(0, max || 200) : "";
  }
  function num(v) {
    return typeof v === "number" && isFinite(v) ? v : 0;
  }
  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }
  function qnum(s) {
    s = String(s || "")
      .trim()
      .replace(",", ".");
    if (!s) return null;
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function isPick(it) {
    var n = qnum(it.get);
    return String(it.get || "").trim() !== "" && n !== 0;
  }
  function fmtDate(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }
  function today() {
    try {
      return new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function cleanList(d) {
    d = d || {};
    return {
      name: str(d.name, 120) || "Lista",
      templateId: str(d.templateId, 80),
      createdAt: num(d.createdAt),
      updatedAt: num(d.updatedAt),
      items: Array.isArray(d.items)
        ? d.items
            .filter(function (o) {
              return o && typeof o === "object";
            })
            .slice(0, 1000)
            .map(function (o) {
              return {
                id: str(o.id, 40) || uid(),
                name: str(o.name),
                have: str(o.have, 20),
                get: str(o.get, 20),
                done: !!o.done,
              };
            })
        : [],
    };
  }
  function cleanTpl(d) {
    d = d || {};
    return {
      name: str(d.name, 120) || "Modelo",
      createdAt: num(d.createdAt),
      updatedAt: num(d.updatedAt),
      items: Array.isArray(d.items)
        ? d.items
            .filter(function (o) {
              return o && typeof o === "object";
            })
            .slice(0, 1000)
            .map(function (o) {
              return { id: str(o.id, 40) || uid(), name: str(o.name) };
            })
        : [],
    };
  }
  function listStats(l) {
    var total = l.items.length,
      pick = 0,
      done = 0,
      donePick = 0;
    l.items.forEach(function (it) {
      var p = isPick(it);
      if (p) pick++;
      if (it.done) {
        done++;
        if (p) donePick++;
      }
    });
    var base = pick > 0 ? pick : total,
      got = pick > 0 ? donePick : done;
    return {
      total: total,
      pick: pick,
      done: done,
      base: base,
      got: got,
      pct: base ? Math.round((got / base) * 100) : 0,
    };
  }
  function isComplete(l) {
    var st = listStats(l);
    return st.base > 0 && st.got === st.base;
  }
  function toast(msg) {
    [].forEach.call(document.querySelectorAll(".toast"), function (x) {
      x.remove();
    });
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 2200);
  }

  /* ---------- storage ---------- */
  function lsLoad() {
    try {
      var r = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (r) {
        Object.keys(r.templates || {}).forEach(function (k) {
          S.templates[k] = cleanTpl(r.templates[k]);
        });
        Object.keys(r.lists || {}).forEach(function (k) {
          S.lists[k] = cleanList(r.lists[k]);
        });
      }
    } catch (e) {}
  }
  function lsSave() {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ templates: S.templates, lists: S.lists }),
      );
    } catch (e) {}
  }

  var timers = {},
    inflight = {},
    dirty = {},
    deleted = {};
  function busy(key) {
    return !!(dirty[key] || inflight[key] || timers[key]);
  }
  function markDirty(kind, id) {
    var d = S[kind][id];
    if (!d) return;
    d.updatedAt = Date.now();
    if (S.mode !== "db") {
      lsSave();
      return;
    }
    var key = kind + "/" + id;
    dirty[key] = true;
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function () {
      timers[key] = null;
      flush(kind, id, 0);
    }, 450);
    syncStatus();
  }
  function flush(kind, id, attempt) {
    var key = kind + "/" + id;
    if (inflight[key] || !dirty[key]) {
      syncStatus();
      return;
    }
    var d = S[kind][id];
    dirty[key] = false;
    if (!d) {
      syncStatus();
      return;
    }
    inflight[key] = true;
    syncStatus();
    db.collection(kind)
      .doc(id)
      .set(clone(d))
      .then(
        function () {
          inflight[key] = false;
          if (dirty[key]) flush(kind, id, 0);
          else syncStatus();
        },
        function (e) {
          inflight[key] = false;
          var code = e && e.code;
          if (code === "unavailable" && attempt < 1) {
            dirty[key] = true;
            setTimeout(
              function () {
                flush(kind, id, attempt + 1);
              },
              700 + Math.random() * 800,
            );
            return;
          }
          if (code === "invalid_argument" || code === "not_granted") {
            S.readOnly = true;
            S.note =
              "Você pode ver estas listas, mas não tem permissão para editá-las.";
          } else if (code === "quota_exceeded") {
            S.note =
              "O espaço de armazenamento está cheio. Exclua listas antigas para continuar salvando.";
            dirty[key] = true;
          } else {
            S.note =
              "Não consegui salvar a última alteração. Verifique a conexão e tente de novo.";
            dirty[key] = true;
          }
          render();
        },
      );
  }
  function removeDoc(kind, id) {
    var key = kind + "/" + id;
    clearTimeout(timers[key]);
    timers[key] = null;
    dirty[key] = false;
    delete S[kind][id];
    if (S.mode !== "db") {
      lsSave();
      return;
    }
    deleted[key] = true;
    db.collection(kind)
      .doc(id)
      .delete()
      .catch(function (e) {
        if (e && e.code === "invalid_argument") {
          S.readOnly = true;
          S.note = "Você não tem permissão para editar estas listas.";
          render();
        }
      });
  }
  function syncStatus() {
    var el = document.getElementById("sync");
    if (!el) return;
    var pending =
      Object.keys(dirty).some(function (k) {
        return dirty[k];
      }) ||
      Object.keys(inflight).some(function (k) {
        return inflight[k];
      });
    el.textContent =
      S.mode === "db"
        ? S.readOnly
          ? "Somente leitura"
          : pending
            ? "Salvando…"
            : "Salvo"
        : S.mode === "local"
          ? "Neste aparelho"
          : "";
  }

  /* ---------- init ---------- */
  function useLocal(note) {
    S.mode = "local";
    lsLoad();
    S.loaded = true;
    if (note) S.note = note;
    render();
  }
  function init() {
    render();
    if (!window.claude || typeof window.claude.use !== "function") {
      useLocal("");
      return;
    }
    window.claude.use("db").then(
      function (d) {
        if (!d) {
          useLocal(
            "Entre na sua conta para sincronizar entre aparelhos. Por enquanto, as listas ficam salvas só neste navegador.",
          );
          return;
        }
        db = d;
        S.mode = "db";
        subscribe();
      },
      function () {
        useLocal("");
      },
    );
  }
  function subscribe() {
    var got = { templates: false, lists: false };
    var loadTimer = setTimeout(function () {
      if (!S.loaded) {
        S.loaded = true;
        S.note =
          "Ainda não consegui carregar suas listas. Verifique a conexão.";
        scheduleRender();
      }
    }, 10000);
    ["templates", "lists"].forEach(function (kind) {
      db.collection(kind).onSnapshot(
        function (snap) {
          applySnap(kind, snap);
          if (!snap.metadata.fromCache) got[kind] = true;
          if (got.templates && got.lists && !S.loaded) {
            S.loaded = true;
            clearTimeout(loadTimer);
          }
          if (got.templates && got.lists && /carregar/.test(S.note))
            S.note = "";
          scheduleRender();
        },
        function (e) {
          clearTimeout(loadTimer);
          S.loaded = true;
          S.note =
            (e && e.code) === "revoked"
              ? "O acesso a estas listas não está disponível agora."
              : "A sincronização parou. Recarregue a página para tentar de novo.";
          scheduleRender();
        },
      );
    });
  }
  function applySnap(kind, snap) {
    var seen = {};
    snap.docs.forEach(function (doc) {
      if (!doc.exists) return;
      var key = kind + "/" + doc.id;
      seen[doc.id] = true;
      if (busy(key) || deleted[key]) return;
      S[kind][doc.id] =
        kind === "lists" ? cleanList(doc.data()) : cleanTpl(doc.data());
    });
    if (!snap.metadata.fromCache) {
      Object.keys(S[kind]).forEach(function (id) {
        if (!seen[id] && !busy(kind + "/" + id)) delete S[kind][id];
      });
    }
  }

  /* ---------- rendering ---------- */
  var pendingRender = false;
  function editing() {
    var a = document.activeElement;
    return (
      a &&
      $app.contains(a) &&
      (a.tagName === "INPUT" || a.tagName === "TEXTAREA")
    );
  }
  function scheduleRender() {
    if (editing() || $modal.firstChild) {
      pendingRender = true;
      return;
    }
    render();
  }
  document.addEventListener("focusout", function () {
    setTimeout(function () {
      if (pendingRender && !editing() && !$modal.firstChild) {
        pendingRender = false;
        render();
      }
    }, 0);
  });

  function header(title, back, menu, renameAct) {
    var t =
      renameAct && !S.readOnly
        ? '<h1><button class="titlebtn" data-act="' +
          renameAct +
          '" title="Renomear"><span>' +
          esc(title) +
          "</span>" +
          ICON.pen +
          "</button></h1>"
        : "<h1>" + esc(title) + "</h1>";
    return (
      '<header class="top">' +
      (back
        ? '<button class="iconbtn" data-act="back" aria-label="Voltar">' +
          ICON.back +
          "</button>"
        : "") +
      t +
      '<span class="sync" id="sync"></span>' +
      (menu
        ? '<button class="iconbtn" data-act="' +
          menu +
          '" aria-label="Mais opções">' +
          ICON.more +
          "</button>"
        : "") +
      "</header>" +
      (S.note ? '<div class="note">' + esc(S.note) + "</div>" : "")
    );
  }
  function render() {
    pendingRender = false;
    if (S.view === "list" && !S.lists[S.openId]) S.view = "home";
    if (S.view === "tpl" && !S.templates[S.openId]) S.view = "home";
    var h =
      S.view === "list"
        ? viewList()
        : S.view === "tpl"
          ? viewTpl()
          : viewHome();
    $app.innerHTML = h;
    syncStatus();
  }
  function sortedIds(kind) {
    return Object.keys(S[kind]).sort(function (a, b) {
      var A = S[kind][a],
        B = S[kind][b];
      return kind === "lists"
        ? B.createdAt - A.createdAt
        : A.name.localeCompare(B.name, "pt-BR");
    });
  }
  function viewHome() {
    var h = header("Lista de Compras");
    var nl = Object.keys(S.lists).length,
      nt = Object.keys(S.templates).length;
    h +=
      '<div class="hometabs"><div class="seg">' +
      '<button data-act="tab" data-v="lists" class="' +
      (S.tab === "lists" ? "on" : "") +
      '">Listas<b>' +
      nl +
      "</b></button>" +
      '<button data-act="tab" data-v="templates" class="' +
      (S.tab === "templates" ? "on" : "") +
      '">Modelos<b>' +
      nt +
      "</b></button></div>" +
      (S.readOnly
        ? ""
        : S.tab === "lists"
          ? '<button class="btn primary" data-act="new-list">+ Nova lista</button>'
          : '<button class="btn primary" data-act="new-tpl">+ Novo modelo</button>') +
      "</div>";
    if (!S.loaded && S.mode !== "local")
      return h + '<div class="loading">Carregando…</div>';
    if (S.tab === "lists") {
      if (!nl) {
        h +=
          '<div class="empty"><p>' +
          (nt
            ? "Nenhuma lista ainda. Gere uma a partir de um modelo."
            : "Comece criando um <b>modelo</b> com tudo o que você costuma comprar. Depois é só gerar uma lista nova a cada ida ao mercado.") +
          "</p>" +
          (S.readOnly
            ? ""
            : nt
              ? '<button class="btn primary" data-act="new-list">+ Nova lista</button>'
              : '<button class="btn primary" data-act="new-tpl">Criar meu modelo</button>') +
          "</div>";
      } else {
        var nDone = Object.keys(S.lists).filter(function (id) {
          return isComplete(S.lists[id]);
        }).length;
        if (nDone && !S.readOnly)
          h +=
            '<div class="donebar"><span>' +
            nDone +
            " lista" +
            (nDone > 1 ? "s" : "") +
            " concluída" +
            (nDone > 1 ? "s" : "") +
            '</span><button class="btn small danger" data-act="del-done">Excluir concluídas</button></div>';
        h +=
          '<div class="cards">' +
          sortedIds("lists")
            .map(function (id) {
              var l = S.lists[id],
                st = listStats(l),
                tpl = S.templates[l.templateId];
              var sub =
                st.pick > 0
                  ? st.got + " de " + st.pick + " no carrinho"
                  : st.total + " itens · nenhuma quantidade em “Pegar”";
              return (
                '<div class="card" role="button" tabindex="0" data-act="open-list" data-id="' +
                esc(id) +
                '"><div class="t"><span>' +
                esc(l.name) +
                "</span>" +
                '<span class="cardr">' +
                (isComplete(l) ? '<span class="tag">Concluída</span>' : "") +
                (S.readOnly
                  ? ""
                  : '<button class="mv" data-act="rename-list" data-id="' +
                    esc(id) +
                    '" aria-label="Renomear lista">' +
                    ICON.pen +
                    "</button>" +
                    '<button class="mv delmv" data-act="del-list" data-id="' +
                    esc(id) +
                    '" aria-label="Excluir lista">' +
                    ICON.trash +
                    "</button>") +
                "</span></div>" +
                '<div class="s">' +
                esc(fmtDate(l.createdAt)) +
                (tpl ? " · " + esc(tpl.name) : "") +
                " · " +
                esc(sub) +
                "</div>" +
                '<div class="bar"><i style="width:' +
                st.pct +
                '%"></i></div></div>'
              );
            })
            .join("") +
          "</div>";
      }
    } else {
      if (!nt) {
        h +=
          '<div class="empty"><p>O modelo é a sua lista impressa: todos os itens de sempre, sem quantidades. Você gera uma lista nova a partir dele sempre que for às compras.</p>' +
          (S.readOnly
            ? ""
            : '<button class="btn primary" data-act="new-tpl">Criar meu modelo</button>') +
          "</div>";
      } else {
        h +=
          '<div class="cards">' +
          sortedIds("templates")
            .map(function (id) {
              var t = S.templates[id];
              // O cartão é uma <div> (e não um <button>) porque um botão
              // não pode ter outros botões dentro dele (lápis e lixeira).
              return (
                '<div class="card" role="button" tabindex="0" data-act="open-tpl" data-id="' +
                esc(id) +
                '"><div class="t"><span>' +
                esc(t.name) +
                "</span>" +
                '<span class="cardr">' +
                (S.readOnly
                  ? ""
                  : '<button class="mv" data-act="rename-tpl" data-id="' +
                    esc(id) +
                    '" aria-label="Renomear modelo">' +
                    ICON.pen +
                    "</button>" +
                    '<button class="mv delmv" data-act="del-tpl" data-id="' +
                    esc(id) +
                    '" aria-label="Excluir modelo">' +
                    ICON.trash +
                    "</button>") +
                "</span></div>" +
                '<div class="s">' +
                t.items.length +
                " itens</div></div>"
              );
            })
            .join("") +
          "</div>";
      }
    }
    return h;
  }
  function viewList() {
    var l = S.lists[S.openId],
      st = listStats(l),
      ro = S.readOnly ? " disabled" : "";
    var h = header(l.name, true, "list-menu", "rename-list");
    var items =
      S.filter === "pick"
        ? l.items.filter(function (it) {
            return isPick(it) || it.done;
          })
        : l.items;
    h +=
      '<div class="toolbar"><div class="seg">' +
      '<button data-act="filter" data-v="all" class="' +
      (S.filter === "all" ? "on" : "") +
      '">Todos<b>' +
      st.total +
      "</b></button>" +
      '<button data-act="filter" data-v="pick" class="' +
      (S.filter === "pick" ? "on" : "") +
      '">A pegar<b id="npick">' +
      st.pick +
      "</b></button></div>" +
      (S.readOnly
        ? ""
        : '<button class="btn small" data-act="edit-items">' +
          (S.editItems ? "Concluir edição" : "Editar itens") +
          "</button>") +
      "</div>";
    h +=
      '<div class="prog"><div class="bar"><i id="pbar" style="width:' +
      st.pct +
      '%"></i></div><span id="ptxt">' +
      progText(st) +
      "</span></div>";
    h += '<div id="donebox">' + doneBox(l) + "</div>";
    h +=
      '<div class="table"><div class="thead"><span></span><span>Comprar</span><span>Tem em casa</span><span>Pegar</span></div>';
    if (!items.length) {
      h +=
        '<div class="hiddeninfo">' +
        (S.filter === "pick"
          ? "Nenhum item com quantidade em “Pegar” ainda. Preencha em “Todos”."
          : "Lista vazia. Adicione itens abaixo.") +
        "</div>";
    }
    h += items
      .map(function (it) {
        var cls =
          "row" +
          (it.done ? " done" : "") +
          (isPick(it) && !it.done ? " pick" : "");
        var first = S.editItems
          ? '<button class="del" data-act="del-item" data-id="' +
            esc(it.id) +
            '" aria-label="Remover">' +
            ICON.x +
            "</button>"
          : '<button class="chk" data-act="toggle" data-id="' +
            esc(it.id) +
            '" aria-label="Marcar como pego"' +
            ro +
            ">" +
            ICON.check +
            "</button>";
        var name = S.editItems
          ? '<input class="txt" data-f="iname" data-id="' +
            esc(it.id) +
            '" value="' +
            esc(it.name) +
            '" placeholder="Nome do item">'
          : '<span class="name" data-act="toggle" data-id="' +
            esc(it.id) +
            '">' +
            esc(it.name || "(sem nome)") +
            "</span>";
        return (
          '<div class="' +
          cls +
          '" data-row="' +
          esc(it.id) +
          '">' +
          first +
          name +
          '<input class="qty" data-f="have" data-id="' +
          esc(it.id) +
          '" value="' +
          esc(it.have) +
          '" inputmode="decimal" placeholder="–" aria-label="Tem em casa"' +
          ro +
          ">" +
          '<input class="qty" data-f="get" data-id="' +
          esc(it.id) +
          '" value="' +
          esc(it.get) +
          '" inputmode="decimal" placeholder="–" aria-label="Pegar"' +
          ro +
          "></div>"
        );
      })
      .join("");
    if (!S.readOnly)
      h +=
        '<div class="addrow"><input data-add="list" placeholder="Adicionar item…" enterkeyhint="done"><button class="btn primary small" data-act="add-list">Adicionar</button></div>';
    h += "</div>";
    return h;
  }
  function progText(st) {
    if (!st.total) return "";
    if (st.pick > 0) return st.got + " de " + st.pick + " no carrinho";
    return st.done + " de " + st.total + " riscados";
  }
  function doneBox(l) {
    if (S.readOnly || !isComplete(l)) return "";
    return (
      '<div class="donebar ok"><span>Tudo no carrinho! Já pode excluir esta lista.</span><button class="btn small danger" data-act="del-list" data-id="' +
      esc(S.openId) +
      '">Excluir lista</button></div>'
    );
  }
  function updateProgress() {
    var l = S.lists[S.openId];
    if (!l) return;
    var st = listStats(l);
    var dbx = document.getElementById("donebox");
    if (dbx) dbx.innerHTML = doneBox(l);
    var b = document.getElementById("pbar"),
      t = document.getElementById("ptxt"),
      n = document.getElementById("npick");
    if (b) b.style.width = st.pct + "%";
    if (t) t.textContent = progText(st);
    if (n) n.textContent = st.pick;
  }
  function viewTpl() {
    var t = S.templates[S.openId],
      ro = S.readOnly ? " disabled" : "";
    var h = header("Modelo", true, "tpl-menu");
    h +=
      '<label class="field"><span>Nome do modelo</span><input data-f="tpl-name" value="' +
      esc(t.name) +
      '"' +
      ro +
      "></label>";
    h +=
      '<button class="btn primary block" data-act="gen-from-tpl"' +
      (S.readOnly || !t.items.length ? " disabled" : "") +
      ">Gerar lista nova a partir deste modelo</button>";
    h +=
      '<div class="sechead"><h2>Itens (' +
      t.items.length +
      ")</h2>" +
      (S.readOnly
        ? ""
        : '<button class="btn small" data-act="bulk-add">Colar vários</button>') +
      "</div>";
    if (!t.items.length && !S.readOnly) {
      h +=
        '<div class="empty" style="margin-bottom:12px"><p>Adicione os itens que você sempre compra, na ordem em que aparecem no mercado. Ou comece com uma lista pronta e ajuste.</p><button class="btn" data-act="add-common">Usar itens comuns de mercado</button></div>';
    }
    h += '<div class="table">';
    h += t.items
      .map(function (it, i) {
        return (
          '<div class="trow"><input class="txt" data-f="tname" data-id="' +
          esc(it.id) +
          '" value="' +
          esc(it.name) +
          '" placeholder="Nome do item"' +
          ro +
          ">" +
          '<button class="mv" data-act="tpl-up" data-id="' +
          esc(it.id) +
          '" aria-label="Subir"' +
          (i === 0 || S.readOnly ? " disabled" : "") +
          ">" +
          ICON.up +
          "</button>" +
          '<button class="mv" data-act="tpl-down" data-id="' +
          esc(it.id) +
          '" aria-label="Descer"' +
          (i === t.items.length - 1 || S.readOnly ? " disabled" : "") +
          ">" +
          ICON.down +
          "</button>" +
          '<button class="del" data-act="tpl-del" data-id="' +
          esc(it.id) +
          '" aria-label="Remover"' +
          ro +
          ">" +
          ICON.x +
          "</button></div>"
        );
      })
      .join("");
    if (!S.readOnly)
      h +=
        '<div class="addrow"><input data-add="tpl" placeholder="Adicionar item…" enterkeyhint="done"><button class="btn primary small" data-act="add-tpl">Adicionar</button></div>';
    h += "</div>";
    return h;
  }

  /* ---------- modal ---------- */
  function openModal(inner, onMount) {
    $modal.innerHTML =
      '<div class="scrim"><div class="sheet" role="dialog">' +
      inner +
      "</div></div>";
    var scrim = $modal.firstChild;
    scrim.addEventListener("click", function (e) {
      if (e.target === scrim) closeModal();
    });
    if (onMount) onMount($modal.querySelector(".sheet"));
  }
  function closeModal() {
    $modal.innerHTML = "";
    if (pendingRender && !editing()) {
      pendingRender = false;
      render();
    }
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $modal.firstChild) closeModal();
  });
  function confirmDialog(title, text, okLabel, danger) {
    return new Promise(function (res) {
      openModal(
        "<h3>" +
          esc(title) +
          "</h3><p>" +
          esc(text) +
          '</p><div class="btns"><button class="btn" data-m="no">Cancelar</button><button class="btn ' +
          (danger ? "danger" : "primary") +
          '" data-m="ok">' +
          esc(okLabel) +
          "</button></div>",
        function (s) {
          s.querySelector("[data-m=no]").onclick = function () {
            closeModal();
            res(false);
          };
          s.querySelector("[data-m=ok]").onclick = function () {
            closeModal();
            res(true);
          };
        },
      );
    });
  }
  function promptDialog(title, value, okLabel) {
    return new Promise(function (res) {
      openModal(
        "<h3>" +
          esc(title) +
          '</h3><label class="field"><input data-m="in" value="' +
          esc(value) +
          '"></label><div class="btns"><button class="btn" data-m="no">Cancelar</button><button class="btn primary" data-m="ok">' +
          esc(okLabel || "Salvar") +
          "</button></div>",
        function (s) {
          var inp = s.querySelector("[data-m=in]");
          inp.focus();
          inp.select();
          function ok() {
            var v = inp.value.trim();
            closeModal();
            res(v || null);
          }
          s.querySelector("[data-m=no]").onclick = function () {
            closeModal();
            res(null);
          };
          s.querySelector("[data-m=ok]").onclick = ok;
          inp.onkeydown = function (e) {
            if (e.key === "Enter") ok();
          };
        },
      );
    });
  }

  /* ---------- actions ---------- */
  function createListFrom(tplId, name) {
    var t = S.templates[tplId],
      id = uid(),
      now = Date.now();
    S.lists[id] = {
      name: name,
      templateId: t ? tplId : "",
      createdAt: now,
      updatedAt: now,
      items: t
        ? t.items
            .filter(function (it) {
              return it.name.trim();
            })
            .map(function (it) {
              return {
                id: uid(),
                name: it.name,
                have: "",
                get: "",
                done: false,
              };
            })
        : [],
    };
    markDirty("lists", id);
    S.view = "list";
    S.openId = id;
    S.filter = "all";
    S.editItems = false;
    render();
    window.scrollTo(0, 0);
  }
  function newListDialog(preselect) {
    var tids = sortedIds("templates");
    var sel = preselect || tids[0] || "";
    function opts() {
      return (
        tids
          .map(function (id) {
            var t = S.templates[id];
            return (
              '<div class="opt' +
              (sel === id ? " on" : "") +
              '" data-tid="' +
              esc(id) +
              '"><span class="dot"></span><span>' +
              esc(t.name) +
              "</span><small>" +
              t.items.length +
              " itens</small></div>"
            );
          })
          .join("") +
        '<div class="opt' +
        (sel === "" ? " on" : "") +
        '" data-tid=""><span class="dot"></span><span>Lista em branco</span></div>'
      );
    }
    openModal(
      '<h3>Nova lista</h3><label class="field"><span>Nome</span><input data-m="name" value="Compras ' +
        esc(today()) +
        '"></label>' +
        '<div class="field" style="margin-bottom:4px"><span>Começar a partir de</span></div><div data-m="opts">' +
        opts() +
        "</div>" +
        '<div class="btns"><button class="btn" data-m="no">Cancelar</button><button class="btn primary" data-m="ok">Criar lista</button></div>',
      function (s) {
        var box = s.querySelector("[data-m=opts]");
        box.onclick = function (e) {
          var o = e.target.closest(".opt");
          if (!o) return;
          sel = o.getAttribute("data-tid");
          box.innerHTML = opts();
        };
        s.querySelector("[data-m=no]").onclick = closeModal;
        s.querySelector("[data-m=ok]").onclick = function () {
          var n =
            s.querySelector("[data-m=name]").value.trim() ||
            "Compras " + today();
          closeModal();
          createListFrom(sel, n);
        };
      },
    );
  }
  function deleteList(id) {
    var l = S.lists[id];
    if (!l || S.readOnly) return;
    confirmDialog(
      "Excluir lista?",
      "“" + l.name + "” será apagada. Isso não pode ser desfeito.",
      "Excluir",
      true,
    ).then(function (ok) {
      if (!ok) return;
      removeDoc("lists", id);
      if (S.view === "list") {
        S.view = "home";
        S.tab = "lists";
        window.scrollTo(0, 0);
      }
      render();
      toast("Lista excluída");
    });
  }
  function deleteDoneLists() {
    var ids = Object.keys(S.lists).filter(function (id) {
      return isComplete(S.lists[id]);
    });
    if (!ids.length) return;
    confirmDialog(
      "Excluir listas concluídas?",
      ids.length +
        " lista" +
        (ids.length > 1 ? "s" : "") +
        " com tudo no carrinho será" +
        (ids.length > 1 ? "o" : "") +
        " apagada" +
        (ids.length > 1 ? "s" : "") +
        ". Isso não pode ser desfeito.",
      "Excluir",
      true,
    ).then(function (ok) {
      if (!ok) return;
      ids.forEach(function (id) {
        removeDoc("lists", id);
      });
      render();
      toast(ids.length + " lista(s) excluída(s)");
    });
  }
  function renameList(id) {
    var l = S.lists[id];
    if (!l || S.readOnly) return;
    promptDialog("Renomear lista", l.name).then(function (v) {
      if (v && S.lists[id]) {
        S.lists[id].name = v.slice(0, 120);
        markDirty("lists", id);
        render();
      }
    });
  }
  function deleteTpl(id) {
    var t = S.templates[id];
    if (!t || S.readOnly) return;
    confirmDialog(
      "Excluir modelo?",
      "O modelo “" +
        t.name +
        "” será apagado. As listas já geradas a partir dele continuam.",
      "Excluir",
      true,
    ).then(function (ok) {
      if (!ok) return;
      removeDoc("templates", id);
      if (S.view === "tpl") {
        S.view = "home";
        S.tab = "templates";
        window.scrollTo(0, 0);
      }
      render();
      toast("Modelo excluído");
    });
  }
  function renameTpl(id) {
    var t = S.templates[id];
    if (!t || S.readOnly) return;
    promptDialog("Renomear modelo", t.name).then(function (v) {
      if (v && S.templates[id]) {
        S.templates[id].name = v.slice(0, 120);
        markDirty("templates", id);
        render();
      }
    });
  }
  function listText(l) {
    var picks = l.items.filter(function (it) {
      return isPick(it) && !it.done;
    });
    var arr = picks.length
      ? picks
      : l.items.filter(function (it) {
          return !it.done;
        });
    return (
      "🛒 " +
      l.name +
      "\n" +
      arr
        .map(function (it) {
          return "• " + it.name + (isPick(it) ? " — " + it.get.trim() : "");
        })
        .join("\n")
    );
  }
  function copyText(txt) {
    function fallback() {
      openModal(
        "<h3>Copiar lista</h3><p>Selecione o texto e copie.</p><textarea readonly>" +
          esc(txt) +
          '</textarea><div class="btns"><button class="btn primary" data-m="ok">Fechar</button></div>',
        function (s) {
          var ta = s.querySelector("textarea");
          ta.focus();
          ta.select();
          s.querySelector("[data-m=ok]").onclick = closeModal;
        },
      );
    }
    try {
      navigator.clipboard.writeText(txt).then(function () {
        toast("Lista copiada");
      }, fallback);
    } catch (e) {
      fallback();
    }
  }
  function newItemsForTemplate(l) {
    var t = S.templates[l.templateId];
    if (!t) return [];
    var have = {};
    t.items.forEach(function (it) {
      have[norm(it.name)] = 1;
    });
    var out = [],
      seen = {};
    l.items.forEach(function (it) {
      var k = norm(it.name);
      if (k && !have[k] && !seen[k]) {
        seen[k] = 1;
        out.push(it.name.trim());
      }
    });
    return out;
  }
  function listMenu() {
    var l = S.lists[S.openId],
      news = newItemsForTemplate(l),
      t = S.templates[l.templateId],
      ro = S.readOnly ? " disabled" : "";
    openModal(
      "<h3>" +
        esc(l.name) +
        '</h3><div class="menu">' +
        '<button data-m="copy">Copiar itens para enviar (WhatsApp etc.)</button>' +
        '<button data-m="rename"' +
        ro +
        ">Renomear lista</button>" +
        '<button data-m="uncheck"' +
        ro +
        ">Desmarcar todos os itens</button>" +
        '<button data-m="clearq"' +
        ro +
        ">Limpar quantidades</button>" +
        (t
          ? '<button data-m="savetpl"' +
            (S.readOnly || !news.length ? " disabled" : "") +
            ">Salvar itens novos no modelo<small>" +
            (news.length
              ? news.length + " novo" + (news.length > 1 ? "s" : "")
              : "nenhum novo") +
            "</small></button>"
          : "") +
        '<button data-m="dup"' +
        ro +
        ">Duplicar lista</button>" +
        '<button data-m="del" class="danger"' +
        ro +
        ">Excluir lista</button>" +
        "</div>",
      function (s) {
        s.querySelector(".menu").onclick = function (e) {
          var b = e.target.closest("button");
          if (!b || b.disabled) return;
          var m = b.getAttribute("data-m");
          closeModal();
          if (m === "copy") copyText(listText(l));
          else if (m === "rename") renameList(S.openId);
          else if (m === "uncheck") {
            l.items.forEach(function (it) {
              it.done = false;
            });
            markDirty("lists", S.openId);
            render();
          } else if (m === "clearq")
            confirmDialog(
              "Limpar quantidades?",
              "Os campos “Tem em casa” e “Pegar” de todos os itens ficarão vazios.",
              "Limpar",
              true,
            ).then(function (ok) {
              if (ok) {
                l.items.forEach(function (it) {
                  it.have = "";
                  it.get = "";
                  it.done = false;
                });
                markDirty("lists", S.openId);
                render();
              }
            });
          else if (m === "savetpl") {
            news.forEach(function (n) {
              t.items.push({ id: uid(), name: n });
            });
            markDirty("templates", l.templateId);
            toast(news.length + " item(ns) adicionado(s) a “" + t.name + "”");
          } else if (m === "dup") {
            var id = uid(),
              now = Date.now();
            var c = clone(l);
            c.name = l.name + " (cópia)";
            c.createdAt = now;
            c.items.forEach(function (it) {
              it.id = uid();
              it.done = false;
            });
            S.lists[id] = c;
            markDirty("lists", id);
            S.openId = id;
            render();
            window.scrollTo(0, 0);
          } else if (m === "del") deleteList(S.openId);
        };
      },
    );
  }
  function tplMenu() {
    var t = S.templates[S.openId],
      ro = S.readOnly ? " disabled" : "";
    openModal(
      "<h3>" +
        esc(t.name) +
        '</h3><div class="menu">' +
        '<button data-m="sort"' +
        ro +
        ">Ordenar itens de A a Z</button>" +
        '<button data-m="dup"' +
        ro +
        ">Duplicar modelo</button>" +
        '<button data-m="del" class="danger"' +
        ro +
        ">Excluir modelo</button></div>",
      function (s) {
        s.querySelector(".menu").onclick = function (e) {
          var b = e.target.closest("button");
          if (!b || b.disabled) return;
          var m = b.getAttribute("data-m");
          closeModal();
          if (m === "sort")
            confirmDialog(
              "Ordenar de A a Z?",
              "A ordem atual dos itens será substituída pela ordem alfabética.",
              "Ordenar",
            ).then(function (ok) {
              if (ok) {
                t.items.sort(function (a, b) {
                  return a.name.localeCompare(b.name, "pt-BR");
                });
                markDirty("templates", S.openId);
                render();
              }
            });
          else if (m === "dup") {
            var id = uid(),
              now = Date.now(),
              c = clone(t);
            c.name = t.name + " (cópia)";
            c.createdAt = now;
            c.items.forEach(function (it) {
              it.id = uid();
            });
            S.templates[id] = c;
            markDirty("templates", id);
            S.openId = id;
            render();
          } else if (m === "del") deleteTpl(S.openId);
        };
      },
    );
  }
  function addNames(t, names) {
    var have = {};
    t.items.forEach(function (it) {
      have[norm(it.name)] = 1;
    });
    var n = 0;
    names.forEach(function (x) {
      x = String(x)
        .replace(/^[\s\-•*·\d.)]+/, "")
        .trim();
      var k = norm(x);
      if (k && !have[k]) {
        have[k] = 1;
        t.items.push({ id: uid(), name: x.slice(0, 200) });
        n++;
      }
    });
    return n;
  }
  function bulkDialog() {
    var t = S.templates[S.openId];
    openModal(
      '<h3>Colar vários itens</h3><p>Um item por linha. Itens repetidos são ignorados.</p><textarea data-m="ta" placeholder="Arroz&#10;Feijão&#10;Leite"></textarea><div class="btns"><button class="btn" data-m="no">Cancelar</button><button class="btn primary" data-m="ok">Adicionar</button></div>',
      function (s) {
        var ta = s.querySelector("textarea");
        ta.focus();
        s.querySelector("[data-m=no]").onclick = closeModal;
        s.querySelector("[data-m=ok]").onclick = function () {
          var n = addNames(t, ta.value.split(/\r?\n/));
          closeModal();
          if (n) {
            markDirty("templates", S.openId);
            render();
          }
          toast(n + " item(ns) adicionado(s)");
        };
      },
    );
  }
  function addFromInput(kind) {
    var inp = $app.querySelector('[data-add="' + kind + '"]');
    if (!inp) return;
    var v = inp.value.trim();
    if (!v) {
      inp.focus();
      return;
    }
    if (kind === "list") {
      S.lists[S.openId].items.push({
        id: uid(),
        name: v,
        have: "",
        get: "",
        done: false,
      });
      markDirty("lists", S.openId);
      if (S.filter === "pick") S.filter = "all";
    } else {
      var t = S.templates[S.openId];
      if (!addNames(t, [v])) {
        toast("Esse item já está no modelo");
        inp.select();
        return;
      }
      markDirty("templates", S.openId);
    }
    render();
    var n = $app.querySelector('[data-add="' + kind + '"]');
    if (n) {
      n.focus();
    }
  }
  function findItem(arr, id) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return i;
    return -1;
  }

  $app.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"),
      id = el.getAttribute("data-id"),
      v = el.getAttribute("data-v");
    if (act === "tab") {
      S.tab = v;
      render();
    } else if (act === "new-list") {
      newListDialog();
    } else if (act === "new-tpl") {
      var nid = uid(),
        now = Date.now();
      S.templates[nid] = {
        name: "Minha lista",
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      markDirty("templates", nid);
      S.view = "tpl";
      S.openId = nid;
      render();
      var f = $app.querySelector('[data-f="tpl-name"]');
      if (f) {
        f.focus();
        f.select();
      }
    } else if (act === "open-list") {
      S.view = "list";
      S.openId = id;
      S.filter = "all";
      S.editItems = false;
      render();
      window.scrollTo(0, 0);
    } else if (act === "open-tpl") {
      S.view = "tpl";
      S.openId = id;
      render();
      window.scrollTo(0, 0);
    } else if (act === "back") {
      S.tab = S.view === "tpl" ? "templates" : "lists";
      S.view = "home";
      S.editItems = false;
      render();
      window.scrollTo(0, 0);
    } else if (act === "list-menu") {
      listMenu();
    } else if (act === "tpl-menu") {
      tplMenu();
    } else if (act === "filter") {
      S.filter = v;
      render();
    } else if (act === "rename-list") {
      renameList(id || S.openId);
    } else if (act === "del-list") {
      deleteList(id || S.openId);
    } else if (act === "rename-tpl") {
      renameTpl(id || S.openId);
    } else if (act === "del-tpl") {
      deleteTpl(id || S.openId);
    } else if (act === "del-done") {
      deleteDoneLists();
    } else if (act === "edit-items") {
      S.editItems = !S.editItems;
      render();
    } else if (act === "toggle") {
      if (S.readOnly) return;
      var l = S.lists[S.openId],
        i = findItem(l.items, id);
      if (i < 0) return;
      l.items[i].done = !l.items[i].done;
      markDirty("lists", S.openId);
      var row = $app.querySelector('[data-row="' + id + '"]');
      if (row) {
        row.classList.toggle("done", l.items[i].done);
        row.classList.toggle("pick", isPick(l.items[i]) && !l.items[i].done);
        updateProgress();
      } else render();
    } else if (act === "del-item") {
      var l2 = S.lists[S.openId],
        j = findItem(l2.items, id);
      if (j >= 0) {
        l2.items.splice(j, 1);
        markDirty("lists", S.openId);
        render();
      }
    } else if (act === "add-list") {
      addFromInput("list");
    } else if (act === "add-tpl") {
      addFromInput("tpl");
    } else if (act === "tpl-up" || act === "tpl-down") {
      var t = S.templates[S.openId],
        k = findItem(t.items, id),
        to = act === "tpl-up" ? k - 1 : k + 1;
      if (k < 0 || to < 0 || to >= t.items.length) return;
      var tmp = t.items[k];
      t.items[k] = t.items[to];
      t.items[to] = tmp;
      markDirty("templates", S.openId);
      render();
      var b = $app.querySelector(
        '[data-act="' + act + '"][data-id="' + id + '"]',
      );
      if (b && !b.disabled) b.focus();
    } else if (act === "tpl-del") {
      var t2 = S.templates[S.openId],
        q = findItem(t2.items, id);
      if (q >= 0) {
        t2.items.splice(q, 1);
        markDirty("templates", S.openId);
        render();
      }
    } else if (act === "bulk-add") {
      bulkDialog();
    } else if (act === "add-common") {
      var t3 = S.templates[S.openId];
      addNames(t3, COMMON);
      markDirty("templates", S.openId);
      render();
    } else if (act === "gen-from-tpl") {
      newListDialog(S.openId);
    }
  });
  $app.addEventListener("input", function (e) {
    var el = e.target,
      f = el.getAttribute("data-f");
    if (!f || S.readOnly) return;
    var id = el.getAttribute("data-id");
    if (f === "have" || f === "get" || f === "iname") {
      var l = S.lists[S.openId],
        i = findItem(l.items, id);
      if (i < 0) return;
      var it = l.items[i];
      if (f === "have") it.have = el.value.slice(0, 20);
      else if (f === "get") {
        it.get = el.value.slice(0, 20);
        var row = el.closest(".row");
        if (row) row.classList.toggle("pick", isPick(it) && !it.done);
        updateProgress();
      } else it.name = el.value.slice(0, 200);
      markDirty("lists", S.openId);
    } else if (f === "tname") {
      var t = S.templates[S.openId],
        j = findItem(t.items, id);
      if (j < 0) return;
      t.items[j].name = el.value.slice(0, 200);
      markDirty("templates", S.openId);
    } else if (f === "tpl-name") {
      S.templates[S.openId].name = el.value.slice(0, 120);
      markDirty("templates", S.openId);
    }
  });
  $app.addEventListener("keydown", function (e) {
    var el = e.target;
    if (e.key === "Enter" && el.classList.contains("card")) {
      e.preventDefault();
      el.click();
    } else if (e.key === "Enter" && el.hasAttribute("data-add")) {
      e.preventDefault();
      addFromInput(el.getAttribute("data-add"));
    } else if (e.key === "Enter" && el.classList.contains("qty")) {
      e.preventDefault();
      var all = [].slice.call(
          $app.querySelectorAll(
            '.qty[data-f="' + el.getAttribute("data-f") + '"]',
          ),
        ),
        i = all.indexOf(el);
      if (all[i + 1]) all[i + 1].focus();
      else el.blur();
    }
  });
  $app.addEventListener("focusin", function (e) {
    if (e.target.classList && e.target.classList.contains("qty")) {
      try {
        e.target.select();
      } catch (x) {}
    }
  });
  $app.addEventListener("change", function (e) {
    // on leaving the template name field, never keep it empty
    if (
      e.target.getAttribute("data-f") === "tpl-name" &&
      !e.target.value.trim() &&
      S.templates[S.openId]
    ) {
      S.templates[S.openId].name = "Modelo";
      markDirty("templates", S.openId);
    }
  });

  init();
})();
