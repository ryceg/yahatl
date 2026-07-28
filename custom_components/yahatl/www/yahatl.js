/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _t = globalThis, zt = _t.ShadowRoot && (_t.ShadyCSS === void 0 || _t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Dt = Symbol(), Mt = /* @__PURE__ */ new WeakMap();
let ie = class {
  constructor(t, i, s) {
    if (this._$cssResult$ = !0, s !== Dt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = i;
  }
  get styleSheet() {
    let t = this.o;
    const i = this.t;
    if (zt && t === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (t = Mt.get(i)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && Mt.set(i, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const de = (e) => new ie(typeof e == "string" ? e : e + "", void 0, Dt), I = (e, ...t) => {
  const i = e.length === 1 ? e[0] : t.reduce((s, a, o) => s + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[o + 1], e[0]);
  return new ie(i, e, Dt);
}, he = (e, t) => {
  if (zt) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const s = document.createElement("style"), a = _t.litNonce;
    a !== void 0 && s.setAttribute("nonce", a), s.textContent = i.cssText, e.appendChild(s);
  }
}, Rt = zt ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const s of t.cssRules) i += s.cssText;
  return de(i);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: pe, defineProperty: ue, getOwnPropertyDescriptor: ge, getOwnPropertyNames: me, getOwnPropertySymbols: _e, getPrototypeOf: be } = Object, q = globalThis, jt = q.trustedTypes, fe = jt ? jt.emptyScript : "", Ct = q.reactiveElementPolyfillSupport, dt = (e, t) => e, bt = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? fe : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let i = e;
  switch (t) {
    case Boolean:
      i = e !== null;
      break;
    case Number:
      i = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(e);
      } catch {
        i = null;
      }
  }
  return i;
} }, Lt = (e, t) => !pe(e, t), Ht = { attribute: !0, type: String, converter: bt, reflect: !1, useDefault: !1, hasChanged: Lt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), q.litPropertyMetadata ?? (q.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let V = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, i = Ht) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(t, i), !i.noAccessor) {
      const s = Symbol(), a = this.getPropertyDescriptor(t, s, i);
      a !== void 0 && ue(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, i, s) {
    const { get: a, set: o } = ge(this.prototype, t) ?? { get() {
      return this[i];
    }, set(r) {
      this[i] = r;
    } };
    return { get: a, set(r) {
      const l = a == null ? void 0 : a.call(this);
      o == null || o.call(this, r), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Ht;
  }
  static _$Ei() {
    if (this.hasOwnProperty(dt("elementProperties"))) return;
    const t = be(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(dt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(dt("properties"))) {
      const i = this.properties, s = [...me(i), ..._e(i)];
      for (const a of s) this.createProperty(a, i[a]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const i = litPropertyMetadata.get(t);
      if (i !== void 0) for (const [s, a] of i) this.elementProperties.set(s, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, s] of this.elementProperties) {
      const a = this._$Eu(i, s);
      a !== void 0 && this._$Eh.set(a, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const i = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const a of s) i.unshift(Rt(a));
    } else t !== void 0 && i.push(Rt(t));
    return i;
  }
  static _$Eu(t, i) {
    const s = i.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((i) => this.enableUpdating = i), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((i) => i(this));
  }
  addController(t) {
    var i;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((i = t.hostConnected) == null || i.call(t));
  }
  removeController(t) {
    var i;
    (i = this._$EO) == null || i.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const s of i.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return he(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((i) => {
      var s;
      return (s = i.hostConnected) == null ? void 0 : s.call(i);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var s;
      return (s = i.hostDisconnected) == null ? void 0 : s.call(i);
    });
  }
  attributeChangedCallback(t, i, s) {
    this._$AK(t, s);
  }
  _$ET(t, i) {
    var o;
    const s = this.constructor.elementProperties.get(t), a = this.constructor._$Eu(t, s);
    if (a !== void 0 && s.reflect === !0) {
      const r = (((o = s.converter) == null ? void 0 : o.toAttribute) !== void 0 ? s.converter : bt).toAttribute(i, s.type);
      this._$Em = t, r == null ? this.removeAttribute(a) : this.setAttribute(a, r), this._$Em = null;
    }
  }
  _$AK(t, i) {
    var o, r;
    const s = this.constructor, a = s._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const l = s.getPropertyOptions(a), c = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((o = l.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? l.converter : bt;
      this._$Em = a;
      const p = c.fromAttribute(i, l.type);
      this[a] = p ?? ((r = this._$Ej) == null ? void 0 : r.get(a)) ?? p, this._$Em = null;
    }
  }
  requestUpdate(t, i, s, a = !1, o) {
    var r;
    if (t !== void 0) {
      const l = this.constructor;
      if (a === !1 && (o = this[t]), s ?? (s = l.getPropertyOptions(t)), !((s.hasChanged ?? Lt)(o, i) || s.useDefault && s.reflect && o === ((r = this._$Ej) == null ? void 0 : r.get(t)) && !this.hasAttribute(l._$Eu(t, s)))) return;
      this.C(t, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, i, { useDefault: s, reflect: a, wrapped: o }, r) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, r ?? i ?? this[t]), o !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (i = void 0), this._$AL.set(t, i)), a === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, r] of this._$Ep) this[o] = r;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [o, r] of a) {
        const { wrapped: l } = r, c = this[o];
        l !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, r, c);
      }
    }
    let t = !1;
    const i = this._$AL;
    try {
      t = this.shouldUpdate(i), t ? (this.willUpdate(i), (s = this._$EO) == null || s.forEach((a) => {
        var o;
        return (o = a.hostUpdate) == null ? void 0 : o.call(a);
      }), this.update(i)) : this._$EM();
    } catch (a) {
      throw t = !1, this._$EM(), a;
    }
    t && this._$AE(i);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var i;
    (i = this._$EO) == null || i.forEach((s) => {
      var a;
      return (a = s.hostUpdated) == null ? void 0 : a.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((i) => this._$ET(i, this[i]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
V.elementStyles = [], V.shadowRootOptions = { mode: "open" }, V[dt("elementProperties")] = /* @__PURE__ */ new Map(), V[dt("finalized")] = /* @__PURE__ */ new Map(), Ct == null || Ct({ ReactiveElement: V }), (q.reactiveElementVersions ?? (q.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ht = globalThis, Ut = (e) => e, ft = ht.trustedTypes, Yt = ft ? ft.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, se = "$lit$", P = `lit$${Math.random().toFixed(9).slice(2)}$`, ae = "?" + P, ye = `<${ae}>`, U = document, pt = () => U.createComment(""), ut = (e) => e === null || typeof e != "object" && typeof e != "function", Ot = Array.isArray, ve = (e) => Ot(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", At = `[ 	
\f\r]`, ot = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Bt = /-->/g, Ft = />/g, M = RegExp(`>|${At}(?:([^\\s"'>=/]+)(${At}*=${At}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Wt = /'/g, Qt = /"/g, re = /^(?:script|style|textarea|title)$/i, xe = (e) => (t, ...i) => ({ _$litType$: e, strings: t, values: i }), n = xe(1), Y = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), Vt = /* @__PURE__ */ new WeakMap(), j = U.createTreeWalker(U, 129);
function oe(e, t) {
  if (!Ot(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Yt !== void 0 ? Yt.createHTML(t) : t;
}
const $e = (e, t) => {
  const i = e.length - 1, s = [];
  let a, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = ot;
  for (let l = 0; l < i; l++) {
    const c = e[l];
    let p, h, m = -1, _ = 0;
    for (; _ < c.length && (r.lastIndex = _, h = r.exec(c), h !== null); ) _ = r.lastIndex, r === ot ? h[1] === "!--" ? r = Bt : h[1] !== void 0 ? r = Ft : h[2] !== void 0 ? (re.test(h[2]) && (a = RegExp("</" + h[2], "g")), r = M) : h[3] !== void 0 && (r = M) : r === M ? h[0] === ">" ? (r = a ?? ot, m = -1) : h[1] === void 0 ? m = -2 : (m = r.lastIndex - h[2].length, p = h[1], r = h[3] === void 0 ? M : h[3] === '"' ? Qt : Wt) : r === Qt || r === Wt ? r = M : r === Bt || r === Ft ? r = ot : (r = M, a = void 0);
    const b = r === M && e[l + 1].startsWith("/>") ? " " : "";
    o += r === ot ? c + ye : m >= 0 ? (s.push(p), c.slice(0, m) + se + c.slice(m) + P + b) : c + P + (m === -2 ? l : b);
  }
  return [oe(e, o + (e[i] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class gt {
  constructor({ strings: t, _$litType$: i }, s) {
    let a;
    this.parts = [];
    let o = 0, r = 0;
    const l = t.length - 1, c = this.parts, [p, h] = $e(t, i);
    if (this.el = gt.createElement(p, s), j.currentNode = this.el.content, i === 2 || i === 3) {
      const m = this.el.content.firstChild;
      m.replaceWith(...m.childNodes);
    }
    for (; (a = j.nextNode()) !== null && c.length < l; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const m of a.getAttributeNames()) if (m.endsWith(se)) {
          const _ = h[r++], b = a.getAttribute(m).split(P), v = /([.?@])?(.*)/.exec(_);
          c.push({ type: 1, index: o, name: v[2], strings: b, ctor: v[1] === "." ? ke : v[1] === "?" ? Ce : v[1] === "@" ? Ae : xt }), a.removeAttribute(m);
        } else m.startsWith(P) && (c.push({ type: 6, index: o }), a.removeAttribute(m));
        if (re.test(a.tagName)) {
          const m = a.textContent.split(P), _ = m.length - 1;
          if (_ > 0) {
            a.textContent = ft ? ft.emptyScript : "";
            for (let b = 0; b < _; b++) a.append(m[b], pt()), j.nextNode(), c.push({ type: 2, index: ++o });
            a.append(m[_], pt());
          }
        }
      } else if (a.nodeType === 8) if (a.data === ae) c.push({ type: 2, index: o });
      else {
        let m = -1;
        for (; (m = a.data.indexOf(P, m + 1)) !== -1; ) c.push({ type: 7, index: o }), m += P.length - 1;
      }
      o++;
    }
  }
  static createElement(t, i) {
    const s = U.createElement("template");
    return s.innerHTML = t, s;
  }
}
function Z(e, t, i = e, s) {
  var r, l;
  if (t === Y) return t;
  let a = s !== void 0 ? (r = i._$Co) == null ? void 0 : r[s] : i._$Cl;
  const o = ut(t) ? void 0 : t._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== o && ((l = a == null ? void 0 : a._$AO) == null || l.call(a, !1), o === void 0 ? a = void 0 : (a = new o(e), a._$AT(e, i, s)), s !== void 0 ? (i._$Co ?? (i._$Co = []))[s] = a : i._$Cl = a), a !== void 0 && (t = Z(e, a._$AS(e, t.values), a, s)), t;
}
class we {
  constructor(t, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: i }, parts: s } = this._$AD, a = ((t == null ? void 0 : t.creationScope) ?? U).importNode(i, !0);
    j.currentNode = a;
    let o = j.nextNode(), r = 0, l = 0, c = s[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let p;
        c.type === 2 ? p = new rt(o, o.nextSibling, this, t) : c.type === 1 ? p = new c.ctor(o, c.name, c.strings, this, t) : c.type === 6 && (p = new Ee(o, this, t)), this._$AV.push(p), c = s[++l];
      }
      r !== (c == null ? void 0 : c.index) && (o = j.nextNode(), r++);
    }
    return j.currentNode = U, a;
  }
  p(t) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
  }
}
class rt {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, i, s, a) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = i.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, i = this) {
    t = Z(this, t, i), ut(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== Y && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : ve(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && ut(this._$AH) ? this._$AA.nextSibling.data = t : this.T(U.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: i, _$litType$: s } = t, a = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = gt.createElement(oe(s.h, s.h[0]), this.options)), s);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === a) this._$AH.p(i);
    else {
      const r = new we(a, this), l = r.u(this.options);
      r.p(i), this.T(l), this._$AH = r;
    }
  }
  _$AC(t) {
    let i = Vt.get(t.strings);
    return i === void 0 && Vt.set(t.strings, i = new gt(t)), i;
  }
  k(t) {
    Ot(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, a = 0;
    for (const o of t) a === i.length ? i.push(s = new rt(this.O(pt()), this.O(pt()), this, this.options)) : s = i[a], s._$AI(o), a++;
    a < i.length && (this._$AR(s && s._$AB.nextSibling, a), i.length = a);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, i); t !== this._$AB; ) {
      const a = Ut(t).nextSibling;
      Ut(t).remove(), t = a;
    }
  }
  setConnected(t) {
    var i;
    this._$AM === void 0 && (this._$Cv = t, (i = this._$AP) == null || i.call(this, t));
  }
}
class xt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, i, s, a, o) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = i, this._$AM = a, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(t, i = this, s, a) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) t = Z(this, t, i, 0), r = !ut(t) || t !== this._$AH && t !== Y, r && (this._$AH = t);
    else {
      const l = t;
      let c, p;
      for (t = o[0], c = 0; c < o.length - 1; c++) p = Z(this, l[s + c], i, c), p === Y && (p = this._$AH[c]), r || (r = !ut(p) || p !== this._$AH[c]), p === d ? t = d : t !== d && (t += (p ?? "") + o[c + 1]), this._$AH[c] = p;
    }
    r && !a && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ke extends xt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class Ce extends xt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class Ae extends xt {
  constructor(t, i, s, a, o) {
    super(t, i, s, a, o), this.type = 5;
  }
  _$AI(t, i = this) {
    if ((t = Z(this, t, i, 0) ?? d) === Y) return;
    const s = this._$AH, a = t === d && s !== d || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== d && (s === d || a);
    a && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ee {
  constructor(t, i, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Z(this, t);
  }
}
const Ie = { I: rt }, Et = ht.litHtmlPolyfillSupport;
Et == null || Et(gt, rt), (ht.litHtmlVersions ?? (ht.litHtmlVersions = [])).push("3.3.2");
const Se = (e, t, i) => {
  const s = (i == null ? void 0 : i.renderBefore) ?? t;
  let a = s._$litPart$;
  if (a === void 0) {
    const o = (i == null ? void 0 : i.renderBefore) ?? null;
    s._$litPart$ = a = new rt(t.insertBefore(pt(), o), o, void 0, i ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const H = globalThis;
let f = class extends V {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var i;
    const t = super.createRenderRoot();
    return (i = this.renderOptions).renderBefore ?? (i.renderBefore = t.firstChild), t;
  }
  update(t) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Se(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return Y;
  }
};
var ee;
f._$litElement$ = !0, f.finalized = !0, (ee = H.litElementHydrateSupport) == null || ee.call(H, { LitElement: f });
const It = H.litElementPolyfillSupport;
It == null || It({ LitElement: f });
(H.litElementVersions ?? (H.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $ = (e) => (t, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Te = { attribute: !0, type: String, converter: bt, reflect: !1, hasChanged: Lt }, ze = (e = Te, t, i) => {
  const { kind: s, metadata: a } = i;
  let o = globalThis.litPropertyMetadata.get(a);
  if (o === void 0 && globalThis.litPropertyMetadata.set(a, o = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), o.set(i.name, e), s === "accessor") {
    const { name: r } = i;
    return { set(l) {
      const c = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(r, c, e, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(r, void 0, e, l), l;
    } };
  }
  if (s === "setter") {
    const { name: r } = i;
    return function(l) {
      const c = this[r];
      t.call(this, l), this.requestUpdate(r, c, e, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function w(e) {
  return (t, i) => typeof i == "object" ? ze(e, t, i) : ((s, a, o) => {
    const r = a.hasOwnProperty(o);
    return a.constructor.createProperty(o, s), r ? Object.getOwnPropertyDescriptor(a, o) : void 0;
  })(e, t, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function g(e) {
  return w({ ...e, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const De = { CHILD: 2 }, Le = (e) => (...t) => ({ _$litDirective$: e, values: t });
let Oe = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, i, s) {
    this._$Ct = t, this._$AM = i, this._$Ci = s;
  }
  _$AS(t, i) {
    return this.update(t, i);
  }
  update(t, i) {
    return this.render(...i);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Pe } = Ie, Gt = (e) => e, Zt = () => document.createComment(""), nt = (e, t, i) => {
  var o;
  const s = e._$AA.parentNode, a = t === void 0 ? e._$AB : t._$AA;
  if (i === void 0) {
    const r = s.insertBefore(Zt(), a), l = s.insertBefore(Zt(), a);
    i = new Pe(r, l, e, e.options);
  } else {
    const r = i._$AB.nextSibling, l = i._$AM, c = l !== e;
    if (c) {
      let p;
      (o = i._$AQ) == null || o.call(i, e), i._$AM = e, i._$AP !== void 0 && (p = e._$AU) !== l._$AU && i._$AP(p);
    }
    if (r !== a || c) {
      let p = i._$AA;
      for (; p !== r; ) {
        const h = Gt(p).nextSibling;
        Gt(s).insertBefore(p, a), p = h;
      }
    }
  }
  return i;
}, R = (e, t, i = e) => (e._$AI(t, i), e), qe = {}, Ne = (e, t = qe) => e._$AH = t, Me = (e) => e._$AH, St = (e) => {
  e._$AR(), e._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Kt = (e, t, i) => {
  const s = /* @__PURE__ */ new Map();
  for (let a = t; a <= i; a++) s.set(e[a], a);
  return s;
}, Re = Le(class extends Oe {
  constructor(e) {
    if (super(e), e.type !== De.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(e, t, i) {
    let s;
    i === void 0 ? i = t : t !== void 0 && (s = t);
    const a = [], o = [];
    let r = 0;
    for (const l of e) a[r] = s ? s(l, r) : r, o[r] = i(l, r), r++;
    return { values: o, keys: a };
  }
  render(e, t, i) {
    return this.dt(e, t, i).values;
  }
  update(e, [t, i, s]) {
    const a = Me(e), { values: o, keys: r } = this.dt(t, i, s);
    if (!Array.isArray(a)) return this.ut = r, o;
    const l = this.ut ?? (this.ut = []), c = [];
    let p, h, m = 0, _ = a.length - 1, b = 0, v = o.length - 1;
    for (; m <= _ && b <= v; ) if (a[m] === null) m++;
    else if (a[_] === null) _--;
    else if (l[m] === r[b]) c[b] = R(a[m], o[b]), m++, b++;
    else if (l[_] === r[v]) c[v] = R(a[_], o[v]), _--, v--;
    else if (l[m] === r[v]) c[v] = R(a[m], o[v]), nt(e, c[v + 1], a[m]), m++, v--;
    else if (l[_] === r[b]) c[b] = R(a[_], o[b]), nt(e, a[m], a[_]), _--, b++;
    else if (p === void 0 && (p = Kt(r, b, v), h = Kt(l, m, _)), p.has(l[m])) if (p.has(l[_])) {
      const L = h.get(r[b]), kt = L !== void 0 ? a[L] : null;
      if (kt === null) {
        const Nt = nt(e, a[m]);
        R(Nt, o[b]), c[b] = Nt;
      } else c[b] = R(kt, o[b]), nt(e, a[m], kt), a[L] = null;
      b++;
    } else St(a[_]), _--;
    else St(a[m]), m++;
    for (; b <= v; ) {
      const L = nt(e, c[v + 1]);
      R(L, o[b]), c[b++] = L;
    }
    for (; m <= _; ) {
      const L = a[m++];
      L !== null && St(L);
    }
    return this.ut = r, Ne(e, c), Y;
  }
}), B = {
  actionable: "mdi:play",
  recurring: "mdi:refresh",
  habit: "mdi:star-four-points",
  chore: "mdi:home",
  reminder: "mdi:bell",
  note: "mdi:note-text",
  someday: "mdi:clock-outline",
  shopping: "mdi:cart",
  gift: "mdi:gift"
}, K = {
  actionable: "var(--rgb-blue, 33, 150, 243)",
  recurring: "var(--rgb-deep-purple, 110, 65, 171)",
  habit: "var(--rgb-green, 76, 175, 80)",
  chore: "var(--rgb-orange, 255, 152, 0)",
  reminder: "var(--rgb-pink, 233, 30, 99)",
  note: "var(--rgb-purple, 146, 107, 199)",
  someday: "var(--rgb-blue-grey, 96, 125, 139)",
  shopping: "var(--rgb-teal, 0, 150, 136)",
  gift: "var(--rgb-amber, 255, 179, 0)"
};
function $t(e) {
  for (const t of e)
    if (t in B) return t;
  return null;
}
const O = I`
  :host {
    /* Mushroom RGB palette fallbacks — HA themes provide these;
       we define fallbacks so cards render correctly outside a theme. */
    --rgb-blue: 33, 150, 243;
    --rgb-green: 76, 175, 80;
    --rgb-orange: 255, 152, 0;
    --rgb-red: 244, 67, 54;
    --rgb-pink: 233, 30, 99;
    --rgb-purple: 146, 107, 199;
    --rgb-deep-purple: 110, 65, 171;
    --rgb-grey: 158, 158, 158;
    --rgb-blue-grey: 96, 125, 139;
    --rgb-disabled: 189, 189, 189;

    /* HA host theme tokens — these are inherited from HA's :root.
       We only define yahatl-scoped fallbacks to avoid circular self-refs.
       Components use the HA vars directly with inline fallbacks. */
    --rgb-primary-text-color: 33, 33, 33;
    --yahatl-card-bg: var(--ha-card-background, var(--card-background-color, white));
    --yahatl-border-radius: var(--ha-card-border-radius, 12px);
    --yahatl-border-width: var(--ha-card-border-width, 1px);
    --yahatl-border-color: var(--ha-card-border-color, rgba(0, 0, 0, 0.06));
    --yahatl-divider: var(--divider-color, rgba(0, 0, 0, 0.08));
    --yahatl-text: var(--primary-text-color, rgb(33, 33, 33));
    --yahatl-text-secondary: var(--secondary-text-color, rgb(114, 114, 114));
    /* Distinct internal names for the HA-provided RGB tokens: a custom
       property must not reference itself (self-referencing var() is a cycle,
       invalid at computed-value time), so we alias instead of shadowing. */
    --yahatl-rgb-primary: var(--rgb-primary-color, 3, 169, 244);
    --yahatl-rgb-accent: var(--rgb-accent-color, 255, 152, 0);
    color: var(--yahatl-text);

    /* Semantic action colors */
    --rgb-info: var(--rgb-blue);
    --rgb-success: var(--rgb-green);
    --rgb-warning: var(--rgb-orange);
    --rgb-danger: var(--rgb-red);

    /* Yahatl trait colors */
    --rgb-trait-actionable: var(--rgb-blue);
    --rgb-trait-recurring: var(--rgb-deep-purple);
    --rgb-trait-habit: var(--rgb-green);
    --rgb-trait-chore: var(--rgb-orange);
    --rgb-trait-reminder: var(--rgb-pink);
    --rgb-trait-note: var(--rgb-purple);

    /* Yahatl state colors */
    --rgb-state-overdue: var(--rgb-danger);
    --rgb-state-due-today: var(--rgb-warning);
    --rgb-state-blocked: var(--rgb-grey);
    --rgb-state-deferred: var(--rgb-blue-grey);
    --rgb-state-streak: var(--rgb-orange);
    --rgb-state-at-risk: var(--rgb-danger);
    --rgb-state-completed: var(--rgb-success);

    /* Priority-rail colors */
    --rgb-priority-high: var(--rgb-danger);
    --rgb-priority-medium: var(--rgb-warning);
    --rgb-priority-low: var(--rgb-success);

    /* Mushroom spacing / sizing tokens */
    --spacing: var(--mush-spacing, 10px);
    --icon-size: var(--mush-icon-size, 36px);
    --icon-border-radius: var(--mush-icon-border-radius, 50%);
    --badge-size: var(--mush-badge-size, 16px);
    --chip-spacing: var(--mush-chip-spacing, 8px);
    --chip-height: var(--mush-chip-height, 36px);
    --chip-border-radius: var(--mush-chip-border-radius, 19px);
    --control-border-radius: var(--mush-control-border-radius, 12px);
    --control-height: var(--mush-control-height, 42px);

    font-family: var(--paper-font-body1_-_font-family, Roboto, "Helvetica Neue", Arial, sans-serif);
    color: var(--yahatl-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Card surface ── */
  ha-card {
    background: var(--yahatl-card-bg);
    border-radius: var(--yahatl-border-radius);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 16px 6px;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 0.15px;
    color: var(--yahatl-text);
  }

  /* ── Shape icon (Mushroom circle badge) ── */
  .mush-shape-icon {
    width: var(--icon-size);
    height: var(--icon-size);
    border-radius: var(--icon-border-radius);
    background: rgba(var(--rgb-state, var(--yahatl-rgb-primary)), 0.20);
    color: rgb(var(--rgb-state, var(--yahatl-rgb-primary)));
    display: grid;
    place-items: center;
    font-size: 18px;
    line-height: 1;
    flex: none;
    transition: background-color 280ms ease-out;
  }

  .mush-shape-icon ha-icon {
    --mdc-icon-size: 20px;
    color: inherit;
  }

  .mush-shape-icon--sm {
    width: 24px;
    height: 24px;
    font-size: 13px;
  }

  .mush-shape-icon--sm ha-icon {
    --mdc-icon-size: 14px;
  }

  .mush-shape-icon .badge {
    position: absolute;
    top: -3px;
    right: -3px;
    width: var(--badge-size);
    height: var(--badge-size);
    border-radius: 50%;
    background: rgb(var(--rgb-warning));
    border: 2px solid var(--yahatl-card-bg);
  }

  /* ── State info (primary + secondary text) ── */
  .mush-state-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .mush-state-info__primary {
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
    letter-spacing: 0.1px;
    color: var(--yahatl-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mush-state-info__secondary {
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.4px;
    color: var(--yahatl-text);
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── State item row (icon + info) ── */
  .mush-state-item {
    display: flex;
    align-items: center;
    padding: var(--spacing);
    gap: var(--spacing);
  }

  /* ── Mushroom chips ── */
  .mush-chip {
    box-sizing: border-box;
    height: var(--chip-height);
    border-radius: var(--chip-border-radius);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--yahatl-card-bg);
    border: var(--yahatl-border-width) solid var(--yahatl-border-color);
    color: var(--yahatl-text);
    padding: 0 14px;
    cursor: pointer;
    font-weight: 500;
    font-size: 15px;
    letter-spacing: 0.1px;
    line-height: 1;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  }

  .mush-chip:active {
    opacity: 0.8;
  }

  .mush-chip__icon {
    font-size: 18px;
    line-height: 0;
    color: var(--yahatl-text);
  }

  .mush-chip__icon ha-icon {
    --mdc-icon-size: 18px;
    color: inherit;
  }

  .mush-chip--state .mush-chip__icon {
    color: rgb(var(--rgb-state));
  }

  .mush-chip--filled {
    background: rgba(var(--rgb-state), 0.20);
    border-color: transparent;
    color: rgb(var(--rgb-state));
  }

  .mush-chip--filled .mush-chip__icon {
    color: rgb(var(--rgb-state));
  }

  .mush-chip__count {
    font-size: 11px;
    font-weight: 700;
    background: rgba(var(--rgb-state), 0.20);
    color: rgb(var(--rgb-state));
    padding: 2px 7px;
    border-radius: 10px;
  }

  .chips-strip {
    display: flex;
    gap: var(--chip-spacing);
    flex-wrap: wrap;
    padding: 0 16px 12px;
  }

  /* ── Priority rail ── */
  .priority-rail {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
  }

  .priority-rail--high { background: rgb(var(--rgb-priority-high)); }
  .priority-rail--medium { background: rgb(var(--rgb-priority-medium)); }
  .priority-rail--low { background: rgb(var(--rgb-priority-low)); }

  /* ── Queue score badge ── */
  .queue-score {
    font-size: 11px;
    font-weight: 700;
    background: rgba(var(--yahatl-rgb-primary), 0.10);
    color: rgb(var(--yahatl-rgb-primary));
    padding: 3px 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  /* ── Queue / action button ── */
  .queue-btn {
    border: 0;
    border-radius: 8px;
    padding: 8px 14px;
    background: rgba(var(--yahatl-rgb-primary), 0.20);
    color: rgb(var(--yahatl-rgb-primary));
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    letter-spacing: 0.1px;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 120ms;
  }

  .queue-btn:active {
    opacity: 0.7;
  }

  /* ── Meta text (secondary info line in queue rows) ── */
  .queue-meta {
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0.4px;
    color: var(--yahatl-text-secondary);
  }

  .queue-meta .sep {
    opacity: 0.4;
    margin: 0 4px;
  }

  .queue-meta .overdue {
    color: rgb(var(--rgb-state-overdue));
    font-weight: 500;
  }

  .queue-meta .due-today {
    color: rgb(var(--rgb-state-due-today));
    font-weight: 500;
  }

  /* ── Check circle (list items) ── */
  .item-check {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--yahatl-divider);
    flex: none;
    cursor: pointer;
    display: grid;
    place-items: center;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 200ms ease, border-color 200ms ease;
  }

  .item-check--done {
    background: rgb(var(--rgb-success));
    border-color: rgb(var(--rgb-success));
  }

  .item-check--done::after {
    content: "\\2713";
    color: white;
    font-size: 11px;
    font-weight: bold;
  }

  /* ── Forms (editor / capture) ── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field__label {
    font-size: 13px;
    color: var(--yahatl-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 500;
  }

  .input,
  .textarea,
  .select {
    padding: 11px 13px;
    border: 1px solid var(--yahatl-divider);
    border-radius: 10px;
    font-family: inherit;
    font-size: 16px;
    background: var(--yahatl-card-bg);
    color: var(--yahatl-text);
    width: 100%;
    box-sizing: border-box;
    -webkit-appearance: none;
  }

  .input:focus,
  .textarea:focus,
  .select:focus {
    outline: none;
    border-color: rgb(var(--yahatl-rgb-primary));
  }

  .textarea {
    resize: vertical;
    min-height: 64px;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* ── Trait toggle pills (editor) ── */
  .trait-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid var(--yahatl-divider);
    background: var(--yahatl-card-bg);
    font-size: 15px;
    cursor: pointer;
    color: var(--yahatl-text-secondary);
    letter-spacing: 0.1px;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  }

  .trait-toggle.is-on {
    background: rgba(var(--rgb-state), 0.20);
    color: rgb(var(--rgb-state));
    border-color: transparent;
  }

  .trait-toggle ha-icon {
    --mdc-icon-size: 18px;
    color: inherit;
  }

  /* ── Tag chips ── */
  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(var(--rgb-primary-text-color), 0.05);
    color: var(--yahatl-text);
    font-size: 13px;
    border-radius: 4px;
    letter-spacing: 0.4px;
  }

  .tag-chip__remove {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 1em;
    color: var(--yahatl-text-secondary);
    opacity: 0.5;
    line-height: 1;
  }

  /* ── Buttons (modal footer etc) ── */
  .btn {
    padding: 10px 20px;
    border: 0;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.1px;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .btn--primary {
    background: rgb(var(--yahatl-rgb-primary));
    color: white;
  }

  .btn--ghost {
    background: rgba(var(--rgb-primary-text-color), 0.05);
    color: var(--yahatl-text);
  }

  .btn--danger {
    background: transparent;
    color: rgb(var(--rgb-danger));
  }

  .btn:active {
    opacity: 0.8;
  }

  /* ── Store error banner (dismissible, rendered via renderStoreError) ── */
  .store-error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 16px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(var(--rgb-danger), 0.12);
    color: rgb(var(--rgb-danger));
    font-size: 13px;
    font-weight: 500;
  }

  .store-error ha-icon {
    --mdc-icon-size: 18px;
    flex: none;
  }

  .store-error__msg {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .store-error__dismiss {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 2px 4px;
    flex: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Empty state ── */
  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--yahatl-text-secondary);
    font-size: 15px;
  }

  /* ── Keyboard focus ── */
  /* Divs promoted to role="button" (and real buttons) get a visible focus
     ring for keyboard users without flashing outlines on taps/clicks. */
  button:focus-visible,
  [role="button"]:focus-visible {
    outline: 2px solid rgb(var(--yahatl-rgb-primary));
    outline-offset: -2px;
  }

  /* ── Screen-reader only ── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;
class je {
  constructor(t) {
    this.hass = t;
  }
  get userId() {
    return this.hass.user.id;
  }
  // --- Lists ---
  async getLists() {
    return this.hass.callWS({
      type: "yahatl/lists",
      user_id: this.userId
    });
  }
  // --- Items ---
  async getItems(t, i) {
    return this.hass.callWS({
      type: "yahatl/items_list",
      entity_id: t,
      ...i
    });
  }
  async getItemDetails(t, i) {
    return this.hass.callWS({
      type: "yahatl/item_details",
      entity_id: t,
      item_id: i
    });
  }
  async createItem(t, i) {
    return this.hass.callWS({
      type: "yahatl/item_create",
      entity_id: t,
      ...i
    });
  }
  async saveItem(t, i, s) {
    return this.hass.callWS({
      type: "yahatl/item_save",
      entity_id: t,
      item_id: i,
      ...s
    });
  }
  async deleteItem(t, i) {
    await this.hass.callWS({
      type: "yahatl/item_delete",
      entity_id: t,
      item_id: i
    });
  }
  async completeItem(t, i) {
    return this.hass.callWS({
      type: "yahatl/item_complete",
      entity_id: t,
      item_id: i,
      user_id: this.userId
    });
  }
  /** Undo a completion: restore the item to its pre-completion state.
   *  `prior` holds the status/due/deferred_until captured BEFORE completing. */
  async uncompleteItem(t, i, s) {
    return this.hass.callWS({
      type: "yahatl/item_uncomplete",
      entity_id: t,
      item_id: i,
      prior: s
    });
  }
  async deferItem(t, i, s) {
    return this.hass.callWS({
      type: "yahatl/item_defer",
      entity_id: t,
      item_id: i,
      deferred_until: s
    });
  }
  /** Delay an item to its next valid period (computed server-side from its
   *  schedule). Returns the updated item, incl. the new deferred_until. */
  async delayItem(t, i) {
    return this.hass.callWS({
      type: "yahatl/item_delay",
      entity_id: t,
      item_id: i
    });
  }
  // --- Queue ---
  async getQueue(t) {
    return this.hass.callWS({
      type: "yahatl/queue",
      user_id: this.userId,
      ...t
    });
  }
  // --- Context ---
  async getContext() {
    return this.hass.callWS({ type: "yahatl/context_get" });
  }
  async setContext(t) {
    return this.hass.callWS({
      type: "yahatl/context_set",
      ...t
    });
  }
  // --- Meta config ---
  async getMeta() {
    return this.hass.callWS({ type: "yahatl/meta_get" });
  }
  async setMeta(t, i) {
    return this.hass.callWS({
      type: "yahatl/meta_set",
      data: t,
      ...i && Object.keys(i).length > 0 ? { renames: i } : {}
    });
  }
  // --- Tags ---
  async getTags() {
    return this.hass.callWS({ type: "yahatl/tags_list" });
  }
  async renameTag(t, i) {
    await this.hass.callWS({
      type: "yahatl/tag_rename",
      old_name: t,
      new_name: i
    });
  }
  async deleteTag(t) {
    await this.hass.callWS({
      type: "yahatl/tag_delete",
      name: t
    });
  }
}
class He {
  constructor() {
    this._api = null, this._hass = null, this._subscribers = /* @__PURE__ */ new Set(), this._queueGen = 0, this._pushConn = null, this._pushUnavailable = !1, this._pushDebounce = null, this._pushedListIds = /* @__PURE__ */ new Set(), this._pushedMeta = !1, this._filterFetches = /* @__PURE__ */ new Map(), this._tagsLoaded = !1, this.state = {
      lists: [],
      items: /* @__PURE__ */ new Map(),
      filteredItems: /* @__PURE__ */ new Map(),
      queue: null,
      context: null,
      meta: null,
      tags: [],
      loading: !1,
      lastError: null
    };
  }
  get api() {
    return this._api;
  }
  get hass() {
    return this._hass;
  }
  setHass(t) {
    this._hass = t, this._api = new je(t), this._ensureSubscribed();
  }
  // --- Live updates (yahatl/subscribe push events) ---
  /** Open the single push subscription, once per connection object. Safe to
   *  call from every setHass: it no-ops unless the connection changed. */
  _ensureSubscribed() {
    var i;
    const t = (i = this._hass) == null ? void 0 : i.connection;
    !t || this._pushUnavailable || this._pushConn !== t && (this._pushConn = t, t.subscribeMessage(
      (s) => this._onPushEvent(s),
      { type: "yahatl/subscribe" }
    ).catch((s) => {
      this._pushConn = null, this._pushUnavailable = !0, console.info(
        "yahatl: live updates unavailable (%s) — continuing without them",
        (s == null ? void 0 : s.code) || (s == null ? void 0 : s.message) || s
      );
    }));
  }
  /** Collect pushed list ids and debounce ~400ms so save bursts coalesce
   *  into one round of refreshes. */
  _onPushEvent(t) {
    t != null && t.list_id && (t.list_id === "meta" ? this._pushedMeta = !0 : this._pushedListIds.add(t.list_id), this._pushDebounce !== null && window.clearTimeout(this._pushDebounce), this._pushDebounce = window.setTimeout(() => {
      this._pushDebounce = null, this._refreshFromPush();
    }, 400));
  }
  /** Refresh only what some card has actually loaded. Individual loads carry
   *  their own error handling and generation guards. */
  async _refreshFromPush() {
    const t = [...this._pushedListIds], i = this._pushedMeta;
    this._pushedListIds.clear(), this._pushedMeta = !1;
    const s = [];
    i && (this.state.meta && s.push(this.loadMeta()), this.state.context && s.push(this.loadContext()));
    for (const a of t) {
      const o = `todo.${a}`;
      this.state.items.has(o) && s.push(this.loadItems(o));
      for (const r of this._filterFetches.values())
        r.entityId === o && s.push(this.loadItems(o, r.filters));
    }
    t.length > 0 && (this.state.lists.length > 0 && s.push(this.loadLists()), this.state.queue && s.push(this.loadQueue()), this._tagsLoaded && s.push(this.loadTags())), await Promise.all(s);
  }
  subscribe(t) {
    return this._subscribers.add(t), () => this._subscribers.delete(t);
  }
  _notify() {
    for (const t of this._subscribers) t();
  }
  // --- Error surface ---
  _setError(t) {
    const i = (t == null ? void 0 : t.message) || String(t) || "Unknown error";
    this.state.lastError = { message: i, at: Date.now() }, this._notify();
  }
  clearError() {
    this.state.lastError && (this.state.lastError = null, this._notify());
  }
  _notReady() {
    return this._setError(new Error("Not connected to Home Assistant yet")), !1;
  }
  // --- Items cache keys ---
  _hasFilters(t) {
    return !!t && Object.keys(t).length > 0;
  }
  /** Stable cache key for a filtered items fetch (sorted keys → stable sig). */
  _filterKey(t, i) {
    const s = i, a = Object.keys(s).sort().map((o) => `${o}=${JSON.stringify(s[o])}`).join("&");
    return `${t}|${a}`;
  }
  /** Cached items for an entity. Filtered fetches live in their own map so
   *  they never overwrite the full lists other cards render (and vice versa). */
  getCachedItems(t, i) {
    return (this._hasFilters(i) ? this.state.filteredItems.get(this._filterKey(t, i)) : this.state.items.get(t)) ?? [];
  }
  // --- Data loading (failures land in state.lastError) ---
  async loadLists() {
    if (this._api)
      try {
        this.state.lists = await this._api.getLists(), this._notify();
      } catch (t) {
        this._setError(t);
      }
  }
  async loadItems(t, i) {
    if (this._api)
      try {
        const s = await this._api.getItems(t, i);
        if (this._hasFilters(i)) {
          const a = this._filterKey(t, i);
          this.state.filteredItems.set(a, s), this._filterFetches.set(a, { entityId: t, filters: i });
        } else
          this.state.items.set(t, s);
        this._notify();
      } catch (s) {
        this._setError(s);
      }
  }
  async loadQueue(t) {
    if (!this._api) return;
    const i = ++this._queueGen;
    try {
      const s = await this._api.getQueue(t);
      if (i !== this._queueGen) return;
      this.state.queue = s, this._notify();
    } catch (s) {
      if (i !== this._queueGen) return;
      this._setError(s);
    }
  }
  async loadContext() {
    if (this._api)
      try {
        this.state.context = await this._api.getContext(), this._notify();
      } catch (t) {
        this._setError(t);
      }
  }
  async loadMeta() {
    if (this._api)
      try {
        this.state.meta = await this._api.getMeta(), this._notify();
      } catch (t) {
        this._setError(t);
      }
  }
  async loadTags() {
    if (this._api)
      try {
        this.state.tags = await this._api.getTags(), this._tagsLoaded = !0, this._notify();
      } catch (t) {
        this._setError(t);
      }
  }
  // --- Mutations (call API then refresh) ---
  // Each returns true on success; on failure it records state.lastError and
  // returns false so callers can keep drafts / stay open instead of silently
  // pretending the write happened.
  async createItem(t, i) {
    if (!this._api) return this._notReady();
    try {
      await this._api.createItem(t, i);
    } catch (s) {
      return this._setError(s), !1;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), !0;
  }
  async saveItem(t, i, s) {
    if (!this._api) return this._notReady();
    try {
      await this._api.saveItem(t, i, s);
    } catch (a) {
      return this._setError(a), !1;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), !0;
  }
  async deleteItem(t, i) {
    if (!this._api) return this._notReady();
    try {
      await this._api.deleteItem(t, i);
    } catch (s) {
      return this._setError(s), !1;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), !0;
  }
  async completeItem(t, i) {
    if (!this._api) return this._notReady();
    const s = this.state.queue;
    this.state.queue && (this.state.queue = {
      ...this.state.queue,
      items: this.state.queue.items.filter((a) => a.item.uid !== i)
    }, this._notify());
    try {
      await this._api.completeItem(t, i);
    } catch (a) {
      return this.state.queue = s, this._setError(a), !1;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), !0;
  }
  /** Undo a completion: restore the item's pre-completion state (`prior` is
   *  captured from the item dict before completeItem ran). */
  async uncompleteItem(t, i, s) {
    if (!this._api) return this._notReady();
    try {
      await this._api.uncompleteItem(t, i, s);
    } catch (a) {
      return this._setError(a), !1;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), !0;
  }
  async deferItem(t, i, s) {
    if (!this._api) return this._notReady();
    try {
      await this._api.deferItem(t, i, s);
    } catch (a) {
      return this._setError(a), !1;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), !0;
  }
  /** Delay to next valid period (server-computed). Returns the new
   *  deferred_until ISO string so the UI can confirm when it'll be back,
   *  or null on failure (state.lastError is set, queue rolled back). */
  async delayItem(t, i) {
    if (!this._api)
      return this._notReady(), null;
    const s = this.state.queue;
    this.state.queue && (this.state.queue = {
      ...this.state.queue,
      items: this.state.queue.items.filter((o) => o.item.uid !== i)
    }, this._notify());
    let a;
    try {
      a = await this._api.delayItem(t, i);
    } catch (o) {
      return this.state.queue = s, this._setError(o), null;
    }
    return this.clearError(), await this.loadItems(t), await this.loadQueue(), (a == null ? void 0 : a.deferred_until) ?? null;
  }
  async setContext(t) {
    if (!this._api) return this._notReady();
    try {
      this.state.context = await this._api.setContext(t), this._notify();
    } catch (i) {
      return this._setError(i), !1;
    }
    return this.clearError(), await this.loadQueue(), !0;
  }
  async saveMeta(t, i) {
    if (!this._api) return this._notReady();
    try {
      this.state.meta = await this._api.setMeta(t, i), this._notify();
    } catch (s) {
      return this._setError(s), !1;
    }
    return this.clearError(), await this.loadQueue(), !0;
  }
  async renameTag(t, i) {
    if (!this._api) return this._notReady();
    try {
      await this._api.renameTag(t, i);
    } catch (s) {
      return this._setError(s), !1;
    }
    return this.clearError(), await this.loadTags(), !0;
  }
  async deleteTag(t) {
    if (!this._api) return this._notReady();
    try {
      await this._api.deleteTag(t);
    } catch (i) {
      return this._setError(i), !1;
    }
    return this.clearError(), await this.loadTags(), !0;
  }
  async getItemDetails(t, i) {
    return this._api ? this._api.getItemDetails(t, i) : null;
  }
}
const u = new He();
function X() {
  const e = u.state.lastError;
  return e ? n`
    <div class="store-error" role="alert" aria-live="polite">
      <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
      <span class="store-error__msg">${e.message}</span>
      <button
        class="store-error__dismiss"
        aria-label="Dismiss error"
        @click=${() => u.clearError()}
      >
        &times;
      </button>
    </div>
  ` : d;
}
class W {
  constructor(t) {
    this.host = t, t.addController(this);
  }
  hostConnected() {
    this._unsub = u.subscribe(() => this.host.requestUpdate());
  }
  hostDisconnected() {
    var t;
    (t = this._unsub) == null || t.call(this);
  }
  get state() {
    return u.state;
  }
}
function Pt(e) {
  if (!e) return null;
  const t = new Date(e);
  if (isNaN(t.getTime())) return null;
  const i = /* @__PURE__ */ new Date(), s = (o) => new Date(o.getFullYear(), o.getMonth(), o.getDate()).getTime(), a = Math.round((s(t) - s(i)) / 864e5);
  if (a < 0)
    return { label: `Overdue ${-a}d`, className: "overdue" };
  if (a === 0) {
    if (t.getTime() < i.getTime()) {
      const o = Math.floor((i.getTime() - t.getTime()) / 36e5);
      return {
        label: o >= 1 ? `Overdue ${o}h` : "Overdue",
        className: "overdue"
      };
    }
    return { label: "Today", className: "due-today" };
  }
  return a === 1 ? { label: "Tomorrow", className: "" } : { label: t.toLocaleDateString(), className: "" };
}
function J(e) {
  return (t) => {
    t.key !== "Enter" && t.key !== " " || (t.preventDefault(), e(t));
  };
}
var Ue = Object.defineProperty, Ye = Object.getOwnPropertyDescriptor, wt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Ye(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && Ue(t, i, a), a;
};
const Be = 6e3;
let tt = class extends f {
  constructor() {
    super(...arguments), this._message = "", this._action = null, this._open = !1, this._hideTimer = null;
  }
  show(e, t) {
    this._message = e, this._action = t, this._open = !0, this._hideTimer !== null && window.clearTimeout(this._hideTimer), this._hideTimer = window.setTimeout(() => this._dismiss(), Be);
  }
  _dismiss() {
    this._hideTimer !== null && window.clearTimeout(this._hideTimer), this._hideTimer = null, this._open = !1;
  }
  async _runAction() {
    const e = this._action;
    this._dismiss(), e && await e.run();
  }
  render() {
    return n`
      <div role="status" aria-live="polite">
        ${this._open ? n`
              <div class="bar">
                <span class="bar__msg">${this._message}</span>
                ${this._action ? n`
                      <button class="bar__action" @click=${this._runAction}>
                        ${this._action.label}
                      </button>
                    ` : d}
              </div>
            ` : d}
      </div>
    `;
  }
};
tt.styles = I`
    :host {
      position: fixed;
      left: 0;
      right: 0;
      /* Above HA's mobile bottom tab bar and the iOS home-indicator inset. */
      bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 999;
      font-family: var(
        --paper-font-body1_-_font-family,
        Roboto,
        "Helvetica Neue",
        Arial,
        sans-serif
      );
    }

    .bar {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: min(480px, calc(100vw - 32px));
      padding: 10px 8px 10px 16px;
      border-radius: 10px;
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      font-size: 14px;
      animation: rise 180ms ease-out;
    }

    @keyframes rise {
      from {
        transform: translateY(8px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .bar__msg {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bar__action {
      flex: none;
      border: none;
      background: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.6px;
      color: var(--primary-color, #03a9f4);
      -webkit-tap-highlight-color: transparent;
    }

    .bar__action:active {
      opacity: 0.7;
    }

    .bar__action:focus-visible {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: -2px;
    }
  `;
wt([
  g()
], tt.prototype, "_message", 2);
wt([
  g()
], tt.prototype, "_action", 2);
wt([
  g()
], tt.prototype, "_open", 2);
tt = wt([
  $("yahatl-snackbar")
], tt);
let lt = null;
function ne(e, t = null) {
  (!lt || !lt.isConnected) && (lt = document.createElement("yahatl-snackbar"), document.body.appendChild(lt)), lt.show(e, t);
}
function Fe(e, t, i) {
  e.dispatchEvent(
    new CustomEvent(t, {
      detail: i,
      bubbles: !0,
      composed: !0,
      cancelable: !1
    })
  );
}
let ct = null;
function G(e, t) {
  (!ct || !ct.isConnected) && (ct = document.createElement("yahatl-item-editor"), document.body.appendChild(ct)), Promise.resolve(ct.open(t)).catch((i) => {
    console.error("yahatl: failed to open item editor", i);
  });
}
var We = Object.defineProperty, Qe = Object.getOwnPropertyDescriptor, z = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Qe(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && We(t, i, a), a;
};
let C = class extends f {
  constructor() {
    super(...arguments), this._config = {}, this._quickAddValue = "", this._quickAddBusy = !1, this._flash = "", this._showUpcoming = !1, this._store = new W(this), this._initialized = !1, this._drag = {
      id: "",
      entity: "",
      startX: 0,
      startY: 0,
      dx: 0,
      active: !1,
      moved: !1,
      el: null
    };
  }
  setConfig(e) {
    this._config = e;
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadQueue(), u.loadLists(), u.loadMeta()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  render() {
    var l, c, p;
    const e = this._store.state.queue, t = this._config.max_items || 10, i = this._config.title || "Up Next", s = this._config.todo_entity || "", a = (e == null ? void 0 : e.items.slice(0, t)) || [], o = (c = (l = this.hass) == null ? void 0 : l.user) == null ? void 0 : c.name, r = this._store.state.context;
    return n`
      <ha-card>
        <div class="card-header">${i}</div>
        ${o ? n`<div class="greeting">Hello, ${o}</div>` : d}
        ${X()}
        ${this._flash ? n`<div class="flash">${this._flash}</div>` : d}

        <div class="queue-controls" style="padding-top: 10px">
          <select @change=${(h) => this._setLocation(h.target.value)}>
            <option value="">Location: any</option>
            ${this._getZones().map(
      (h) => n`<option value=${h.id} ?selected=${(r == null ? void 0 : r.location) === h.id}>${h.name}</option>`
    )}
          </select>
          <select @change=${(h) => this._setContextFilter(h.target.value)}>
            <option value="">Context: any</option>
            ${(((p = this._store.state.meta) == null ? void 0 : p.contexts) || []).map(
      (h) => n`<option value=${h.id} ?selected=${((r == null ? void 0 : r.contexts) || []).includes(h.id)}>${h.name}</option>`
    )}
          </select>
        </div>

        <div class="capture-row">
          <input
            type="text"
            placeholder="Quick add a task…"
            .value=${this._quickAddValue}
            @input=${(h) => this._quickAddValue = h.target.value}
            @keydown=${(h) => {
      h.key === "Enter" && this._quickAdd(s);
    }}
            ?disabled=${this._quickAddBusy}
          />
          <button
            @click=${() => this._quickAdd(s)}
            ?disabled=${this._quickAddBusy || !this._quickAddValue.trim()}
          >
            add
          </button>
        </div>

        ${a.length === 0 ? n`<div class="empty-state">Nothing in the queue</div>` : Re(
      a,
      (h) => h.item.uid,
      (h, m) => this._renderItem(h, m, s)
    )}
        ${this._renderUpcoming(e)}
      </ha-card>
    `;
  }
  /** Collapsible "Not yet" group: items a blocker (lead-time, time window,
   *  dependency) is holding out of the queue, each with its reason. */
  _renderUpcoming(e) {
    const t = (e == null ? void 0 : e.upcoming) || [];
    return t.length ? n`
      <button
        class="upcoming-header ${this._showUpcoming ? "upcoming-header--open" : ""}"
        @click=${() => this._showUpcoming = !this._showUpcoming}
      >
        <ha-icon icon="mdi:clock-outline"></ha-icon>
        <span class="upcoming-header__label">Not yet</span>
        <span class="upcoming-header__count">${t.length}</span>
        <ha-icon class="upcoming-header__chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${this._showUpcoming ? t.map(
      (i) => n`
              <div
                class="upcoming-row"
                role="button"
                tabindex="0"
                @click=${() => G(this, {
        entityId: `todo.${i.list_id}`,
        itemId: i.item.uid,
        hass: this.hass
      })}
                @keydown=${J(() => G(this, {
        entityId: `todo.${i.list_id}`,
        itemId: i.item.uid,
        hass: this.hass
      }))}
              >
                <span class="upcoming-row__title">${i.item.title}</span>
                <span class="upcoming-row__reason">${i.reason || "not yet"}</span>
              </div>
            `
    ) : d}
    ` : d;
  }
  _renderItem(e, t, i) {
    const s = e.item, a = $t(s.traits), o = a ? K[a] : "var(--yahatl-rgb-primary)", r = a ? B[a] : "mdi:checkbox-marked-circle-outline", l = Pt(s.due), c = e.list_id ? `todo.${e.list_id}` : i;
    return n`
      <div class="queue-item">
        <div class="swipe-hint swipe-hint--done">
          <ha-icon icon="mdi:check"></ha-icon> Done
        </div>
        <div class="swipe-hint swipe-hint--delay">
          Delay <ha-icon icon="mdi:clock-outline"></ha-icon>
        </div>
        <div
          class="queue-item__fg"
          style="--rgb-state: ${o}"
          role="button"
          tabindex="0"
          @click=${() => this._onItemClick(c, s.uid)}
          @keydown=${J(() => this._openEditor(c, s.uid))}
          @touchstart=${(p) => this._onTouchStart(p, c, s.uid)}
          @touchmove=${(p) => this._onTouchMove(p)}
          @touchend=${() => this._onTouchEnd()}
          @touchcancel=${() => this._onTouchEnd()}
        >
        ${s.priority ? n`<div class="priority-rail priority-rail--${s.priority}"></div>` : d}
        <div class="queue-rank">${t + 1}</div>
        <div class="mush-shape-icon">
          <ha-icon icon=${r}></ha-icon>
        </div>
        <div class="queue-info">
          <div class="mush-state-info__primary">${s.title}</div>
          <div class="queue-meta">
            ${l ? n`<span class=${l.className}>${l.label}</span>` : d}
            ${l && (s.time_estimate || s.tags.length) ? n`<span class="sep">·</span>` : d}
            ${s.time_estimate ? n`<span>${s.time_estimate}m</span>` : d}
            ${s.time_estimate && s.tags.length ? n`<span class="sep">·</span>` : d}
            ${s.tags.length > 0 ? n`<span>${s.tags.map((p) => `#${p}`).join(" ")}</span>` : d}
            ${s.current_streak > 0 ? n`<span class="sep">·</span><span>${s.current_streak} day streak</span>` : d}
          </div>
        </div>
        <div class="queue-actions">
          <button
            class="queue-btn queue-btn--ghost"
            title="Delay to the next time this task is schedulable"
            @click=${(p) => {
      p.stopPropagation(), this._delay(c, s.uid);
    }}
          >
            delay
          </button>
          <button
            class="queue-btn"
            @click=${(p) => {
      p.stopPropagation(), this._complete(c, s.uid);
    }}
          >
            done
          </button>
        </div>
        </div>
      </div>
    `;
  }
  async _complete(e, t) {
    var o;
    const i = (o = this._store.state.queue) == null ? void 0 : o.items.find(
      (r) => r.item.uid === t
    ), s = i == null ? void 0 : i.item;
    if (await u.completeItem(e, t) && s) {
      const r = {
        status: s.status,
        due: s.due ?? null,
        deferred_until: s.deferred_until ?? null
      };
      ne(`Completed "${s.title}"`, {
        label: "UNDO",
        // Failures surface via the store's lastError banner.
        run: () => u.uncompleteItem(e, t, r)
      });
    }
  }
  // --- Swipe gestures ---
  _onItemClick(e, t) {
    if (this._drag.moved) {
      this._drag.moved = !1;
      return;
    }
    this._openEditor(e, t);
  }
  _onTouchStart(e, t, i) {
    const s = e.touches[0], a = e.currentTarget;
    a.style.transition = "", this._drag = {
      id: i,
      entity: t,
      startX: s.clientX,
      startY: s.clientY,
      dx: 0,
      active: !0,
      moved: !1,
      el: a
    };
  }
  _onTouchMove(e) {
    const t = this._drag;
    if (!t.active || !t.el) return;
    const i = e.touches[0], s = i.clientX - t.startX, a = i.clientY - t.startY;
    if (!t.moved && Math.abs(s) < Math.abs(a)) {
      t.active = !1;
      return;
    }
    if (Math.abs(s) > 6 && (t.moved = !0), !t.moved) return;
    e.preventDefault(), t.dx = s;
    const o = C.SWIPE_MAX, r = Math.max(-o, Math.min(o, s));
    t.el.style.transform = `translateX(${r}px)`;
    const l = t.el.parentElement;
    if (l) {
      const c = Math.min(1, Math.abs(r) / C.SWIPE_THRESHOLD), p = l.querySelector(".swipe-hint--done"), h = l.querySelector(".swipe-hint--delay");
      p && (p.style.opacity = s > 0 ? String(c) : "0"), h && (h.style.opacity = s < 0 ? String(c) : "0");
    }
  }
  _onTouchEnd() {
    const e = this._drag;
    if (!e.active || !e.el) {
      e.active = !1;
      return;
    }
    const t = e.el, i = t.parentElement, s = C.SWIPE_THRESHOLD, a = e.dx <= -s, o = e.dx >= s;
    t.style.transition = "transform 180ms ease", t.style.transform = "translateX(0)", window.setTimeout(() => {
      if (t.style.transition = "", i) {
        const c = i.querySelector(".swipe-hint--done"), p = i.querySelector(".swipe-hint--delay");
        c && (c.style.opacity = "0"), p && (p.style.opacity = "0");
      }
    }, 180);
    const { entity: r, id: l } = e;
    e.active = !1, a ? this._delay(r, l) : o ? this._complete(r, l) : e.moved || (this._drag.moved = !0, this._openEditor(r, l));
  }
  async _delay(e, t) {
    const i = await u.delayItem(e, t);
    i && (this._flash = `Delayed until ${this._formatDelayTarget(i)}`, window.setTimeout(() => {
      this._flash = "";
    }, 3500));
  }
  /** Friendly label for a delay target, e.g. "Sunday" or "Monday 9am". */
  _formatDelayTarget(e) {
    const t = new Date(e), i = t.toLocaleDateString(void 0, { weekday: "long" });
    if (t.getHours() === 0 && t.getMinutes() === 0) return i;
    const s = t.toLocaleTimeString(void 0, {
      hour: "numeric",
      ...t.getMinutes() ? { minute: "2-digit" } : {}
    });
    return `${i} ${s}`;
  }
  async _quickAdd(e) {
    var s;
    const t = this._quickAddValue.trim();
    if (!t) return;
    const i = e || ((s = this._store.state.lists[0]) == null ? void 0 : s.entity_id);
    if (i) {
      this._quickAddBusy = !0;
      try {
        await u.createItem(i, { title: t, needs_detail: !0 }) && (this._quickAddValue = "");
      } finally {
        this._quickAddBusy = !1;
      }
    }
  }
  _getZones() {
    var t;
    if (!((t = this.hass) != null && t.states)) return [];
    const e = [];
    for (const [i, s] of Object.entries(this.hass.states))
      if (i.startsWith("zone.")) {
        const a = s.attributes.friendly_name || i.replace("zone.", "");
        e.push({ id: a.toLowerCase(), name: a });
      }
    return e;
  }
  async _setLocation(e) {
    await u.setContext({ location: e || null });
  }
  async _setContextFilter(e) {
    e ? await u.setContext({ contexts: [e] }) : await u.setContext({ contexts: [] });
  }
  _openEditor(e, t) {
    G(this, { entityId: e, itemId: t, hass: this.hass });
  }
  // --- Lovelace card editor support ---
  // Makes the card fully configurable from the UI card picker rather than
  // hand-written YAML: getStubConfig seeds sensible defaults when the card is
  // first added, getConfigElement supplies the ha-form visual editor below.
  static getConfigElement() {
    return document.createElement("yahatl-queue-card-editor");
  }
  static getStubConfig(e) {
    const t = (e == null ? void 0 : e.states) ?? {};
    return { todo_entity: Object.keys(t).find((s) => s.startsWith("todo.") && s.includes("yahatl")) ?? "todo.yahatl", title: "Up Next", max_items: 8 };
  }
  getCardSize() {
    return 4;
  }
};
C.SWIPE_THRESHOLD = 80;
C.SWIPE_MAX = 140;
C.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .queue-controls {
        display: flex;
        gap: 8px;
        padding: 0 16px 12px;
        flex-wrap: wrap;
      }

      .queue-controls select {
        padding: 7px 10px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-size: 13px;
        font-family: inherit;
      }

      .capture-row {
        display: flex;
        gap: 8px;
        padding: 0 16px 14px;
      }

      .capture-row input {
        flex: 1;
        padding: 9px 12px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-size: 14px;
        font-family: inherit;
        -webkit-appearance: none;
      }

      .capture-row input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.20);
        color: rgb(var(--yahatl-rgb-primary));
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }

      .capture-row button:active {
        opacity: 0.7;
      }

      .queue-item {
        position: relative;
        border-top: 1px solid var(--yahatl-divider);
        overflow: hidden;
      }

      /* Foreground row (slides during swipe) */
      .queue-item__fg {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
        cursor: pointer;
        position: relative;
        background: var(--yahatl-card-bg);
        transition: background-color 120ms ease;
        -webkit-tap-highlight-color: transparent;
        touch-action: pan-y;
      }

      .queue-item__fg:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.05);
      }

      /* Swipe reveal layers behind the row */
      .swipe-hint {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 22px;
        color: #fff;
        font-weight: 600;
        font-size: 15px;
        opacity: 0;
        pointer-events: none;
      }

      .swipe-hint ha-icon {
        --mdc-icon-size: 22px;
      }

      .swipe-hint--done {
        justify-content: flex-start;
        background: rgb(var(--rgb-success));
      }

      .swipe-hint--delay {
        justify-content: flex-end;
        background: rgb(var(--rgb-warning));
      }

      /* On touch devices, swipe replaces the action buttons */
      @media (pointer: coarse) {
        .queue-actions {
          display: none;
        }
      }

      .queue-rank {
        min-width: 22px;
        font-weight: 700;
        font-size: 15px;
        color: rgb(var(--yahatl-rgb-primary));
        text-align: center;
        flex: none;
      }

      .queue-info {
        flex: 1;
        min-width: 0;
      }

      .queue-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }

      .greeting {
        padding: 4px 16px 0;
        font-size: 12px;
        letter-spacing: 0.4px;
        color: var(--yahatl-text-secondary);
      }

      .queue-btn--ghost {
        background: rgba(var(--rgb-primary-text-color), 0.06);
        color: var(--yahatl-text-secondary);
      }

      .flash {
        margin: 4px 16px 0;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: rgb(var(--yahatl-rgb-primary));
        font-size: 13px;
        font-weight: 500;
      }

      /* "Not yet" (lead-blocked / upcoming) group */
      .upcoming-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 12px 16px;
        margin-top: 4px;
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        background: none;
        cursor: pointer;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
      }

      .upcoming-header__label {
        flex: 1;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .upcoming-header__count {
        font-size: 12px;
        font-weight: 700;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: var(--yahatl-text-secondary);
        border-radius: 10px;
        padding: 1px 8px;
      }

      .upcoming-header__chevron {
        --mdc-icon-size: 20px;
        transition: transform 180ms ease;
      }

      .upcoming-header--open .upcoming-header__chevron {
        transform: rotate(180deg);
      }

      .upcoming-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 16px;
        border-top: 1px solid var(--yahatl-divider);
        opacity: 0.75;
      }

      .upcoming-row__title {
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .upcoming-row__reason {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        white-space: nowrap;
        letter-spacing: 0.2px;
      }
    `
];
z([
  w({ attribute: !1 })
], C.prototype, "hass", 2);
z([
  g()
], C.prototype, "_config", 2);
z([
  g()
], C.prototype, "_quickAddValue", 2);
z([
  g()
], C.prototype, "_quickAddBusy", 2);
z([
  g()
], C.prototype, "_flash", 2);
z([
  g()
], C.prototype, "_showUpcoming", 2);
C = z([
  $("yahatl-queue-card")
], C);
let N = class extends f {
  constructor() {
    super(...arguments), this._config = {};
  }
  setConfig(e) {
    this._config = e;
  }
  render() {
    return this.hass ? n`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${N._schema}
        .computeLabel=${(e) => N._labels[e.name] ?? e.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    ` : d;
  }
  _valueChanged(e) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e.detail.value },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
N._schema = [
  { name: "todo_entity", required: !0, selector: { entity: { domain: "todo" } } },
  { name: "title", selector: { text: {} } },
  { name: "max_items", selector: { number: { min: 1, max: 50, mode: "box" } } }
];
N._labels = {
  todo_entity: "Todo list entity (quick-add target)",
  title: "Card title",
  max_items: "Max items shown"
};
z([
  w({ attribute: !1 })
], N.prototype, "hass", 2);
z([
  g()
], N.prototype, "_config", 2);
N = z([
  $("yahatl-queue-card-editor")
], N);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue",
  description: "Prioritized task queue with Mushroom-style layout"
});
var Ve = Object.defineProperty, Ge = Object.getOwnPropertyDescriptor, D = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Ge(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && Ve(t, i, a), a;
};
const Ze = ["pending", "in_progress", "completed", "missed"], Ke = ["actionable", "recurring", "habit", "chore", "reminder", "note"];
let E = class extends f {
  constructor() {
    super(...arguments), this._config = {}, this._activeListIdx = 0, this._filters = { status: null, trait: null, tag: null }, this._showFilters = !1, this._showNotYet = !1, this._showDeferred = !1, this._showCompleted = !1, this._store = new W(this), this._initialized = !1;
  }
  setConfig(e) {
    this._config = e;
  }
  static getConfigElement() {
    return document.createElement("yahatl-list-card-editor");
  }
  static getStubConfig() {
    return {};
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), this._initialLoad()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  /** Load lists first, THEN the active list's items — _loadActiveList reads
   *  state.lists, so firing both un-awaited left the first tab empty until
   *  the user tapped around. */
  async _initialLoad() {
    await u.loadLists(), await this._loadActiveList();
  }
  render() {
    const e = this._store.state.lists, t = e[this._activeListIdx], i = (t == null ? void 0 : t.entity_id) || "", s = this._store.state.items.get(i) || [], a = this._applyFilters(s), o = Object.values(this._filters).filter(Boolean).length, r = [], l = [], c = [], p = [];
    for (const h of a)
      h.status === "completed" ? p.push(h) : this._isDeferred(h) ? c.push(h) : h.block_reason ? l.push(h) : r.push(h);
    return n`
      <ha-card>
        ${e.length > 0 ? n`
              <div class="tabs">
                ${e.map(
      (h, m) => n`
                    <button
                      class="tab ${m === this._activeListIdx ? "active" : ""}"
                      @click=${() => this._selectList(m)}
                    >
                      ${h.name}
                    </button>
                  `
    )}
              </div>
            ` : d}
        ${X()}

        <div class="filter-toggle">
          <span class="filter-toggle__count">${r.length} items</span>
          <button class="filter-toggle__btn" @click=${() => this._showFilters = !this._showFilters}>
            Filters${o > 0 ? n`<span class="active-filter-badge">${o}</span>` : d}
          </button>
        </div>

        ${this._showFilters ? this._renderFilters() : d}

        ${a.length === 0 ? n`<div class="empty-state">No items match</div>` : d}
        ${r.map((h) => this._renderItem(h, i))}
        ${l.length > 0 ? this._renderGroup(
      "Not Yet",
      "mdi:timer-sand",
      l,
      i,
      this._showNotYet,
      () => this._showNotYet = !this._showNotYet
    ) : d}
        ${c.length > 0 ? this._renderGroup(
      "Deferred",
      "mdi:clock-outline",
      c,
      i,
      this._showDeferred,
      () => this._showDeferred = !this._showDeferred
    ) : d}
        ${p.length > 0 ? this._renderGroup(
      "Completed",
      "mdi:check-circle-outline",
      p,
      i,
      this._showCompleted,
      () => this._showCompleted = !this._showCompleted
    ) : d}
      </ha-card>
    `;
  }
  _renderGroup(e, t, i, s, a, o) {
    return n`
      <button
        class="group-header ${a ? "group-header--open" : ""}"
        @click=${o}
      >
        <ha-icon class="group-header__icon" icon=${t}></ha-icon>
        <span class="group-header__label">${e}</span>
        <span class="group-header__count">${i.length}</span>
        <ha-icon class="group-header__chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${a ? i.map((r) => this._renderItem(r, s)) : d}
    `;
  }
  _isDeferred(e) {
    return !!e.deferred_until && new Date(e.deferred_until) > /* @__PURE__ */ new Date();
  }
  _renderFilters() {
    return n`
      <div class="filters">
        <div class="filter-label">Status</div>
        <div class="chips-strip" style="padding: 0 0 4px">
          ${Ze.map(
      (e) => n`
              <button
                class="mush-chip ${this._filters.status === e ? "mush-chip--filled" : ""}"
                style="--rgb-state: var(--yahatl-rgb-primary)"
                @click=${() => this._toggleFilter("status", e)}
              >
                ${e.replace("_", " ")}
              </button>
            `
    )}
        </div>
        <div class="filter-label">Traits</div>
        <div class="chips-strip" style="padding: 0">
          ${Ke.map(
      (e) => n`
              <button
                class="mush-chip ${this._filters.trait === e ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${K[e]}"
                @click=${() => this._toggleFilter("trait", e)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${B[e]}></ha-icon>
                </span>
                ${e}
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  _renderItem(e, t) {
    const i = e.status === "completed", s = $t(e.traits), a = s ? K[s] : "var(--yahatl-rgb-primary)", o = s ? B[s] : "", r = Pt(e.due), l = this._isDeferred(e);
    return n`
      <div
        class="item-row"
        style="--rgb-state: ${a}"
        role="button"
        tabindex="0"
        @click=${() => this._openEditor(t, e.uid)}
        @keydown=${J(() => this._openEditor(t, e.uid))}
      >
        ${e.priority ? n`<div class="priority-rail priority-rail--${e.priority}"></div>` : d}

        <div
          class="item-check ${i ? "item-check--done" : ""}"
          role="button"
          tabindex="0"
          aria-label="Complete ${e.title}"
          @click=${(c) => {
      c.stopPropagation(), i || this._complete(t, e.uid);
    }}
          @keydown=${J((c) => {
      c.stopPropagation(), i || this._complete(t, e.uid);
    })}
        ></div>

        ${o ? n`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${o}></ha-icon>
            </div>` : d}

        <div class="item-info">
          <div class="item-title ${i ? "item-title--done" : ""}">
            ${e.title}
          </div>
          <div class="item-badges">
            ${r ? n`<span class=${r.className}>${r.label}</span>` : d}
            ${e.time_estimate ? n`<span>${e.time_estimate}m</span>` : d}
            ${e.has_recurrence ? n`<span>repeats</span>` : d}
            ${e.current_streak > 0 ? n`<span class="streak">${e.current_streak}d streak</span>` : d}
            ${e.needs_detail ? n`<span class="needs-detail">needs detail</span>` : d}
            ${l ? n`<span class="deferred">deferred</span>` : d}
            ${e.block_reason && !l ? n`<span class="deferred">${e.block_reason}</span>` : d}
          </div>
        </div>

        ${e.tags.length > 0 ? n`<span class="item-tags">${e.tags.map((c) => `#${c}`).join(" ")}</span>` : d}
      </div>
    `;
  }
  _applyFilters(e) {
    let t = e;
    return this._filters.status && (t = t.filter((i) => i.status === this._filters.status)), this._filters.trait && (t = t.filter((i) => i.traits.includes(this._filters.trait))), this._filters.tag && (t = t.filter((i) => i.tags.includes(this._filters.tag))), t;
  }
  _toggleFilter(e, t) {
    this._filters = {
      ...this._filters,
      [e]: this._filters[e] === t ? null : t
    };
  }
  _selectList(e) {
    this._activeListIdx = e, this._loadActiveList();
  }
  async _loadActiveList() {
    const t = this._store.state.lists[this._activeListIdx];
    t && await u.loadItems(t.entity_id);
  }
  async _complete(e, t) {
    await u.completeItem(e, t);
  }
  _openEditor(e, t) {
    G(this, { entityId: e, itemId: t, hass: this.hass });
  }
  getCardSize() {
    return 6;
  }
};
E.styles = [
  O,
  I`
      :host {
        display: block;
      }

      /* Tab bar */
      .tabs {
        display: flex;
        overflow-x: auto;
        border-bottom: 1px solid var(--yahatl-divider);
        -webkit-overflow-scrolling: touch;
        padding: 0 8px;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        border-bottom: 2px solid transparent;
        background: none;
        color: var(--yahatl-text-secondary);
        cursor: pointer;
        white-space: nowrap;
        letter-spacing: 0.1px;
        margin-bottom: -1px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: color 180ms ease, border-color 180ms ease;
      }

      .tab.active {
        color: rgb(var(--yahatl-rgb-primary));
        border-bottom-color: rgb(var(--yahatl-rgb-primary));
      }

      /* Filter toggle row */
      .filter-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
      }

      .filter-toggle__count {
        font-size: 13px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .filter-toggle__btn {
        font-size: 13px;
        background: none;
        border: none;
        color: rgb(var(--yahatl-rgb-primary));
        cursor: pointer;
        padding: 4px 8px;
        font-family: inherit;
        font-weight: 500;
        letter-spacing: 0.1px;
        -webkit-tap-highlight-color: transparent;
      }

      .active-filter-badge {
        font-size: 11px;
        font-weight: 700;
        background: rgba(var(--yahatl-rgb-primary), 0.20);
        color: rgb(var(--yahatl-rgb-primary));
        border-radius: 10px;
        padding: 2px 7px;
        margin-left: 4px;
      }

      /* Filter area */
      .filters {
        padding: 0 16px 10px;
      }

      .filter-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 500;
        color: var(--yahatl-text-secondary);
        margin-bottom: 6px;
        margin-top: 8px;
      }

      .filter-label:first-child {
        margin-top: 0;
      }

      /* Item rows */
      .item-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-top: 1px solid var(--yahatl-divider);
        cursor: pointer;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms ease;
      }

      .item-row:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.04);
      }

      .item-row:active {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .item-info {
        flex: 1;
        min-width: 0;
      }

      .item-title {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        letter-spacing: 0.1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-title--done {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .item-tags {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .item-badges {
        display: flex;
        gap: 6px;
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
        margin-top: 2px;
        flex-wrap: wrap;
      }

      .item-badges .streak {
        color: rgb(var(--rgb-state-streak));
        font-weight: 500;
      }

      .item-badges .overdue {
        color: rgb(var(--rgb-state-overdue));
        font-weight: 500;
      }

      .item-badges .due-today {
        color: rgb(var(--rgb-state-due-today));
        font-weight: 500;
      }

      .item-badges .needs-detail {
        color: rgb(var(--rgb-warning));
        font-weight: 500;
      }

      .item-badges .deferred {
        color: rgb(var(--rgb-state-deferred));
      }

      /* Collapsible group headers (deferred / completed) */
      .group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        background: none;
        cursor: pointer;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms ease;
      }

      .group-header:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.04);
      }

      .group-header:active {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .group-header__icon {
        --mdc-icon-size: 18px;
        color: var(--yahatl-text-secondary);
      }

      .group-header__label {
        flex: 1;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .group-header__count {
        font-size: 12px;
        font-weight: 700;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: var(--yahatl-text-secondary);
        border-radius: 10px;
        padding: 1px 8px;
      }

      .group-header__chevron {
        --mdc-icon-size: 20px;
        transition: transform 180ms ease;
      }

      .group-header--open .group-header__chevron {
        transform: rotate(180deg);
      }
    `
];
D([
  w({ attribute: !1 })
], E.prototype, "hass", 2);
D([
  g()
], E.prototype, "_config", 2);
D([
  g()
], E.prototype, "_activeListIdx", 2);
D([
  g()
], E.prototype, "_filters", 2);
D([
  g()
], E.prototype, "_showFilters", 2);
D([
  g()
], E.prototype, "_showNotYet", 2);
D([
  g()
], E.prototype, "_showDeferred", 2);
D([
  g()
], E.prototype, "_showCompleted", 2);
E = D([
  $("yahatl-list-card")
], E);
let Xt = class extends f {
  setConfig(e) {
  }
  render() {
    return n`
      <p style="color: var(--secondary-text-color); font-size: 14px">
        No options — this card automatically shows all your yahatl lists as
        tabs, with filters built in.
      </p>
    `;
  }
};
Xt = D([
  $("yahatl-list-card-editor")
], Xt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-list-card",
  name: "Yahatl List",
  description: "Filterable item browser with Mushroom chips and trait icons"
});
var Xe = Object.defineProperty, Je = Object.getOwnPropertyDescriptor, S = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Je(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && Xe(t, i, a), a;
};
let T = class extends f {
  constructor() {
    super(...arguments), this._config = {}, this._showNotYet = !1, this._showDeferred = !1, this._showCompleted = !1, this._draft = "", this._busy = !1, this._store = new W(this), this._initialized = !1;
  }
  setConfig(e) {
    if (!e.assigned_to)
      throw new Error("yahatl-my-tasks-card: 'assigned_to' (a Home Assistant user id) is required");
    this._config = e;
  }
  static getConfigElement() {
    return document.createElement("yahatl-my-tasks-card-editor");
  }
  static getStubConfig(e) {
    var i;
    return { assigned_to: ((i = le(e)[0]) == null ? void 0 : i.value) ?? "", title: "My Tasks" };
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), this._loadAll()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  async _loadAll() {
    await u.loadLists(), await Promise.all(
      this._store.state.lists.map((e) => u.loadItems(e.entity_id))
    );
  }
  get _userId() {
    return String(this._config.assigned_to || "");
  }
  // List new quick-added tasks land in — the Inbox by default.
  get _addEntity() {
    return String(this._config.add_entity || "todo.yahatl");
  }
  _collectTasks() {
    const e = this._userId, t = /* @__PURE__ */ new Map();
    for (const s of this._store.state.lists) t.set(s.entity_id, s.name);
    const i = [];
    for (const [s, a] of this._store.state.items.entries())
      for (const o of a)
        !o.assigned_to || !o.assigned_to.includes(e) || i.push({
          ...o,
          _entityId: s,
          _listName: t.get(s) || ""
        });
    return i;
  }
  _sortActive(e, t) {
    const i = e.due ? new Date(e.due).getTime() : 1 / 0, s = t.due ? new Date(t.due).getTime() : 1 / 0;
    return i !== s ? i - s : e.title.localeCompare(t.title);
  }
  render() {
    const e = String(this._config.title || "My Tasks"), t = this._collectTasks(), i = [], s = [], a = [], o = [];
    for (const r of t)
      r.status === "completed" ? o.push(r) : this._isDeferred(r) ? a.push(r) : r.block_reason ? s.push(r) : i.push(r);
    return i.sort((r, l) => this._sortActive(r, l)), s.sort((r, l) => this._sortActive(r, l)), n`
      <ha-card>
        <div class="header">
          <span class="header__title">${e}</span>
          <span class="header__count">${i.length} items</span>
        </div>
        ${X()}

        ${t.length === 0 ? n`<div class="empty-state">Nothing assigned to you — nice.</div>` : d}
        ${i.map((r) => this._renderItem(r))}
        ${s.length > 0 ? this._renderGroup(
      "Not Yet",
      "mdi:timer-sand",
      s,
      this._showNotYet,
      () => this._showNotYet = !this._showNotYet
    ) : d}
        ${a.length > 0 ? this._renderGroup(
      "Deferred",
      "mdi:clock-outline",
      a,
      this._showDeferred,
      () => this._showDeferred = !this._showDeferred
    ) : d}
        ${o.length > 0 ? this._renderGroup(
      "Completed",
      "mdi:check-circle-outline",
      o,
      this._showCompleted,
      () => this._showCompleted = !this._showCompleted
    ) : d}

        <div class="capture-row">
          <input
            type="text"
            placeholder="Add a task for ${e}…"
            .value=${this._draft}
            @input=${(r) => this._draft = r.target.value}
            @keydown=${(r) => {
      r.key === "Enter" && this._add();
    }}
            ?disabled=${this._busy}
          />
          <button
            @click=${this._add}
            ?disabled=${this._busy || !this._draft.trim()}
          >
            add
          </button>
        </div>
      </ha-card>
    `;
  }
  async _add() {
    const e = this._draft.trim(), t = this._userId;
    if (!(!e || !t || this._busy)) {
      this._busy = !0;
      try {
        await u.createItem(this._addEntity, {
          title: e,
          assigned_to: [t]
        }) && (this._draft = "");
      } finally {
        this._busy = !1;
      }
    }
  }
  _renderGroup(e, t, i, s, a) {
    return n`
      <button
        class="group-header ${s ? "group-header--open" : ""}"
        @click=${a}
      >
        <ha-icon class="group-header__icon" icon=${t}></ha-icon>
        <span class="group-header__label">${e}</span>
        <span class="group-header__count">${i.length}</span>
        <ha-icon class="group-header__chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      ${s ? i.map((o) => this._renderItem(o)) : d}
    `;
  }
  _isDeferred(e) {
    return !!e.deferred_until && new Date(e.deferred_until) > /* @__PURE__ */ new Date();
  }
  _renderItem(e) {
    const t = e.status === "completed", i = $t(e.traits), s = i ? K[i] : "var(--yahatl-rgb-primary)", a = i ? B[i] : "", o = Pt(e.due), r = this._isDeferred(e);
    return n`
      <div
        class="item-row"
        style="--rgb-state: ${s}"
        role="button"
        tabindex="0"
        @click=${() => this._openEditor(e)}
        @keydown=${J(() => this._openEditor(e))}
      >
        ${e.priority ? n`<div class="priority-rail priority-rail--${e.priority}"></div>` : d}

        <div
          class="item-check ${t ? "item-check--done" : ""}"
          role="button"
          tabindex="0"
          aria-label="Complete ${e.title}"
          @click=${(l) => {
      l.stopPropagation(), t || this._complete(e);
    }}
          @keydown=${J((l) => {
      l.stopPropagation(), t || this._complete(e);
    })}
        ></div>

        ${a ? n`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${a}></ha-icon>
            </div>` : d}

        <div class="item-info">
          <div class="item-title ${t ? "item-title--done" : ""}">
            ${e.title}
          </div>
          <div class="item-badges">
            ${e._listName ? n`<span class="list-tag">${e._listName}</span>` : d}
            ${o ? n`<span class=${o.className}>${o.label}</span>` : d}
            ${e.time_estimate ? n`<span>${e.time_estimate}m</span>` : d}
            ${e.has_recurrence ? n`<span>repeats</span>` : d}
            ${e.current_streak > 0 ? n`<span class="streak">${e.current_streak}d streak</span>` : d}
            ${e.needs_detail ? n`<span class="needs-detail">needs detail</span>` : d}
            ${r ? n`<span class="deferred">deferred</span>` : d}
            ${e.block_reason && !r ? n`<span class="deferred">${e.block_reason}</span>` : d}
          </div>
        </div>

        ${e.tags.length > 0 ? n`<span class="item-tags">${e.tags.map((l) => `#${l}`).join(" ")}</span>` : d}
      </div>
    `;
  }
  async _complete(e) {
    const t = {
      status: e.status,
      due: e.due ?? null,
      deferred_until: e.deferred_until ?? null
    };
    await u.completeItem(e._entityId, e.uid) && ne(`Completed "${e.title}"`, {
      label: "UNDO",
      // Failures surface via the store's lastError banner.
      run: () => u.uncompleteItem(e._entityId, e.uid, t)
    });
  }
  _openEditor(e) {
    G(this, {
      entityId: e._entityId,
      itemId: e.uid,
      hass: this.hass
    });
  }
  getCardSize() {
    return 6;
  }
};
T.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 14px 16px 10px;
      }

      .header__title {
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.1px;
      }

      .header__count {
        font-size: 13px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .item-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-top: 1px solid var(--yahatl-divider);
        cursor: pointer;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms ease;
      }

      .item-row:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.04);
      }

      .item-row:active {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .item-info {
        flex: 1;
        min-width: 0;
      }

      .item-title {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        letter-spacing: 0.1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-title--done {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .item-tags {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .item-badges {
        display: flex;
        gap: 6px;
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
        margin-top: 2px;
        flex-wrap: wrap;
      }

      .item-badges .list-tag {
        color: rgb(var(--yahatl-rgb-primary));
        font-weight: 500;
      }

      .item-badges .streak {
        color: rgb(var(--rgb-state-streak));
        font-weight: 500;
      }

      .item-badges .overdue {
        color: rgb(var(--rgb-state-overdue));
        font-weight: 500;
      }

      .item-badges .due-today {
        color: rgb(var(--rgb-state-due-today));
        font-weight: 500;
      }

      .item-badges .needs-detail {
        color: rgb(var(--rgb-warning));
        font-weight: 500;
      }

      .item-badges .deferred {
        color: rgb(var(--rgb-state-deferred));
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        background: none;
        cursor: pointer;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms ease;
      }

      .group-header:hover {
        background: rgba(var(--yahatl-rgb-primary), 0.04);
      }

      .group-header:active {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .group-header__icon {
        --mdc-icon-size: 18px;
        color: var(--yahatl-text-secondary);
      }

      .group-header__label {
        flex: 1;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .group-header__count {
        font-size: 12px;
        font-weight: 700;
        background: rgba(var(--yahatl-rgb-primary), 0.12);
        color: var(--yahatl-text-secondary);
        border-radius: 10px;
        padding: 1px 8px;
      }

      .group-header__chevron {
        --mdc-icon-size: 20px;
        transition: transform 180ms ease;
      }

      .group-header--open .group-header__chevron {
        transform: rotate(180deg);
      }

      /* Quick add */
      .capture-row {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--yahatl-divider);
      }

      .capture-row input {
        flex: 1;
        padding: 9px 12px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-size: 14px;
        font-family: inherit;
        -webkit-appearance: none;
      }

      .capture-row input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.20);
        color: rgb(var(--yahatl-rgb-primary));
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        min-width: 56px;
      }

      .capture-row button:active {
        opacity: 0.7;
      }
    `
];
S([
  w({ attribute: !1 })
], T.prototype, "hass", 2);
S([
  g()
], T.prototype, "_config", 2);
S([
  g()
], T.prototype, "_showNotYet", 2);
S([
  g()
], T.prototype, "_showDeferred", 2);
S([
  g()
], T.prototype, "_showCompleted", 2);
S([
  g()
], T.prototype, "_draft", 2);
S([
  g()
], T.prototype, "_busy", 2);
T = S([
  $("yahatl-my-tasks-card")
], T);
function le(e) {
  if (!(e != null && e.states)) return [];
  const t = [];
  for (const [i, s] of Object.entries(e.states)) {
    if (!i.startsWith("person.")) continue;
    const a = s.attributes.user_id;
    if (!a) continue;
    const o = s.attributes.friendly_name || i.replace("person.", "");
    t.push({ value: a, label: o });
  }
  return t;
}
let et = class extends f {
  constructor() {
    super(...arguments), this._config = {};
  }
  // Only fields the card reads: assigned_to (required HA user id, picked via
  // person entities), optional title and add_entity (quick-add target list).
  _schema() {
    return [
      {
        name: "assigned_to",
        required: !0,
        selector: {
          select: { options: le(this.hass), mode: "dropdown" }
        }
      },
      { name: "title", selector: { text: {} } },
      { name: "add_entity", selector: { entity: { domain: "todo" } } }
    ];
  }
  setConfig(e) {
    this._config = e;
  }
  render() {
    return this.hass ? n`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema()}
        .computeLabel=${(e) => et._labels[e.name] ?? e.name}
        .computeHelper=${(e) => {
      if (e.name === "assigned_to" && this._config.assigned_to)
        return `HA user id: ${this._config.assigned_to}`;
      if (e.name === "add_entity") return "Defaults to the Inbox (todo.yahatl)";
    }}
        @value-changed=${this._valueChanged}
      ></ha-form>
    ` : d;
  }
  _valueChanged(e) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e.detail.value },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
et._labels = {
  assigned_to: "Person (whose tasks to show)",
  title: "Card title",
  add_entity: "List quick-added tasks go to"
};
S([
  w({ attribute: !1 })
], et.prototype, "hass", 2);
S([
  g()
], et.prototype, "_config", 2);
et = S([
  $("yahatl-my-tasks-card-editor")
], et);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-my-tasks-card",
  name: "Yahatl My Tasks",
  description: "Combined list of tasks assigned to one person across every yahatl list"
});
var ti = Object.defineProperty, ei = Object.getOwnPropertyDescriptor, x = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? ei(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && ti(t, i, a), a;
};
const Jt = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], ii = [
  "actionable",
  "recurring",
  "habit",
  "chore",
  "reminder",
  "note",
  "someday",
  "shopping",
  "gift"
], si = ["eq", "neq", "gt", "lt", "gte", "lte", "bool"], ai = [
  { id: "work_hours", name: "Work hours", icon: "mdi:briefcase-clock" },
  { id: "productive", name: "Productive", icon: "mdi:lightning-bolt" },
  { id: "weekend_project", name: "Weekend project", icon: "mdi:hammer-wrench" }
], ri = [
  {
    id: "work_hours",
    label: "Work hours",
    icon: "mdi:briefcase-clock",
    on: { start_time: "09:00", end_time: "17:00", mode: "allow", days: [0, 1, 2, 3, 4] },
    not: { start_time: "09:00", end_time: "17:00", mode: "suppress", days: [0, 1, 2, 3, 4] }
  },
  {
    id: "weekend",
    label: "Weekend",
    icon: "mdi:calendar-weekend",
    // Available only on the weekend = suppress all day Mon–Fri.
    on: { start_time: "00:00", end_time: "23:59", mode: "suppress", days: [0, 1, 2, 3, 4] },
    // Inverse (weekdays only) = suppress all day Sat–Sun.
    not: { start_time: "00:00", end_time: "23:59", mode: "suppress", days: [5, 6] }
  },
  {
    id: "morning",
    label: "Morning",
    icon: "mdi:weather-sunset-up",
    on: { start_time: "06:00", end_time: "09:00", mode: "allow", days: null },
    not: { start_time: "06:00", end_time: "09:00", mode: "suppress", days: null }
  },
  {
    id: "evening",
    label: "Evening",
    icon: "mdi:weather-sunset",
    on: { start_time: "17:00", end_time: "21:00", mode: "allow", days: null },
    not: { start_time: "17:00", end_time: "21:00", mode: "suppress", days: null }
  },
  {
    id: "night",
    label: "Night",
    icon: "mdi:weather-night",
    on: { start_time: "21:00", end_time: "06:00", mode: "allow", days: null },
    not: { start_time: "21:00", end_time: "06:00", mode: "suppress", days: null }
  }
];
function Tt(e, t) {
  var s;
  if (!e || !t) return t;
  const i = e.states[t];
  return ((s = i == null ? void 0 : i.attributes) == null ? void 0 : s.friendly_name) || t;
}
let y = class extends f {
  constructor() {
    super(...arguments), this.mode = "dialog", this._visible = !1, this._entityId = "", this._itemId = null, this._item = {}, this._section = 0, this._busy = !1, this._error = "", this._allItems = [], this._existingTags = [], this._existingProjects = [], this._contexts = [], this._entityFilter = "", this._entityDropdownOpen = null, this._confirmDelete = !1, this._openGen = 0, this._boundKey = (e) => {
      e.key === "Escape" && this.close();
    };
  }
  async open(e) {
    var s;
    const t = ++this._openGen;
    this._entityId = e.entityId, this._itemId = e.itemId || null, e.hass && (this.hass = e.hass), this._confirmDelete = !1, !u.api && this.hass && u.setHass(this.hass);
    const i = u.api;
    if (!i) {
      this._item = {}, this._section = 0, this._error = "Not connected to Home Assistant yet — close and try again.", this._show();
      return;
    }
    this._contexts = ai, i.getMeta().then((a) => {
      var o;
      t === this._openGen && (o = a.contexts) != null && o.length && (this._contexts = a.contexts);
    }).catch(() => {
    });
    try {
      const a = i.getItems(this._entityId), o = i.getTags().catch(() => []);
      if (this._itemId) {
        const r = this._itemId, [l, c, p] = await Promise.all([
          u.getItemDetails(this._entityId, r),
          a,
          o
        ]);
        if (t !== this._openGen) return;
        if (!l) {
          this._item = {}, this._error = "Item not found", this._show();
          return;
        }
        this._item = { ...l }, this._allItems = c.filter((h) => h.uid !== r), this._existingTags = p.map((h) => h.name), this._existingProjects = [...new Set(c.map((h) => h.project).filter((h) => !!h))];
      } else {
        const [r, l] = await Promise.all([
          a,
          o
        ]);
        if (t !== this._openGen) return;
        this._item = {
          title: "",
          description: "",
          traits: ["actionable"],
          tags: [],
          priority: null,
          project: null,
          assigned_to: (s = this.hass) != null && s.user ? [this.hass.user.id] : [],
          needs_detail: !1
        }, this._allItems = r, this._existingTags = l.map((c) => c.name), this._existingProjects = [...new Set(r.map((c) => c.project).filter((c) => !!c))];
      }
    } catch (a) {
      if (t !== this._openGen) return;
      this._item = {}, this._section = 0, this._error = `Failed to load: ${a.message || String(a)}`, this._show();
      return;
    }
    this._section = 0, this._error = "", this._show();
  }
  _show() {
    this._visible = !0, document.addEventListener("keydown", this._boundKey), document.body.style.overflow = "hidden";
  }
  // --- HA dialog-manager entry points (the show-dialog contract) ---
  async showDialog(e) {
    await this.open(e);
  }
  closeDialog() {
    return this.close(), !0;
  }
  close() {
    this._visible && (this._visible = !1, document.removeEventListener("keydown", this._boundKey), document.body.style.overflow = "", this.requestUpdate(), this.mode !== "inline" && Fe(this, "dialog-closed", { dialog: "yahatl-item-editor" }));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._boundKey), document.body.style.overflow = "";
  }
  _overlayClick(e) {
    e.target.classList.contains("overlay") && this.close();
  }
  // --- Rendering ---
  render() {
    if (!this._visible) return d;
    const e = ["Basics", "Recurrence", "Requirements", "Blockers", "Schedule"], t = n`
      <div class="modal__header">
        <div class="modal__header-info">
          <h2 class="modal__title">${this._itemId ? "Edit item" : "New item"}</h2>
          ${this._itemId ? n`<div class="modal__sub">${this._entityId} · ${this._itemId.slice(0, 8)}…</div>` : d}
        </div>
        <button class="close-btn" aria-label="Close editor" @click=${this.close}>&times;</button>
      </div>
      <div class="tabs">
        ${e.map(
      (i, s) => n`
            <button
              class="tab ${s === this._section ? "is-active" : ""}"
              @click=${() => this._section = s}
            >
              ${i}
            </button>
          `
    )}
      </div>
      <div class="content">${this._renderSection()}</div>
      ${this._error ? n`<div class="error-msg">${this._error}</div>` : d}
      <div class="modal__footer">
        <button class="btn btn--ghost" @click=${this.close}>cancel</button>
        <button
          class="btn btn--primary"
          @click=${this._save}
          ?disabled=${this._busy}
        >
          ${this._itemId ? "save" : "create"}
        </button>
      </div>
    `;
    return this.mode === "inline" ? n`<div class="inline-wrapper">${t}</div>` : n`
      <div class="overlay" @click=${this._overlayClick}>
        <div class="modal">${t}</div>
      </div>
    `;
  }
  _renderSection() {
    switch (this._section) {
      case 0:
        return this._renderBasics();
      case 1:
        return this._renderRecurrence();
      case 2:
        return this._renderRequirements();
      case 3:
        return this._renderBlockers();
      case 4:
        return this._renderSchedule();
      default:
        return d;
    }
  }
  // --- Section 0: Basics ---
  _renderBasics() {
    const e = this._item, t = this._getAssignableUsers();
    return n`
      <div class="field">
        <div class="field__label">Title</div>
        <input
          class="input"
          type="text"
          .value=${e.title || ""}
          @input=${(i) => this._set("title", i.target.value)}
        />
      </div>
      <div class="field">
        <div class="field__label">Description</div>
        <textarea
          class="textarea"
          rows="3"
          placeholder="Optional notes…"
          .value=${e.description || ""}
          @input=${(i) => this._set("description", i.target.value)}
        ></textarea>
      </div>
      ${this._renderTraitsTags()}
      <div class="row2">
        <div class="field">
          <div class="field__label">Priority</div>
          <select
            class="select"
            .value=${e.priority || ""}
            @change=${(i) => this._set(
      "priority",
      i.target.value || null
    )}
          >
            <option value="">None</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="field">
          <div class="field__label">Time estimate</div>
          <input
            class="input"
            type="number"
            min="1"
            max="480"
            placeholder="minutes"
            .value=${String(e.time_estimate || "")}
            @input=${(i) => this._set(
      "time_estimate",
      parseInt(i.target.value) || null
    )}
          />
        </div>
      </div>
      <div class="field">
        <div class="field__label">Project</div>
        <input
          class="input"
          type="text"
          placeholder="e.g. kitchen-reno"
          list="yahatl-project-suggestions"
          .value=${e.project || ""}
          @input=${(i) => this._set("project", i.target.value || null)}
        />
        <datalist id="yahatl-project-suggestions">
          ${this._existingProjects.map((i) => n`<option value=${i}></option>`)}
        </datalist>
      </div>
      <div class="field">
        <div class="field__label">Due</div>
        <input
          class="input"
          type="datetime-local"
          .value=${this._toLocalDt(e.due)}
          @change=${(i) => {
      const s = i.target.value;
      this._set("due", s ? new Date(s).toISOString() : null);
    }}
        />
      </div>
      <div class="field">
        <div class="field__label">Assigned to</div>
        <div class="assign-row">
          ${t.length ? t.map((i) => {
      const s = (e.assigned_to || []).includes(i.id);
      return n`
                  <button
                    class="trait-toggle ${s ? "is-on" : ""}"
                    style="--rgb-state: var(--yahatl-rgb-primary)"
                    @click=${() => this._toggleAssign(i.id)}
                  >
                    <ha-icon icon="mdi:account"></ha-icon>
                    ${i.name}
                  </button>
                `;
    }) : n`<span class="hint" style="margin: 0">No users found</span>`}
        </div>
      </div>
      <label class="check-row">
        <input
          type="checkbox"
          .checked=${!!e.needs_detail}
          @change=${(i) => this._set("needs_detail", i.target.checked)}
        />
        Needs more detail
      </label>

      ${this._itemId ? n`
            <div class="delete-area">
              ${this._confirmDelete ? n`
                    <div class="confirm-bar">
                      <span class="confirm-bar__msg">
                        Delete "${e.title || "this item"}"? This can't be undone.
                      </span>
                      <button
                        class="btn btn--ghost"
                        @click=${() => this._confirmDelete = !1}
                      >
                        Cancel
                      </button>
                      <button
                        class="btn btn--danger"
                        style="background: rgba(var(--rgb-danger), 0.15)"
                        @click=${this._delete}
                        ?disabled=${this._busy}
                      >
                        Delete
                      </button>
                    </div>
                  ` : n`
                    <button
                      class="btn btn--danger"
                      @click=${() => this._confirmDelete = !0}
                      ?disabled=${this._busy}
                    >
                      Delete this item
                    </button>
                  `}
            </div>
          ` : d}
    `;
  }
  // --- Section 1: Traits & Tags ---
  _renderTraitsTags() {
    const e = this._item.traits || [], t = this._item.tags || [];
    return n`
      <div class="field">
        <div class="field__label">Traits</div>
        <div class="traits-row">
          ${ii.map(
      (i) => n`
              <button
                class="trait-toggle ${e.includes(i) ? "is-on" : ""}"
                style="--rgb-state: ${K[i]}"
                @click=${() => this._toggleTrait(i)}
              >
                <ha-icon icon=${B[i]}></ha-icon>
                ${i}
              </button>
            `
    )}
        </div>
      </div>
      <div class="field">
        <div class="field__label">Tags</div>
        <div class="tags-row">
          ${t.map(
      (i, s) => n`
              <span class="tag-chip">
                #${i}
                <button class="tag-chip__remove" aria-label="Remove tag ${i}" @click=${() => this._removeTag(s)}>&times;</button>
              </span>
            `
    )}
          <input
            class="tag-input"
            type="text"
            placeholder="add tag…"
            list="yahatl-tag-suggestions"
            @keydown=${(i) => {
      i.key === "Enter" && this._addTag(i.target);
    }}
            @change=${(i) => {
      const s = i.target;
      s.value.trim() && this._addTag(s);
    }}
          />
          <datalist id="yahatl-tag-suggestions">
            ${this._existingTags.filter((i) => !(this._item.tags || []).includes(i)).map((i) => n`<option value=${i}></option>`)}
          </datalist>
        </div>
      </div>
    `;
  }
  // --- Section 2: Recurrence ---
  _renderRecurrence() {
    const e = this._item.recurrence, t = (e == null ? void 0 : e.type) || "none";
    return n`
      <div class="preset-grid">
        <button
          class="preset-btn ${t === "none" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("none")}
        >
          <div class="preset-label">One-off</div>
          <div class="preset-desc">Does not repeat</div>
        </button>
        <button
          class="preset-btn ${t === "calendar" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("calendar")}
        >
          <div class="preset-label">On specific days</div>
          <div class="preset-desc">Pick days of week/month</div>
        </button>
        <button
          class="preset-btn ${t === "elapsed" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("elapsed")}
        >
          <div class="preset-label">Every N days</div>
          <div class="preset-desc">Fixed interval from last done</div>
        </button>
        <button
          class="preset-btn ${t === "frequency" ? "active" : ""}"
          @click=${() => this._setRecurrenceType("frequency")}
        >
          <div class="preset-label">X times per period</div>
          <div class="preset-desc">Flexible goal tracking</div>
        </button>
      </div>

      ${t === "calendar" ? this._renderCalendarConfig() : d}
      ${t === "elapsed" ? this._renderElapsedConfig() : d}
      ${t === "frequency" ? this._renderFrequencyConfig() : d}
    `;
  }
  _renderCalendarConfig() {
    const e = this._item.recurrence, t = e.calendar_preset || null, i = e.calendar_days || [], s = e.calendar_days_of_month || [], a = !t, o = !t && i.length === 0;
    return n`
      <div class="chips-strip" style="padding-left: 0; padding-top: 12px">
        ${["daily", "weekdays", "weekends"].map(
      (r) => n`
            <button
              class="mush-chip ${t === r ? "mush-chip--filled" : ""}"
              style="--rgb-state: var(--yahatl-rgb-primary)"
              @click=${() => this._setCalendarPreset(t === r ? null : r)}
            >
              ${r}
            </button>
          `
    )}
        <button
          class="mush-chip ${a && !o ? "mush-chip--filled" : ""}"
          style="--rgb-state: var(--yahatl-rgb-primary)"
          @click=${() => this._setCalendarPreset(null)}
        >
          Custom days
        </button>
      </div>

      ${a ? n`
            <div class="field">
              <div class="field__label">Days of the week</div>
              <div class="day-picker">
                ${Jt.map(
      (r, l) => n`
                    <button
                      class="day-btn ${i.includes(l) ? "active" : ""}"
                      @click=${() => this._toggleCalendarDay(l)}
                    >
                      ${r}
                    </button>
                  `
    )}
              </div>
            </div>

            ${i.length === 0 ? n`
                  <div class="field">
                    <div class="field__label">Or days of the month (1-31, comma-separated)</div>
                    <input
                      class="input"
                      type="text"
                      placeholder="e.g. 1, 15"
                      .value=${s.join(", ")}
                      @change=${(r) => {
      const c = r.target.value.split(",").map((p) => parseInt(p.trim())).filter((p) => p >= 1 && p <= 31);
      this._updateRecurrence({
        calendar_days_of_month: c.length ? c : null
      });
    }}
                    />
                  </div>
                ` : d}
          ` : d}
    `;
  }
  _renderElapsedConfig() {
    const e = this._item.recurrence;
    return n`
      <div class="row2" style="margin-top: 12px">
        <div class="field">
          <div class="field__label">Every</div>
          <input
            class="input"
            type="number"
            min="1"
            .value=${String(e.elapsed_interval || "")}
            @input=${(t) => this._updateRecurrence({
      elapsed_interval: parseInt(t.target.value) || null
    })}
          />
        </div>
        <div class="field">
          <div class="field__label">Unit</div>
          <select
            class="select"
            .value=${e.elapsed_unit || "days"}
            @change=${(t) => this._updateRecurrence({
      elapsed_unit: t.target.value
    })}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
            <option value="years">years</option>
          </select>
        </div>
      </div>
    `;
  }
  _renderFrequencyConfig() {
    const e = this._item.recurrence;
    return n`
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; font-size: 13px">
        <span>Do this</span>
        <input
          class="input"
          type="number"
          min="1"
          style="width: 60px; flex: none"
          .value=${String(e.frequency_count || "")}
          @input=${(t) => this._updateRecurrence({
      frequency_count: parseInt(t.target.value) || null
    })}
        />
        <span>times per</span>
        <input
          class="input"
          type="number"
          min="1"
          style="width: 60px; flex: none"
          .value=${String(e.frequency_period || "")}
          @input=${(t) => this._updateRecurrence({
      frequency_period: parseInt(t.target.value) || null
    })}
        />
        <select
          class="select"
          style="width: 90px; flex: none"
          .value=${e.frequency_unit || "days"}
          @change=${(t) => this._updateRecurrence({
      frequency_unit: t.target.value
    })}
        >
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
      </div>
    `;
  }
  // --- Section 3: Blockers ---
  _renderBlockers() {
    const e = this._item.blockers || {
      mode: "ALL",
      items: [],
      item_mode: "ANY",
      sensors: [],
      sensor_mode: "ANY"
    };
    return n`
      <div class="field">
        <div class="field__label">Overall mode</div>
        <select
          class="select"
          .value=${e.mode || "ALL"}
          @change=${(t) => this._setBlockers({ ...e, mode: t.target.value })}
        >
          <option value="ANY">ANY (blocked if items OR sensors match)</option>
          <option value="ALL">ALL (blocked if items AND sensors match)</option>
        </select>
      </div>

      <fieldset>
        <legend>Blocked by items</legend>
        <div class="field" style="margin-bottom: 8px">
          <select
            class="select"
            .value=${e.item_mode || "ANY"}
            @change=${(t) => this._setBlockers({ ...e, item_mode: t.target.value })}
          >
            <option value="ANY">ANY incomplete blocks</option>
            <option value="ALL">ALL must be incomplete to block</option>
          </select>
        </div>
        <div class="blocker-items-scroll">
        ${this._allItems.length > 0 ? this._allItems.map(
      (t) => n`
                <label class="check-row">
                  <input
                    type="checkbox"
                    .checked=${(e.items || []).includes(t.uid)}
                    @change=${() => this._toggleBlockerItem(t.uid)}
                  />
                  ${t.title}
                  <span style="font-size: 11px; color: var(--yahatl-text-secondary)">(${t.status})</span>
                </label>
              `
    ) : n`<div style="font-size: 13px; color: var(--yahatl-text-secondary)">No other items</div>`}
        </div>
      </fieldset>

      <fieldset>
        <legend>Blocked by sensors</legend>
        <div class="field" style="margin-bottom: 8px">
          <select
            class="select"
            .value=${e.sensor_mode || "ANY"}
            @change=${(t) => this._setBlockers({ ...e, sensor_mode: t.target.value })}
          >
            <option value="ANY">ANY sensor on blocks</option>
            <option value="ALL">ALL must be on to block</option>
          </select>
        </div>
        <div class="entity-list">
          ${(e.sensors || []).map(
      (t, i) => n`
              <div class="entity-row">
                <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px; color: var(--yahatl-text-secondary)"></ha-icon>
                <div class="entity-row__name">
                  ${Tt(this.hass, t)}
                  <div class="entity-row__id">${t}</div>
                </div>
                <button class="entity-row__remove" aria-label="Remove entity" @click=${() => {
        const s = [...e.sensors || []];
        s.splice(i, 1), this._setBlockers({ ...e, sensors: s });
      }}>&times;</button>
              </div>
            `
    )}
        </div>
        ${this._renderEntityCombo(
      "blocker-sensor",
      "Add sensor entity…",
      e.sensors || [],
      (t) => this._setBlockers({ ...e, sensors: [...e.sensors || [], t] })
    )}
      </fieldset>
    `;
  }
  // --- Section 4: Requirements ---
  _renderRequirements() {
    const e = this._item.requirements || {
      mode: "ALL",
      location: [],
      people: [],
      time_constraints: [],
      context: [],
      sensors: []
    };
    return n`
      <div class="field">
        <div class="field__label">Mode</div>
        <select
          class="select"
          .value=${e.mode || "ALL"}
          @change=${(t) => this._setRequirements({ ...e, mode: t.target.value })}
        >
          <option value="ALL">ALL requirements must be met</option>
          <option value="ANY">ANY requirement met = eligible</option>
        </select>
      </div>
      <div class="field">
        <div class="field__label">Location (zones)</div>
        <div class="chips-strip" style="padding: 0">
          ${Object.entries(this._getZoneEntities()).map(
      ([t, i]) => n`
              <button
                class="mush-chip ${(e.location || []).includes(t) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--yahatl-rgb-primary)"
                @click=${() => this._toggleLocation(t)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${this._getZoneIcon(t)}></ha-icon>
                </span>
                ${i}
              </button>
            `
    )}
        </div>
      </div>
      <div class="field">
        <div class="field__label">Context</div>
        <div class="chips-strip" style="padding: 0">
          ${this._contexts.map(
      (t) => n`
              <button
                class="mush-chip ${(e.context || []).includes(t.id) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--yahatl-rgb-primary)"
                @click=${() => this._toggleContext(t.id)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${t.icon}></ha-icon>
                </span>
                ${t.name}
              </button>
            `
    )}
        </div>
        <div class="hint">
          Time-of-day rules live in the Schedule tab as time-blocker shortcuts.
        </div>
      </div>
      <fieldset>
        <legend>Required sensors</legend>
        <div class="entity-list">
          ${(e.sensors || []).map(
      (t, i) => n`
              <div class="entity-row">
                <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px; color: var(--yahatl-text-secondary)"></ha-icon>
                <div class="entity-row__name">
                  ${Tt(this.hass, t)}
                  <div class="entity-row__id">${t}</div>
                </div>
                <button class="entity-row__remove" aria-label="Remove entity" @click=${() => {
        const s = [...e.sensors || []];
        s.splice(i, 1), this._setRequirements({ ...e, sensors: s });
      }}>&times;</button>
              </div>
            `
    )}
        </div>
        ${this._renderEntityCombo(
      "req-sensor",
      "Add sensor entity…",
      e.sensors || [],
      (t) => this._setRequirements({ ...e, sensors: [...e.sensors || [], t] })
    )}
      </fieldset>
    `;
  }
  // --- Section 5: Schedule ---
  _renderSchedule() {
    const e = this._item.time_blockers || [], t = this._item.condition_triggers || [], i = this._item.deferred_until, s = this._item.lead_override_days;
    return n`
      <fieldset>
        <legend>Time Blockers</legend>
        <div class="field__label" style="margin-bottom: 6px">Shortcuts</div>
        <div class="chips-strip" style="padding: 0 0 4px">
          ${ri.map((a) => {
      const o = this._presetState(a), r = o !== "off", l = o === "not";
      return n`
              <button
                class="mush-chip ${r ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${l ? "var(--rgb-danger)" : "var(--yahatl-rgb-primary)"}"
                title="Click to cycle: only during → not during → off"
                @click=${() => this._cyclePreset(a)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${a.icon}></ha-icon>
                </span>
                ${l ? `Not ${a.label.toLowerCase()}` : a.label}
              </button>
            `;
    })}
        </div>
        <div class="hint" style="margin-bottom: 10px">
          Shortcuts add a matching time blocker below. Tap again to invert (NOT), and once
          more to clear.
        </div>
        ${e.map(
      (a, o) => n`
            <div class="dyn-row">
              <div class="row2">
                <div class="field">
                  <div class="field__label">Start</div>
                  <input
                    class="input"
                    type="time"
                    .value=${a.start_time || ""}
                    @change=${(r) => this._updateTimeBlocker(o, {
        start_time: r.target.value
      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">End</div>
                  <input
                    class="input"
                    type="time"
                    .value=${a.end_time || ""}
                    @change=${(r) => this._updateTimeBlocker(o, {
        end_time: r.target.value
      })}
                  />
                </div>
              </div>
              <div class="field" style="margin-top: 8px">
                <div class="field__label">Mode</div>
                <select
                  class="select"
                  .value=${a.mode || "suppress"}
                  @change=${(r) => this._updateTimeBlocker(o, {
        mode: r.target.value
      })}
                >
                  <option value="suppress">Suppress</option>
                  <option value="allow">Allow only</option>
                </select>
              </div>
              <div class="day-picker">
                ${Jt.map(
        (r, l) => n`
                    <button
                      class="day-btn ${!a.days || a.days.includes(l) ? "active" : ""}"
                      @click=${() => this._toggleTimeBlockerDay(o, l)}
                    >
                      ${r}
                    </button>
                  `
      )}
              </div>
              <button
                class="btn btn--danger"
                style="font-size: 12px; padding: 6px 12px"
                @click=${() => this._removeTimeBlocker(o)}
              >
                Remove
              </button>
            </div>
          `
    )}
        <button class="btn btn--ghost" style="font-size: 12px; padding: 6px 12px" @click=${this._addTimeBlocker}>
          + Add Time Blocker
        </button>
      </fieldset>

      <fieldset>
        <legend>Condition Triggers</legend>
        ${t.map(
      (a, o) => n`
            <div class="dyn-row">
              <div class="field" style="margin-bottom: 8px">
                <div class="field__label">Entity</div>
                ${a.entity_id ? n`
                    <div class="entity-row" style="margin-bottom: 6px">
                      <div class="entity-row__name">
                        ${Tt(this.hass, a.entity_id)}
                        <div class="entity-row__id">${a.entity_id}</div>
                      </div>
                      <button class="entity-row__remove" aria-label="Remove entity" @click=${() => this._updateConditionTrigger(o, { entity_id: "" })}>&times;</button>
                    </div>
                  ` : d}
                ${this._renderEntityCombo(
        `ct-entity-${o}`,
        a.entity_id ? "Change entity…" : "Select entity…",
        [],
        (r) => this._updateConditionTrigger(o, { entity_id: r })
      )}
              </div>
              <div class="row2">
                <div class="field">
                  <div class="field__label">Operator</div>
                  <select
                    class="select"
                    .value=${a.operator || "eq"}
                    @change=${(r) => this._updateConditionTrigger(o, {
        operator: r.target.value
      })}
                  >
                    ${si.map(
        (r) => n`<option value=${r}>${r}</option>`
      )}
                  </select>
                </div>
              </div>
              <div class="row2" style="margin-top: 8px">
                <div class="field">
                  <div class="field__label">Value</div>
                  <input
                    class="input"
                    type="text"
                    .value=${a.value || ""}
                    @change=${(r) => this._updateConditionTrigger(o, {
        value: r.target.value
      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">On match</div>
                  <select
                    class="select"
                    .value=${a.on_match || "boost"}
                    @change=${(r) => this._updateConditionTrigger(o, {
        on_match: r.target.value
      })}
                  >
                    <option value="boost">Boost priority</option>
                    <option value="set_due">Set due now</option>
                  </select>
                </div>
              </div>
              <button
                class="btn btn--danger"
                style="font-size: 12px; padding: 6px 12px; margin-top: 8px"
                @click=${() => this._removeConditionTrigger(o)}
              >
                Remove
              </button>
            </div>
          `
    )}
        <button class="btn btn--ghost" style="font-size: 12px; padding: 6px 12px" @click=${this._addConditionTrigger}>
          + Add Condition Trigger
        </button>
      </fieldset>

      <fieldset>
        <legend>Lead time (days before due)</legend>
        <div style="display: flex; gap: 8px; align-items: center">
          <input
            class="input"
            type="number"
            min="0"
            placeholder="Auto"
            style="flex: 1"
            .value=${s ?? ""}
            @change=${(a) => {
      const o = a.target.value;
      this._set(
        "lead_override_days",
        o === "" ? null : Math.max(0, parseInt(o, 10) || 0)
      );
    }}
          />
          <button
            class="btn btn--ghost"
            style="font-size: 12px; padding: 6px 12px"
            @click=${() => this._set("lead_override_days", null)}
          >
            Auto
          </button>
        </div>
        <div style="font-size: 12px; color: var(--yahatl-text-secondary); margin-top: 6px">
          How many days before its due date this surfaces in the queue. Leave
          blank to auto-compute from the recurrence (longer repeats get a longer
          run-up).
        </div>
      </fieldset>

      <fieldset>
        <legend>Defer Until</legend>
        <div style="display: flex; gap: 8px; align-items: center">
          <input
            class="input"
            type="datetime-local"
            style="flex: 1"
            .value=${this._toLocalDt(i)}
            @change=${(a) => {
      const o = a.target.value;
      this._set(
        "deferred_until",
        o ? new Date(o).toISOString() : null
      );
    }}
          />
          <button
            class="btn btn--ghost"
            style="font-size: 12px; padding: 6px 12px"
            @click=${() => this._set("deferred_until", null)}
          >
            Clear
          </button>
        </div>
      </fieldset>
    `;
  }
  // --- State helpers ---
  _set(e, t) {
    this._item = { ...this._item, [e]: t };
  }
  _toggleTrait(e) {
    const t = [...this._item.traits || []], i = t.indexOf(e);
    i >= 0 ? t.splice(i, 1) : t.push(e), this._set("traits", t);
  }
  _toggleAssign(e) {
    const t = [...this._item.assigned_to || []], i = t.indexOf(e);
    i >= 0 ? t.splice(i, 1) : t.push(e), this._set("assigned_to", t);
  }
  _addTag(e) {
    const t = e.value.trim();
    t && !(this._item.tags || []).includes(t) && (this._set("tags", [...this._item.tags || [], t]), e.value = "");
  }
  _removeTag(e) {
    const t = [...this._item.tags || []];
    t.splice(e, 1), this._set("tags", t);
  }
  // Recurrence helpers
  _setRecurrenceType(e) {
    e === "none" ? this._set("recurrence", null) : this._set("recurrence", {
      type: e,
      ...e === "calendar" ? { calendar_preset: "daily", calendar_days: null, calendar_days_of_month: null } : {},
      ...e === "elapsed" ? { elapsed_interval: 1, elapsed_unit: "days" } : {},
      ...e === "frequency" ? { frequency_count: 3, frequency_period: 1, frequency_unit: "weeks" } : {}
    });
  }
  _updateRecurrence(e) {
    this._set("recurrence", { ...this._item.recurrence, ...e });
  }
  _setCalendarPreset(e) {
    this._updateRecurrence({
      calendar_preset: e,
      calendar_days: e ? null : [],
      calendar_days_of_month: null
    });
  }
  _toggleCalendarDay(e) {
    var s;
    const t = [...((s = this._item.recurrence) == null ? void 0 : s.calendar_days) || []], i = t.indexOf(e);
    i >= 0 ? t.splice(i, 1) : t.push(e), this._updateRecurrence({
      calendar_days: t.length ? t : null,
      calendar_days_of_month: null,
      calendar_preset: null
    });
  }
  // Blocker helpers
  _setBlockers(e) {
    this._set("blockers", e);
  }
  _toggleBlockerItem(e) {
    const t = this._item.blockers || { mode: "ALL", items: [], item_mode: "ANY", sensors: [], sensor_mode: "ANY" }, i = [...t.items || []], s = i.indexOf(e);
    s >= 0 ? i.splice(s, 1) : i.push(e), this._setBlockers({ ...t, items: i });
  }
  // Requirements helpers
  _setRequirements(e) {
    this._set("requirements", e);
  }
  _emptyRequirements() {
    return { mode: "ALL", location: [], people: [], time_constraints: [], context: [], sensors: [] };
  }
  _toggleLocation(e) {
    const t = this._item.requirements || this._emptyRequirements(), i = t.location || [], s = i.includes(e) ? i.filter((a) => a !== e) : [...i, e];
    this._setRequirements({ ...t, location: s });
  }
  _toggleContext(e) {
    const t = this._item.requirements || this._emptyRequirements(), i = t.context || [], s = i.includes(e) ? i.filter((a) => a !== e) : [...i, e];
    this._setRequirements({ ...t, context: s });
  }
  // Time blocker helpers
  _addTimeBlocker() {
    const e = [...this._item.time_blockers || []];
    e.push({ start_time: "09:00", end_time: "17:00", mode: "suppress", days: null }), this._set("time_blockers", e);
  }
  _removeTimeBlocker(e) {
    const t = [...this._item.time_blockers || []];
    t.splice(e, 1), this._set("time_blockers", t);
  }
  _updateTimeBlocker(e, t) {
    const i = [...this._item.time_blockers || []];
    i[e] = { ...i[e], ...t }, this._set("time_blockers", i);
  }
  _toggleTimeBlockerDay(e, t) {
    const i = [...this._item.time_blockers || []], s = { ...i[e] }, a = s.days ? [...s.days] : [0, 1, 2, 3, 4, 5, 6], o = a.indexOf(t);
    o >= 0 ? a.splice(o, 1) : a.push(t), s.days = a.length === 7 ? null : a, i[e] = s, this._set("time_blockers", i);
  }
  // Time-blocker preset (schedule shortcut) helpers
  _sameDays(e, t) {
    const i = e && e.length ? [...e].sort((a, o) => a - o).join(",") : "", s = t && t.length ? [...t].sort((a, o) => a - o).join(",") : "";
    return i === s;
  }
  _matchTb(e, t) {
    return e.start_time === t.start_time && e.end_time === t.end_time && (e.mode || "suppress") === t.mode && this._sameDays(e.days, t.days);
  }
  _presetState(e) {
    const t = this._item.time_blockers || [];
    return t.some((i) => this._matchTb(i, e.on)) ? "on" : t.some((i) => this._matchTb(i, e.not)) ? "not" : "off";
  }
  _cyclePreset(e) {
    const t = this._presetState(e), i = (this._item.time_blockers || []).filter(
      (s) => !this._matchTb(s, e.on) && !this._matchTb(s, e.not)
    );
    t === "off" ? i.push({ ...e.on }) : t === "on" && i.push({ ...e.not }), this._set("time_blockers", i);
  }
  // Condition trigger helpers
  _addConditionTrigger() {
    const e = [...this._item.condition_triggers || []];
    e.push({ entity_id: "", operator: "eq", value: "", on_match: "boost" }), this._set("condition_triggers", e);
  }
  _removeConditionTrigger(e) {
    const t = [...this._item.condition_triggers || []];
    t.splice(e, 1), this._set("condition_triggers", t);
  }
  _updateConditionTrigger(e, t) {
    const i = [...this._item.condition_triggers || []];
    i[e] = { ...i[e], ...t }, this._set("condition_triggers", i);
  }
  // --- Save / Delete ---
  async _save() {
    var e, t, i, s, a, o, r, l, c;
    if (!((e = this._item.title) != null && e.trim())) {
      this._error = "Title is required";
      return;
    }
    this._busy = !0, this._error = "";
    try {
      const p = [
        "title",
        "description",
        "traits",
        "tags",
        "assigned_to",
        "priority",
        "due",
        "time_estimate",
        "buffer_before",
        "buffer_after",
        "needs_detail",
        "recurrence",
        "blockers",
        "requirements",
        "condition_triggers",
        "time_blockers",
        "deferred_until",
        "lead_override_days"
      ], h = {};
      for (const _ of p)
        _ in this._item && (h[_] = this._item[_]);
      if (h.blockers) {
        const _ = h.blockers;
        !((t = _.items) != null && t.length) && !((i = _.sensors) != null && i.length) && (h.blockers = null);
      }
      if (h.requirements) {
        const _ = h.requirements;
        !((s = _.location) != null && s.length) && !((a = _.people) != null && a.length) && !((o = _.time_constraints) != null && o.length) && !((r = _.context) != null && r.length) && !((l = _.sensors) != null && l.length) && (h.requirements = null);
      }
      h.time_blockers && h.time_blockers.length === 0 && delete h.time_blockers, h.condition_triggers && h.condition_triggers.length === 0 && delete h.condition_triggers, (this._itemId ? await u.saveItem(this._entityId, this._itemId, h) : await u.createItem(this._entityId, h)) ? this.close() : this._error = ((c = u.state.lastError) == null ? void 0 : c.message) || "Failed to save";
    } catch (p) {
      this._error = p.message || "Failed to save";
    } finally {
      this._busy = !1;
    }
  }
  async _delete() {
    var e;
    if (this._itemId) {
      this._busy = !0;
      try {
        await u.deleteItem(this._entityId, this._itemId) ? this.close() : (this._confirmDelete = !1, this._error = ((e = u.state.lastError) == null ? void 0 : e.message) || "Failed to delete");
      } finally {
        this._busy = !1;
      }
    }
  }
  // --- Entity combobox ---
  _getFilteredEntities(e) {
    var s;
    if (!((s = this.hass) != null && s.states)) return [];
    const t = this._entityFilter.toLowerCase(), i = [];
    for (const [a, o] of Object.entries(this.hass.states)) {
      if (e.includes(a)) continue;
      const r = o.attributes.friendly_name || a;
      t && !a.toLowerCase().includes(t) && !r.toLowerCase().includes(t) || i.push({ id: a, name: r });
    }
    return i.sort((a, o) => a.name.localeCompare(o.name)), t ? i.slice(0, 50) : i.slice(0, 20);
  }
  _renderEntityCombo(e, t, i, s) {
    const a = this._entityDropdownOpen === e, o = a ? this._getFilteredEntities(i) : [];
    return n`
      <div class="entity-combo">
        <input
          class="entity-combo__input"
          type="text"
          placeholder=${t}
          .value=${this._entityDropdownOpen === e ? this._entityFilter : ""}
          @focus=${() => {
      this._entityDropdownOpen = e, this._entityFilter = "";
    }}
          @blur=${() => {
      setTimeout(() => {
        this._entityDropdownOpen === e && (this._entityDropdownOpen = null, this._entityFilter = "");
      }, 200);
    }}
          @input=${(r) => {
      this._entityFilter = r.target.value;
    }}
        />
        ${a ? n`
          <div class="entity-combo__dropdown">
            ${o.length > 0 ? o.map(
      (r) => n`
                    <div
                      class="entity-combo__option"
                      @mousedown=${(l) => {
        l.preventDefault(), s(r.id), this._entityDropdownOpen = null, this._entityFilter = "";
      }}
                    >
                      <span class="entity-combo__option-name">${r.name}</span>
                      <span class="entity-combo__option-id">${r.id}</span>
                    </div>
                  `
    ) : n`<div class="entity-combo__option"><span class="entity-combo__option-name" style="color: var(--yahatl-text-secondary)">No matches</span></div>`}
          </div>
        ` : d}
      </div>
    `;
  }
  // --- Utilities ---
  _toLocalDt(e) {
    if (!e) return "";
    try {
      const t = new Date(e), i = (s) => String(s).padStart(2, "0");
      return `${t.getFullYear()}-${i(t.getMonth() + 1)}-${i(t.getDate())}T${i(t.getHours())}:${i(t.getMinutes())}`;
    } catch {
      return "";
    }
  }
  _splitComma(e) {
    return e.split(",").map((t) => t.trim()).filter(Boolean);
  }
  /** All assignable HA users: the current user plus every person entity that
   *  is linked to a user account (assignment stores HA user IDs). */
  _getAssignableUsers() {
    var s, a;
    const e = [], t = /* @__PURE__ */ new Set(), i = (s = this.hass) == null ? void 0 : s.user;
    if (i != null && i.id && (e.push({ id: i.id, name: i.name || "Me" }), t.add(i.id)), (a = this.hass) != null && a.states)
      for (const [o, r] of Object.entries(this.hass.states)) {
        if (!o.startsWith("person.")) continue;
        const l = r.attributes.user_id;
        if (!l || t.has(l)) continue;
        const c = r.attributes.friendly_name || o.replace("person.", "");
        e.push({ id: l, name: c }), t.add(l);
      }
    return e.sort((o, r) => o.name.localeCompare(r.name)), e;
  }
  /** Get all zone entities from hass.states as { zone_name: friendly_name } */
  _getZoneEntities() {
    var t;
    if (!((t = this.hass) != null && t.states)) return {};
    const e = {};
    for (const [i, s] of Object.entries(this.hass.states))
      if (i.startsWith("zone.")) {
        const a = s.attributes.friendly_name || i.replace("zone.", "");
        e[a.toLowerCase()] = a;
      }
    return e;
  }
  _getZoneIcon(e) {
    var t;
    if (!((t = this.hass) != null && t.states)) return "mdi:map-marker";
    for (const [i, s] of Object.entries(this.hass.states))
      if (i.startsWith("zone.") && (s.attributes.friendly_name || i.replace("zone.", "")).toLowerCase() === e)
        return s.attributes.icon || "mdi:map-marker";
    return "mdi:map-marker";
  }
};
y.styles = [
  O,
  I`
      :host {
        display: block;
      }

      /* Self-contained overlay + modal. We deliberately do NOT use HA's
       * <ha-dialog> here: this element is mounted on document.body (outside
       * the HA app root), and ha-dialog is lazily registered — if HA hasn't
       * loaded it yet, <ha-dialog> renders as an unknown element and the
       * dialog silently fails to appear. A plain fixed overlay always renders. */
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        animation: overlay-in 160ms ease-out;
      }

      @keyframes overlay-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @media (min-width: 600px) {
        .overlay { align-items: center; }
      }

      /* Modal body: sticky header + scrollable content + sticky footer. */
      .modal {
        width: 100%;
        max-width: 520px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        border-radius: 16px 16px 0 0;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        animation: modal-slide-up 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
        touch-action: auto;
      }

      @keyframes modal-slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      @media (min-width: 600px) {
        .modal { border-radius: 16px; }
      }

      .modal__header {
        padding: 18px 20px 12px;
        border-bottom: 1px solid var(--yahatl-divider);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .modal__header-info {
        flex: 1;
      }

      .modal__title {
        font-size: 20px;
        font-weight: 500;
        letter-spacing: 0.15px;
        margin: 0;
        color: var(--yahatl-text);
      }

      .modal__sub {
        font-size: 13px;
        color: var(--yahatl-text-secondary);
        margin-top: 4px;
        letter-spacing: 0.4px;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.4em;
        cursor: pointer;
        color: var(--yahatl-text-secondary);
        padding: 4px;
        line-height: 1;
        -webkit-tap-highlight-color: transparent;
      }

      /* Tabs */
      .tabs {
        display: flex;
        gap: 4px;
        padding: 8px 12px 0;
        border-bottom: 1px solid var(--yahatl-divider);
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: 10px 14px;
        font-size: 15px;
        font-weight: 500;
        color: var(--yahatl-text-secondary);
        border: 0;
        background: transparent;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        letter-spacing: 0.1px;
        margin-bottom: -1px;
        font-family: inherit;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
        transition: color 180ms ease, border-color 180ms ease;
      }

      .tab.is-active {
        color: rgb(var(--yahatl-rgb-primary));
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      /* Content */
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 18px 20px;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid var(--yahatl-divider);
        background: rgba(var(--rgb-primary-text-color), 0.02);
      }

      .error-msg {
        padding: 8px 20px;
        color: rgb(var(--rgb-danger));
        font-size: 14px;
      }

      .hint {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        margin-top: 6px;
        line-height: 1.4;
      }

      /* Traits as pills */
      .traits-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      /* Tags inline */
      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }

      .tag-input {
        flex: 1;
        min-width: 120px;
        max-width: 200px;
        padding: 6px 10px;
        font-size: 14px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 6px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-family: inherit;
      }

      .tag-input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      /* Recurrence presets */
      .preset-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .preset-btn {
        padding: 10px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        background: none;
        color: var(--yahatl-text);
        cursor: pointer;
        font-size: 14px;
        text-align: left;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 180ms ease, border-color 180ms ease;
      }

      .preset-btn.active {
        border-color: rgb(var(--yahatl-rgb-primary));
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .preset-label {
        font-weight: 500;
      }

      .preset-desc {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        margin-top: 2px;
      }

      /* Day picker */
      .day-picker {
        display: flex;
        gap: 4px;
        margin: 8px 0;
      }

      .day-btn {
        flex: 1;
        padding: 8px 0;
        border: 1px solid var(--yahatl-divider);
        border-radius: 6px;
        background: none;
        color: var(--yahatl-text);
        cursor: pointer;
        font-size: 13px;
        text-align: center;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
      }

      .day-btn.active {
        background: rgb(var(--yahatl-rgb-primary));
        border-color: rgb(var(--yahatl-rgb-primary));
        color: white;
      }

      /* Fieldset */
      fieldset {
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        padding: 12px;
        margin: 0;
      }

      legend {
        font-size: 13px;
        font-weight: 500;
        padding: 0 6px;
        color: var(--yahatl-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      /* Check row */
      .check-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        cursor: pointer;
        font-size: 14px;
        color: var(--yahatl-text);
      }

      .check-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
      }

      /* Dynamic rows */
      .dyn-row {
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 8px;
      }

      /* Assign row */
      .assign-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .assign-current {
        font-size: 14px;
        color: var(--yahatl-text);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(var(--yahatl-rgb-primary), 0.10);
      }

      .assign-current ha-icon {
        --mdc-icon-size: 16px;
        color: rgb(var(--yahatl-rgb-primary));
      }

      /* Delete */
      .delete-area {
        margin-top: 8px;
        padding-top: 16px;
        border-top: 1px solid var(--yahatl-divider);
      }

      /* Two-step delete confirmation (same pattern as the manage card) */
      .confirm-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(var(--rgb-danger), 0.08);
        border-radius: 10px;
        flex-wrap: wrap;
      }

      .confirm-bar__msg {
        flex: 1;
        min-width: 140px;
        font-size: 13px;
        color: rgb(var(--rgb-danger));
      }

      .inline-wrapper {
        background: var(--yahatl-card-bg);
        border-radius: 16px;
      }

      /* Entity picker list */
      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .entity-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-text-color), 0.03);
      }

      .entity-row__name {
        flex: 1;
        font-size: 14px;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entity-row__id {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.3px;
      }

      .entity-row__remove {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--yahatl-text-secondary);
        font-size: 14px;
        padding: 2px 4px;
        line-height: 1;
        opacity: 0.6;
        -webkit-tap-highlight-color: transparent;
      }

      .entity-row__remove:hover {
        opacity: 1;
        color: rgb(var(--rgb-danger));
      }

      .blocker-items-scroll {
        max-height: 200px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .entity-combo {
        position: relative;
      }

      .entity-combo__input {
        width: 100%;
        padding: 11px 13px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 10px;
        font-family: inherit;
        font-size: 16px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        box-sizing: border-box;
        -webkit-appearance: none;
      }

      .entity-combo__input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .entity-combo__dropdown {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        z-index: 10;
        max-height: 200px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: var(--yahatl-card-bg);
        border: 1px solid var(--yahatl-divider);
        border-top: none;
        border-radius: 0 0 10px 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      .entity-combo__option {
        padding: 9px 12px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .entity-combo__option:hover,
      .entity-combo__option.is-focused {
        background: rgba(var(--yahatl-rgb-primary), 0.08);
      }

      .entity-combo__option-name {
        color: var(--yahatl-text);
      }

      .entity-combo__option-id {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.3px;
      }
    `
];
x([
  w()
], y.prototype, "mode", 2);
x([
  w({ attribute: !1 })
], y.prototype, "hass", 2);
x([
  g()
], y.prototype, "_visible", 2);
x([
  g()
], y.prototype, "_entityId", 2);
x([
  g()
], y.prototype, "_itemId", 2);
x([
  g()
], y.prototype, "_item", 2);
x([
  g()
], y.prototype, "_section", 2);
x([
  g()
], y.prototype, "_busy", 2);
x([
  g()
], y.prototype, "_error", 2);
x([
  g()
], y.prototype, "_allItems", 2);
x([
  g()
], y.prototype, "_existingTags", 2);
x([
  g()
], y.prototype, "_existingProjects", 2);
x([
  g()
], y.prototype, "_contexts", 2);
x([
  g()
], y.prototype, "_entityFilter", 2);
x([
  g()
], y.prototype, "_entityDropdownOpen", 2);
x([
  g()
], y.prototype, "_confirmDelete", 2);
y = x([
  $("yahatl-item-editor")
], y);
var oi = Object.defineProperty, ni = Object.getOwnPropertyDescriptor, ce = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? ni(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && oi(t, i, a), a;
};
let yt = class extends f {
  constructor() {
    super(...arguments), this._store = new W(this), this._initialized = !1;
  }
  setConfig(e) {
  }
  // Wired like the other cards: wait for hass so the store has an API before
  // loading. connectedCallback fired before hass was set, so if this element
  // rendered first the loads were silently dropped and no chips appeared.
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadContext(), u.loadMeta()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  _getZones() {
    var t;
    if (!((t = this.hass) != null && t.states)) return [];
    const e = [];
    for (const [i, s] of Object.entries(this.hass.states))
      if (i.startsWith("zone.")) {
        const a = s.attributes.friendly_name || i.replace("zone.", ""), o = s.attributes.icon || "mdi:map-marker";
        e.push({ id: a.toLowerCase(), name: a, icon: o });
      }
    return e;
  }
  render() {
    const e = this._store.state.context, t = this._store.state.meta, i = (e == null ? void 0 : e.location) || null, s = (e == null ? void 0 : e.contexts) || [], a = this._getMergedLocations(), o = (t == null ? void 0 : t.contexts) || [];
    return n`
      <div class="context-bar">
        <span class="section-label">Where</span>
        ${a.map(
      (r) => n`
            <button
              class="mush-chip ${i === r.id ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--yahatl-rgb-primary)"
              @click=${() => this._setLocation(i === r.id ? null : r.id)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${r.icon}></ha-icon>
              </span>
              ${r.name}
            </button>
          `
    )}
        <span class="section-label">Doing</span>
        ${o.map(
      (r) => n`
            <button
              class="mush-chip ${s.includes(r.id) ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--yahatl-rgb-primary)"
              @click=${() => this._toggleContext(r.id, s)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${r.icon}></ha-icon>
              </span>
              ${r.name}
            </button>
          `
    )}
      </div>
    `;
  }
  _getMergedLocations() {
    var s;
    const e = this._getZones(), t = ((s = this._store.state.meta) == null ? void 0 : s.locations) || [], i = /* @__PURE__ */ new Map();
    for (const a of e)
      i.set(a.id, a);
    for (const a of t)
      i.set(a.id, a);
    return Array.from(i.values());
  }
  async _setLocation(e) {
    await u.setContext({ location: e });
  }
  async _toggleContext(e, t) {
    const i = t.includes(e) ? t.filter((s) => s !== e) : [...t, e];
    await u.setContext({ contexts: i });
  }
};
yt.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .context-bar {
        display: flex;
        gap: var(--chip-spacing);
        padding: 8px 16px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        align-items: center;
      }

      .context-bar::-webkit-scrollbar {
        display: none;
      }

      .section-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 500;
        color: var(--yahatl-text-secondary);
        padding: 0 4px;
        white-space: nowrap;
        flex-shrink: 0;
      }
    `
];
ce([
  w({ attribute: !1 })
], yt.prototype, "hass", 2);
yt = ce([
  $("yahatl-context-bar")
], yt);
var li = Object.defineProperty, ci = Object.getOwnPropertyDescriptor, qt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? ci(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && li(t, i, a), a;
};
let vt = class extends f {
  constructor() {
    super(...arguments), this._store = new W(this), this._initialized = !1;
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadQueue()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  setConfig(e) {
  }
  static getConfigElement() {
    return document.createElement("yahatl-stats-card-editor");
  }
  static getStubConfig() {
    return {};
  }
  render() {
    const e = this._store.state.queue;
    if (!e)
      return n`<div class="stats-grid">
        ${[0, 1, 2, 3].map(
        () => n`
            <div class="stat-card">
              <div class="mush-state-item">
                <div class="mush-shape-icon"></div>
                <div class="mush-state-info">
                  <div class="mush-state-info__primary">–</div>
                  <div class="mush-state-info__secondary">loading</div>
                </div>
              </div>
            </div>
          `
      )}
      </div>`;
    const t = [
      {
        icon: "mdi:alert",
        value: e.overdue_count,
        label: "overdue",
        rgb: "var(--rgb-state-overdue)"
      },
      {
        icon: "mdi:calendar-today",
        value: e.due_today_count,
        label: "due today",
        rgb: "var(--rgb-state-due-today)"
      },
      {
        icon: "mdi:tray-full",
        value: e.blocked_count,
        label: "blocked",
        rgb: "var(--rgb-state-blocked)"
      },
      {
        icon: "mdi:check-circle-outline",
        value: e.total_actionable,
        label: "ready",
        rgb: "var(--yahatl-rgb-primary)"
      }
    ];
    return n`
      <div class="stats-grid">
        ${t.map(
      (i) => n`
            <div class="stat-card" style="--rgb-state: ${i.rgb}">
              <div class="mush-state-item">
                <div class="mush-shape-icon">
                  <ha-icon icon=${i.icon}></ha-icon>
                </div>
                <div class="mush-state-info">
                  <div class="mush-state-info__primary">${i.value}</div>
                  <div class="mush-state-info__secondary">${i.label}</div>
                </div>
              </div>
            </div>
          `
    )}
      </div>
    `;
  }
  getCardSize() {
    return 2;
  }
};
vt.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      /* On narrow screens (mobile HA), stack 2x2 */
      @media (max-width: 400px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .stat-card {
        background: var(--yahatl-card-bg);
        border-radius: var(--yahatl-border-radius);
        border: var(--yahatl-border-width) solid var(--yahatl-border-color);
        overflow: hidden;
      }
    `
];
qt([
  w({ attribute: !1 })
], vt.prototype, "hass", 2);
vt = qt([
  $("yahatl-stats-card")
], vt);
let te = class extends f {
  setConfig(e) {
  }
  render() {
    return n`
      <p style="color: var(--secondary-text-color); font-size: 14px">
        No options — this card always shows overdue, due today, blocked, and
        ready counts from your task queue.
      </p>
    `;
  }
};
te = qt([
  $("yahatl-stats-card-editor")
], te);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-stats-card",
  name: "Yahatl Stats",
  description: "Mushroom-style stat tiles: overdue, today, blocked, ready"
});
var di = Object.defineProperty, hi = Object.getOwnPropertyDescriptor, mt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? hi(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && di(t, i, a), a;
};
let F = class extends f {
  constructor() {
    super(...arguments), this.entityId = "", this._value = "", this._busy = !1;
  }
  setConfig(e) {
    e.entity_id && (this.entityId = e.entity_id);
  }
  render() {
    return n`
      <div class="capture-row">
        <input
          type="text"
          placeholder="Quick add a task…"
          .value=${this._value}
          @input=${(e) => this._value = e.target.value}
          @keydown=${(e) => {
      e.key === "Enter" && this._add();
    }}
          ?disabled=${this._busy}
        />
        <button
          @click=${this._add}
          ?disabled=${this._busy || !this._value.trim()}
        >
          add
        </button>
      </div>
    `;
  }
  async _add() {
    const e = this._value.trim();
    if (!(!e || !this.entityId)) {
      this._busy = !0;
      try {
        await u.createItem(this.entityId, { title: e }) && (this._value = "");
      } finally {
        this._busy = !1;
      }
    }
  }
};
F.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .capture-row {
        display: flex;
        gap: 8px;
        padding: 8px 16px 12px;
      }

      .capture-row input {
        flex: 1;
        padding: 9px 12px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        font-size: 14px;
        font-family: inherit;
        -webkit-appearance: none;
      }

      .capture-row input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.20);
        color: rgb(var(--yahatl-rgb-primary));
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
        min-width: 56px;
      }

      .capture-row button:active {
        opacity: 0.7;
      }
    `
];
mt([
  w({ attribute: !1 })
], F.prototype, "hass", 2);
mt([
  w()
], F.prototype, "entityId", 2);
mt([
  g()
], F.prototype, "_value", 2);
mt([
  g()
], F.prototype, "_busy", 2);
F = mt([
  $("yahatl-quick-add")
], F);
var pi = Object.defineProperty, ui = Object.getOwnPropertyDescriptor, Q = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? ui(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && pi(t, i, a), a;
};
let it = class extends f {
  constructor() {
    super(...arguments), this._config = {}, this._currentIdx = 0, this._store = new W(this), this._initialized = !1;
  }
  setConfig(e) {
    this._config = e;
  }
  static getConfigElement() {
    return document.createElement("yahatl-inbox-card-editor");
  }
  static getStubConfig() {
    return { title: "Inbox" };
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), this._loadInbox()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  async _loadInbox() {
    this._store.state.lists.length === 0 && await u.loadLists();
    for (const t of this._store.state.lists)
      await u.loadItems(t.entity_id, { needs_detail: !0 });
  }
  _getInboxItems() {
    const e = [];
    for (const t of this._store.state.lists) {
      const i = u.getCachedItems(t.entity_id, { needs_detail: !0 });
      for (const s of i)
        s.needs_detail && e.push({ entityId: t.entity_id, item: s });
    }
    return e;
  }
  render() {
    const e = String(this._config.title || "Inbox"), t = this._getInboxItems(), i = t.length;
    if (i === 0)
      return n`
        <ha-card>
          <div class="card-header">${e}</div>
          ${X()}
          <div class="empty-state">All caught up — nothing needs detail</div>
        </ha-card>
      `;
    const s = Math.min(this._currentIdx, i - 1), a = t[s], o = $t(a.item.traits), r = o ? K[o] : "var(--yahatl-rgb-primary)", l = o ? B[o] : "mdi:tray-full";
    return n`
      <ha-card>
        <div class="inbox-header">
          <span class="inbox-header__title">${e}</span>
          <span class="inbox-count">${s + 1} of ${i}</span>
        </div>
        ${X()}

        <div class="inbox-item">
          <div class="inbox-title-row">
            <div class="mush-shape-icon" style="--rgb-state: ${r}">
              <ha-icon icon=${l}></ha-icon>
            </div>
            <div class="inbox-title">${a.item.title}</div>
          </div>
          ${a.item.tags.length > 0 ? n`
                <div class="inbox-tags">
                  ${a.item.tags.map(
      (c) => n`<span class="tag-chip">#${c}</span>`
    )}
                </div>
              ` : d}
          <div class="inbox-actions">
            <button
              class="btn btn--primary"
              @click=${() => this._openEditor(a.entityId, a.item.uid)}
            >
              Add details
            </button>
            <button
              class="btn btn--ghost"
              @click=${() => this._markDone(a.entityId, a.item.uid)}
            >
              Good enough
            </button>
          </div>
        </div>

        ${i > 1 ? n`
              <div class="nav-row">
                <button
                  class="btn btn--ghost"
                  ?disabled=${s === 0}
                  @click=${() => this._currentIdx = s - 1}
                >
                  Previous
                </button>
                <button
                  class="btn btn--ghost"
                  ?disabled=${s >= i - 1}
                  @click=${() => this._currentIdx = s + 1}
                >
                  Next
                </button>
              </div>
            ` : d}
      </ha-card>
    `;
  }
  _openEditor(e, t) {
    G(this, { entityId: e, itemId: t, hass: this.hass });
  }
  async _markDone(e, t) {
    await u.saveItem(e, t, { needs_detail: !1 }) && await this._loadInbox();
  }
  getCardSize() {
    return 3;
  }
};
it.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .inbox-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 16px 8px;
      }

      .inbox-header__title {
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.15px;
        color: var(--yahatl-text);
      }

      .inbox-count {
        font-size: 12px;
        color: var(--yahatl-text-secondary);
        letter-spacing: 0.4px;
      }

      .inbox-item {
        padding: 8px 16px 16px;
      }

      .inbox-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .inbox-title {
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0.1px;
        flex: 1;
      }

      .inbox-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }

      .inbox-actions {
        display: flex;
        gap: 10px;
      }

      .nav-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 16px;
        border-top: 1px solid var(--yahatl-divider);
      }
    `
];
Q([
  w({ attribute: !1 })
], it.prototype, "hass", 2);
Q([
  g()
], it.prototype, "_config", 2);
Q([
  g()
], it.prototype, "_currentIdx", 2);
it = Q([
  $("yahatl-inbox-card")
], it);
let st = class extends f {
  constructor() {
    super(...arguments), this._config = {};
  }
  setConfig(e) {
    this._config = e;
  }
  render() {
    return this.hass ? n`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${st._schema}
        .computeLabel=${(e) => e.name === "title" ? "Card title" : e.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    ` : d;
  }
  _valueChanged(e) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e.detail.value },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
st._schema = [
  { name: "title", selector: { text: {} } }
];
Q([
  w({ attribute: !1 })
], st.prototype, "hass", 2);
Q([
  g()
], st.prototype, "_config", 2);
st = Q([
  $("yahatl-inbox-card-editor")
], st);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-inbox-card",
  name: "Yahatl Inbox",
  description: "Triage items that need more detail"
});
var gi = Object.defineProperty, mi = Object.getOwnPropertyDescriptor, k = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? mi(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && gi(t, i, a), a;
};
let A = class extends f {
  constructor() {
    super(...arguments), this._config = {}, this._store = new W(this), this._initialized = !1, this._editingContext = null, this._editName = "", this._editIcon = "", this._editingLocation = null, this._editLocName = "", this._editLocIcon = "", this._renamingTag = null, this._renameValue = "", this._confirmDelete = null;
  }
  setConfig(e) {
    this._config = e;
  }
  static getConfigElement() {
    return document.createElement("yahatl-manage-card-editor");
  }
  static getStubConfig() {
    return { title: "Manage" };
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadMeta(), u.loadTags()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  render() {
    const e = this._store.state.meta, t = this._store.state.tags, i = (e == null ? void 0 : e.contexts) || [], s = (e == null ? void 0 : e.locations) || [], a = this._getZones();
    return n`
      <ha-card>
        <div class="card-header">${String(this._config.title || "Manage")}</div>
        ${X()}

        <!-- Contexts -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">Contexts</span>
          </div>
          ${i.map((o, r) => this._renderContextRow(o, r, i.length))}
          ${this._editingContext === "__new__" ? this._renderContextEditor(null) : n`
                <button class="add-btn" @click=${() => this._startNewContext()}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  Add context
                </button>
              `}
        </div>

        <hr class="section-divider" />

        <!-- Tags -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">Tags</span>
          </div>
          ${t.length === 0 ? n`<div class="empty-state" style="padding: 12px 16px">No tags in use</div>` : t.map((o) => this._renderTagRow(o))}
        </div>

        <hr class="section-divider" />

        <!-- Locations -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">Custom Locations</span>
          </div>
          ${a.length > 0 ? n`
                <div style="padding: 0 16px 6px; font-size: 12px; color: var(--yahatl-text-secondary)">
                  HA zones auto-included. Custom locations extend them.
                </div>
              ` : d}
          ${s.map((o, r) => this._renderLocationRow(o, r, s.length))}
          ${this._editingLocation === "__new__" ? this._renderLocationEditor(null) : n`
                <button class="add-btn" @click=${() => this._startNewLocation()}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  Add location
                </button>
              `}
        </div>

        <!-- Confirm delete bar -->
        ${this._confirmDelete ? this._renderConfirmBar() : d}
      </ha-card>
    `;
  }
  // --- Context rendering ---
  _renderContextRow(e, t, i) {
    return this._editingContext === e.id ? this._renderContextEditor(e) : n`
      <div class="entry-row">
        <div class="entry-icon">
          <ha-icon icon=${e.icon}></ha-icon>
        </div>
        <span class="entry-name">${e.name}</span>
        <div class="entry-actions">
          ${t > 0 ? n`<button class="icon-btn" @click=${() => this._moveContext(t, -1)} title="Move up" aria-label="Move ${e.name} up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>` : d}
          ${t < i - 1 ? n`<button class="icon-btn" @click=${() => this._moveContext(t, 1)} title="Move down" aria-label="Move ${e.name} down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>` : d}
          <button class="icon-btn" @click=${() => this._startEditContext(e)} title="Edit" aria-label="Edit ${e.name}">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("context", e.id)} title="Delete" aria-label="Delete ${e.name}">
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
      </div>
    `;
  }
  _renderContextEditor(e) {
    return n`
      <div class="edit-panel">
        <div class="edit-row">
          <div class="edit-field">
            <label>Name</label>
            <input
              type="text"
              .value=${this._editName}
              @input=${(t) => this._editName = t.target.value}
              placeholder="e.g. Deep Work"
            />
          </div>
          <div class="edit-field" style="flex: 0 0 auto; width: 200px">
            <label>Icon</label>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._editIcon}
              @value-changed=${(t) => this._editIcon = t.detail.value}
            ></ha-icon-picker>
          </div>
        </div>
        <div class="edit-buttons">
          <button class="btn btn--ghost" @click=${() => this._cancelEditContext()}>Cancel</button>
          <button
            class="btn btn--primary"
            @click=${() => this._saveContext(e)}
            ?disabled=${!this._editName.trim()}
          >
            ${e ? "Save" : "Add"}
          </button>
        </div>
      </div>
    `;
  }
  // --- Location rendering ---
  _renderLocationRow(e, t, i) {
    return this._editingLocation === e.id ? this._renderLocationEditor(e) : n`
      <div class="entry-row">
        <div class="entry-icon">
          <ha-icon icon=${e.icon}></ha-icon>
        </div>
        <span class="entry-name">${e.name}</span>
        <div class="entry-actions">
          ${t > 0 ? n`<button class="icon-btn" @click=${() => this._moveLocation(t, -1)} title="Move up" aria-label="Move ${e.name} up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>` : d}
          ${t < i - 1 ? n`<button class="icon-btn" @click=${() => this._moveLocation(t, 1)} title="Move down" aria-label="Move ${e.name} down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>` : d}
          <button class="icon-btn" @click=${() => this._startEditLocation(e)} title="Edit" aria-label="Edit ${e.name}">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("location", e.id)} title="Delete" aria-label="Delete ${e.name}">
            <ha-icon icon="mdi:delete"></ha-icon>
          </button>
        </div>
      </div>
    `;
  }
  _renderLocationEditor(e) {
    return n`
      <div class="edit-panel">
        <div class="edit-row">
          <div class="edit-field">
            <label>Name</label>
            <input
              type="text"
              .value=${this._editLocName}
              @input=${(t) => this._editLocName = t.target.value}
              placeholder="e.g. Office"
            />
          </div>
          <div class="edit-field" style="flex: 0 0 auto; width: 200px">
            <label>Icon</label>
            <ha-icon-picker
              .hass=${this.hass}
              .value=${this._editLocIcon}
              @value-changed=${(t) => this._editLocIcon = t.detail.value}
            ></ha-icon-picker>
          </div>
        </div>
        <div class="edit-buttons">
          <button class="btn btn--ghost" @click=${() => this._cancelEditLocation()}>Cancel</button>
          <button
            class="btn btn--primary"
            @click=${() => this._saveLocation(e)}
            ?disabled=${!this._editLocName.trim()}
          >
            ${e ? "Save" : "Add"}
          </button>
        </div>
      </div>
    `;
  }
  // --- Tag rendering ---
  _renderTagRow(e) {
    const t = this._renamingTag === e.name;
    return n`
      <div class="entry-row">
        <div class="entry-icon" style="background: rgba(var(--rgb-primary-text-color), 0.06); color: var(--yahatl-text-secondary)">
          <ha-icon icon="mdi:pound"></ha-icon>
        </div>
        ${t ? n`
              <input
                class="tag-rename-input"
                type="text"
                .value=${this._renameValue}
                @input=${(i) => this._renameValue = i.target.value}
                @keydown=${(i) => {
      i.key === "Enter" && this._confirmRenameTag(e.name), i.key === "Escape" && (this._renamingTag = null);
    }}
              />
              <button class="btn btn--primary" style="padding: 5px 12px; font-size: 12px"
                @click=${() => this._confirmRenameTag(e.name)}
                ?disabled=${!this._renameValue.trim() || this._renameValue === e.name}
              >ok</button>
              <button class="btn btn--ghost" style="padding: 5px 10px; font-size: 12px"
                @click=${() => this._renamingTag = null}
              >cancel</button>
            ` : n`
              <span class="entry-name">#${e.name}</span>
              <span class="entry-badge">${e.count} item${e.count !== 1 ? "s" : ""}</span>
              <div class="entry-actions">
                <button class="icon-btn" @click=${() => this._startRenameTag(e)} title="Rename" aria-label="Rename tag ${e.name}">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("tag", e.name)} title="Delete" aria-label="Delete tag ${e.name}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `}
      </div>
    `;
  }
  // --- Confirm delete bar ---
  _renderConfirmBar() {
    const e = this._confirmDelete, t = e.type === "context" ? "context" : e.type === "location" ? "location" : "tag";
    let i = "";
    if (e.type === "tag") {
      const s = this._store.state.tags.find((a) => a.name === e.id);
      s && s.count > 0 && (i = ` Used by ${s.count} item${s.count !== 1 ? "s" : ""}.`);
    }
    return n`
      <div class="confirm-bar">
        <span class="confirm-bar__msg">
          Delete ${t} "${e.id}"?${i} This will remove it from all items.
        </span>
        <button class="btn btn--ghost" @click=${() => this._confirmDelete = null}>Cancel</button>
        <button class="btn btn--danger" @click=${() => this._executeDelete()}>Delete</button>
      </div>
    `;
  }
  // --- Context actions ---
  _startNewContext() {
    this._editingContext = "__new__", this._editName = "", this._editIcon = "mdi:label";
  }
  _startEditContext(e) {
    this._editingContext = e.id, this._editName = e.name, this._editIcon = e.icon;
  }
  _cancelEditContext() {
    this._editingContext = null;
  }
  async _saveContext(e) {
    const t = this._store.state.meta;
    if (!t) return;
    const i = this._editName.trim();
    if (!i) return;
    const s = this._editIcon || "mdi:label";
    let a;
    if (e)
      a = t.contexts.map(
        (r) => r.id === e.id ? { id: e.id, name: i, icon: s } : r
      );
    else {
      const r = i.toLowerCase().replace(/\s+/g, "_");
      a = [...t.contexts, { id: r, name: i, icon: s }];
    }
    await u.saveMeta({ ...t, contexts: a }) && (this._editingContext = null);
  }
  async _moveContext(e, t) {
    const i = this._store.state.meta;
    if (!i) return;
    const s = [...i.contexts], a = e + t;
    a < 0 || a >= s.length || ([s[e], s[a]] = [s[a], s[e]], await u.saveMeta({ ...i, contexts: s }));
  }
  // --- Location actions ---
  _startNewLocation() {
    this._editingLocation = "__new__", this._editLocName = "", this._editLocIcon = "mdi:map-marker";
  }
  _startEditLocation(e) {
    this._editingLocation = e.id, this._editLocName = e.name, this._editLocIcon = e.icon;
  }
  _cancelEditLocation() {
    this._editingLocation = null;
  }
  async _saveLocation(e) {
    const t = this._store.state.meta;
    if (!t) return;
    const i = this._editLocName.trim();
    if (!i) return;
    const s = i.toLowerCase().replace(/\s+/g, "_"), a = this._editLocIcon || "mdi:map-marker";
    let o;
    e ? o = t.locations.map(
      (l) => l.id === e.id ? { id: e.id, name: i, icon: a } : l
    ) : o = [...t.locations, { id: s, name: i, icon: a }], await u.saveMeta({ ...t, locations: o }) && (this._editingLocation = null);
  }
  async _moveLocation(e, t) {
    const i = this._store.state.meta;
    if (!i) return;
    const s = [...i.locations], a = e + t;
    a < 0 || a >= s.length || ([s[e], s[a]] = [s[a], s[e]], await u.saveMeta({ ...i, locations: s }));
  }
  // --- Tag actions ---
  _startRenameTag(e) {
    this._renamingTag = e.name, this._renameValue = e.name;
  }
  async _confirmRenameTag(e) {
    const t = this._renameValue.trim();
    if (!t || t === e) return;
    await u.renameTag(e, t) && (this._renamingTag = null);
  }
  // --- Delete flow ---
  _requestDelete(e, t) {
    this._confirmDelete = { type: e, id: t };
  }
  async _executeDelete() {
    const e = this._confirmDelete;
    if (e) {
      if (e.type === "context") {
        const t = this._store.state.meta;
        if (t) {
          const i = t.contexts.filter((s) => s.id !== e.id);
          await u.saveMeta({ ...t, contexts: i });
        }
      } else if (e.type === "location") {
        const t = this._store.state.meta;
        if (t) {
          const i = t.locations.filter((s) => s.id !== e.id);
          await u.saveMeta({ ...t, locations: i });
        }
      } else e.type === "tag" && await u.deleteTag(e.id);
      this._confirmDelete = null;
    }
  }
  // --- Helpers ---
  _getZones() {
    var t;
    if (!((t = this.hass) != null && t.states)) return [];
    const e = [];
    for (const [i, s] of Object.entries(this.hass.states))
      if (i.startsWith("zone.")) {
        const a = s.attributes.friendly_name || i.replace("zone.", ""), o = s.attributes.icon || "mdi:map-marker";
        e.push({ id: a.toLowerCase(), name: a, icon: o });
      }
    return e;
  }
  getCardSize() {
    return 6;
  }
};
A.styles = [
  O,
  I`
      :host {
        display: block;
      }

      .section {
        padding: 0 0 8px;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 8px;
      }

      .section-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 600;
        color: var(--yahatl-text-secondary);
      }

      .section-divider {
        border: none;
        border-top: 1px solid var(--yahatl-divider);
        margin: 0;
      }

      .entry-row {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        gap: 10px;
      }

      .entry-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(var(--yahatl-rgb-primary), 0.10);
        color: rgb(var(--yahatl-rgb-primary));
        display: grid;
        place-items: center;
        flex: none;
      }

      .entry-icon ha-icon {
        --mdc-icon-size: 18px;
        color: inherit;
      }

      .entry-name {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entry-badge {
        font-size: 11px;
        color: var(--yahatl-text-secondary);
        background: rgba(var(--rgb-primary-text-color), 0.05);
        padding: 2px 8px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      .entry-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        transition: background-color 120ms;
      }

      .icon-btn:hover {
        background: rgba(var(--rgb-primary-text-color), 0.06);
      }

      .icon-btn:active {
        opacity: 0.7;
      }

      .icon-btn ha-icon {
        --mdc-icon-size: 18px;
        color: inherit;
      }

      .icon-btn--danger {
        color: rgb(var(--rgb-danger));
      }

      /* Expand-in-place editor */
      .edit-panel {
        padding: 8px 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: rgba(var(--rgb-primary-text-color), 0.02);
        border-top: 1px solid var(--yahatl-divider);
        border-bottom: 1px solid var(--yahatl-divider);
      }

      .edit-row {
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }

      .edit-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .edit-field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--yahatl-text-secondary);
        font-weight: 500;
      }

      .edit-field input {
        padding: 8px 10px;
        border: 1px solid var(--yahatl-divider);
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        -webkit-appearance: none;
      }

      .edit-field input:focus {
        outline: none;
        border-color: rgb(var(--yahatl-rgb-primary));
      }

      .edit-buttons {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        padding-top: 2px;
      }

      /* Tag rename inline */
      .tag-rename-input {
        padding: 4px 8px;
        border: 1px solid rgb(var(--yahatl-rgb-primary));
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        background: var(--yahatl-card-bg);
        color: var(--yahatl-text);
        width: 120px;
        -webkit-appearance: none;
      }

      .tag-rename-input:focus {
        outline: none;
      }

      /* Confirm delete overlay */
      .confirm-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(var(--rgb-danger), 0.08);
        border-top: 1px solid var(--yahatl-divider);
      }

      .confirm-bar__msg {
        flex: 1;
        font-size: 13px;
        color: rgb(var(--rgb-danger));
      }

      .add-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        margin: 4px 16px 8px;
        border: 1px dashed var(--yahatl-divider);
        border-radius: 8px;
        background: none;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        color: var(--yahatl-text-secondary);
        -webkit-tap-highlight-color: transparent;
        width: calc(100% - 32px);
        box-sizing: border-box;
      }

      .add-btn:hover {
        border-color: rgb(var(--yahatl-rgb-primary));
        color: rgb(var(--yahatl-rgb-primary));
      }

      .add-btn ha-icon {
        --mdc-icon-size: 16px;
      }
    `
];
k([
  w({ attribute: !1 })
], A.prototype, "hass", 2);
k([
  g()
], A.prototype, "_config", 2);
k([
  g()
], A.prototype, "_editingContext", 2);
k([
  g()
], A.prototype, "_editName", 2);
k([
  g()
], A.prototype, "_editIcon", 2);
k([
  g()
], A.prototype, "_editingLocation", 2);
k([
  g()
], A.prototype, "_editLocName", 2);
k([
  g()
], A.prototype, "_editLocIcon", 2);
k([
  g()
], A.prototype, "_renamingTag", 2);
k([
  g()
], A.prototype, "_renameValue", 2);
k([
  g()
], A.prototype, "_confirmDelete", 2);
A = k([
  $("yahatl-manage-card")
], A);
let at = class extends f {
  constructor() {
    super(...arguments), this._config = {};
  }
  setConfig(e) {
    this._config = e;
  }
  render() {
    return this.hass ? n`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${at._schema}
        .computeLabel=${(e) => e.name === "title" ? "Card title" : e.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    ` : d;
  }
  _valueChanged(e) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e.detail.value },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
at._schema = [
  { name: "title", selector: { text: {} } }
];
k([
  w({ attribute: !1 })
], at.prototype, "hass", 2);
k([
  g()
], at.prototype, "_config", 2);
at = k([
  $("yahatl-manage-card-editor")
], at);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-manage-card",
  name: "Yahatl Manage",
  description: "Manage contexts, tags, and locations for yahatl"
});
export {
  yt as YahtlContextBar,
  it as YahtlInboxCard,
  y as YahtlItemEditor,
  E as YahtlListCard,
  A as YahtlManageCard,
  T as YahtlMyTasksCard,
  C as YahtlQueueCard,
  F as YahtlQuickAdd,
  tt as YahtlSnackbar,
  vt as YahtlStatsCard
};
