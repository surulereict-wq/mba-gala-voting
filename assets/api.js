// Shared helpers: talking to the backend, and building page elements safely.
// Everything shown on screen is set as text (never as HTML), so a nominee or
// voter name can't inject markup into the page.
(function () {
  var BASE = String(window.VOTING_API_BASE || "").replace(/\/+$/, "");

  // A random id this browser keeps, sent with every request so organisers can
  // see if one device is being used for many matric numbers. It is not a
  // login and holds no personal data.
  function deviceId() {
    try {
      var id = localStorage.getItem("gala_device_id");
      if (!id) {
        id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
        localStorage.setItem("gala_device_id", id);
      }
      return id;
    } catch (e) { return ""; }
  }

  // api("/path", { method, body, adminKey, onSlow }) -> { ok, status, data }
  // Never throws. onSlow fires if the server takes >4s — on free hosting the
  // first request after a quiet spell can take about a minute to wake it.
  window.api = function (path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (opts.adminKey) headers["x-voting-admin-key"] = opts.adminKey;
    var dev = deviceId();
    if (dev) headers["x-device-id"] = dev;
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
