// Shared helpers: talking to the backend, and building page elements safely.
// Everything shown on screen is set as text (never as HTML), so a nominee or
// voter name can't inject markup into the page.
(function () {
  var BASE = String(window.VOTING_API_BASE || "").replace(/\/+$/, "");

  // api("/path", { method, body, adminKey, onSlow }) -> { ok, status, data }
  // Never throws. onSlow fires if the server takes >4s — on free hosting the
  // first request after a quiet spell can take about a minute to wake it.
  window.api = function (path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (opts.adminKey) headers["x-voting-admin-key"] = opts.adminKey;
    var ctrl = new AbortController();
    var giveUp = setTimeout(function () { ctrl.abort(); }, 75000);
    var slow = opts.onSlow ? setTimeout(opts.onSlow, 4000) : null;
    return fetch(BASE + "/api/voting" + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl.signal,
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .catch(function () {
        return { ok: false, status: 0, data: { error: "Can't reach the server. Check your internet connection and try again." } };
      })
      .then(function (result) {
        clearTimeout(giveUp);
        if (slow) clearTimeout(slow);
        return result;
      });
  };

  // h("div", { class: "x", onclick: fn }, "text", childElement, ...)
  window.h = function (tag, props) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (k === "class") el.className = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else if (v !== false && v != null) el.setAttribute(k, v);
    });
    Array.prototype.slice.call(arguments, 2).forEach(function add(kid) {
      if (Array.isArray(kid)) return kid.forEach(add);
      if (kid == null || kid === false) return;
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    });
    return el;
  };
})();
