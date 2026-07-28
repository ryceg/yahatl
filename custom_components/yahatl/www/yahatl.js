/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const rt = globalThis, yt = rt.ShadowRoot && (rt.ShadyCSS === void 0 || rt.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ft = Symbol(), wt = /* @__PURE__ */ new WeakMap();
let Ot = class {
  constructor(t, i, s) {
    if (this._$cssResult$ = !0, s !== ft) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = i;
  }
  get styleSheet() {
    let t = this.o;
    const i = this.t;
    if (yt && t === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (t = wt.get(i)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && wt.set(i, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ut = (e) => new Ot(typeof e == "string" ? e : e + "", void 0, ft), C = (e, ...t) => {
  const i = e.length === 1 ? e[0] : t.reduce((s, a, o) => s + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[o + 1], e[0]);
  return new Ot(i, e, ft);
}, Bt = (e, t) => {
  if (yt) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const s = document.createElement("style"), a = rt.litNonce;
    a !== void 0 && s.setAttribute("nonce", a), s.textContent = i.cssText, e.appendChild(s);
  }
}, $t = yt ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const s of t.cssRules) i += s.cssText;
  return Ut(i);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Yt, defineProperty: Wt, getOwnPropertyDescriptor: Ft, getOwnPropertyNames: Vt, getOwnPropertySymbols: Qt, getPrototypeOf: Zt } = Object, L = globalThis, kt = L.trustedTypes, Gt = kt ? kt.emptyScript : "", ut = L.reactiveElementPolyfillSupport, G = (e, t) => e, ot = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Gt : null;
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
} }, vt = (e, t) => !Yt(e, t), Ct = { attribute: !0, type: String, converter: ot, reflect: !1, useDefault: !1, hasChanged: vt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), L.litPropertyMetadata ?? (L.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let B = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, i = Ct) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(t, i), !i.noAccessor) {
      const s = Symbol(), a = this.getPropertyDescriptor(t, s, i);
      a !== void 0 && Wt(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, i, s) {
    const { get: a, set: o } = Ft(this.prototype, t) ?? { get() {
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
    return this.elementProperties.get(t) ?? Ct;
  }
  static _$Ei() {
    if (this.hasOwnProperty(G("elementProperties"))) return;
    const t = Zt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(G("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(G("properties"))) {
      const i = this.properties, s = [...Vt(i), ...Qt(i)];
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
      for (const a of s) i.unshift($t(a));
    } else t !== void 0 && i.push($t(t));
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
    return Bt(t, this.constructor.elementStyles), t;
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
      const r = (((o = s.converter) == null ? void 0 : o.toAttribute) !== void 0 ? s.converter : ot).toAttribute(i, s.type);
      this._$Em = t, r == null ? this.removeAttribute(a) : this.setAttribute(a, r), this._$Em = null;
    }
  }
  _$AK(t, i) {
    var o, r;
    const s = this.constructor, a = s._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const l = s.getPropertyOptions(a), d = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((o = l.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? l.converter : ot;
      this._$Em = a;
      const p = d.fromAttribute(i, l.type);
      this[a] = p ?? ((r = this._$Ej) == null ? void 0 : r.get(a)) ?? p, this._$Em = null;
    }
  }
  requestUpdate(t, i, s, a = !1, o) {
    var r;
    if (t !== void 0) {
      const l = this.constructor;
      if (a === !1 && (o = this[t]), s ?? (s = l.getPropertyOptions(t)), !((s.hasChanged ?? vt)(o, i) || s.useDefault && s.reflect && o === ((r = this._$Ej) == null ? void 0 : r.get(t)) && !this.hasAttribute(l._$Eu(t, s)))) return;
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
        const { wrapped: l } = r, d = this[o];
        l !== !0 || this._$AL.has(o) || d === void 0 || this.C(o, void 0, r, d);
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
B.elementStyles = [], B.shadowRootOptions = { mode: "open" }, B[G("elementProperties")] = /* @__PURE__ */ new Map(), B[G("finalized")] = /* @__PURE__ */ new Map(), ut == null || ut({ ReactiveElement: B }), (L.reactiveElementVersions ?? (L.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis, At = (e) => e, nt = X.trustedTypes, St = nt ? nt.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Nt = "$lit$", z = `lit$${Math.random().toFixed(9).slice(2)}$`, Pt = "?" + z, Xt = `<${Pt}>`, R = document, K = () => R.createComment(""), J = (e) => e === null || typeof e != "object" && typeof e != "function", xt = Array.isArray, Kt = (e) => xt(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", gt = `[ 	
\f\r]`, Q = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Tt = /-->/g, Et = />/g, N = RegExp(`>|${gt}(?:([^\\s"'>=/]+)(${gt}*=${gt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), It = /'/g, Dt = /"/g, Mt = /^(?:script|style|textarea|title)$/i, Jt = (e) => (t, ...i) => ({ _$litType$: e, strings: t, values: i }), n = Jt(1), Y = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), zt = /* @__PURE__ */ new WeakMap(), P = R.createTreeWalker(R, 129);
function Rt(e, t) {
  if (!xt(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return St !== void 0 ? St.createHTML(t) : t;
}
const te = (e, t) => {
  const i = e.length - 1, s = [];
  let a, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = Q;
  for (let l = 0; l < i; l++) {
    const d = e[l];
    let p, h, m = -1, T = 0;
    for (; T < d.length && (r.lastIndex = T, h = r.exec(d), h !== null); ) T = r.lastIndex, r === Q ? h[1] === "!--" ? r = Tt : h[1] !== void 0 ? r = Et : h[2] !== void 0 ? (Mt.test(h[2]) && (a = RegExp("</" + h[2], "g")), r = N) : h[3] !== void 0 && (r = N) : r === N ? h[0] === ">" ? (r = a ?? Q, m = -1) : h[1] === void 0 ? m = -2 : (m = r.lastIndex - h[2].length, p = h[1], r = h[3] === void 0 ? N : h[3] === '"' ? Dt : It) : r === Dt || r === It ? r = N : r === Tt || r === Et ? r = Q : (r = N, a = void 0);
    const D = r === N && e[l + 1].startsWith("/>") ? " " : "";
    o += r === Q ? d + Xt : m >= 0 ? (s.push(p), d.slice(0, m) + Nt + d.slice(m) + z + D) : d + z + (m === -2 ? l : D);
  }
  return [Rt(e, o + (e[i] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class tt {
  constructor({ strings: t, _$litType$: i }, s) {
    let a;
    this.parts = [];
    let o = 0, r = 0;
    const l = t.length - 1, d = this.parts, [p, h] = te(t, i);
    if (this.el = tt.createElement(p, s), P.currentNode = this.el.content, i === 2 || i === 3) {
      const m = this.el.content.firstChild;
      m.replaceWith(...m.childNodes);
    }
    for (; (a = P.nextNode()) !== null && d.length < l; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const m of a.getAttributeNames()) if (m.endsWith(Nt)) {
          const T = h[r++], D = a.getAttribute(m).split(z), at = /([.?@])?(.*)/.exec(T);
          d.push({ type: 1, index: o, name: at[2], strings: D, ctor: at[1] === "." ? ie : at[1] === "?" ? se : at[1] === "@" ? ae : dt }), a.removeAttribute(m);
        } else m.startsWith(z) && (d.push({ type: 6, index: o }), a.removeAttribute(m));
        if (Mt.test(a.tagName)) {
          const m = a.textContent.split(z), T = m.length - 1;
          if (T > 0) {
            a.textContent = nt ? nt.emptyScript : "";
            for (let D = 0; D < T; D++) a.append(m[D], K()), P.nextNode(), d.push({ type: 2, index: ++o });
            a.append(m[T], K());
          }
        }
      } else if (a.nodeType === 8) if (a.data === Pt) d.push({ type: 2, index: o });
      else {
        let m = -1;
        for (; (m = a.data.indexOf(z, m + 1)) !== -1; ) d.push({ type: 7, index: o }), m += z.length - 1;
      }
      o++;
    }
  }
  static createElement(t, i) {
    const s = R.createElement("template");
    return s.innerHTML = t, s;
  }
}
function W(e, t, i = e, s) {
  var r, l;
  if (t === Y) return t;
  let a = s !== void 0 ? (r = i._$Co) == null ? void 0 : r[s] : i._$Cl;
  const o = J(t) ? void 0 : t._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== o && ((l = a == null ? void 0 : a._$AO) == null || l.call(a, !1), o === void 0 ? a = void 0 : (a = new o(e), a._$AT(e, i, s)), s !== void 0 ? (i._$Co ?? (i._$Co = []))[s] = a : i._$Cl = a), a !== void 0 && (t = W(e, a._$AS(e, t.values), a, s)), t;
}
class ee {
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
    const { el: { content: i }, parts: s } = this._$AD, a = ((t == null ? void 0 : t.creationScope) ?? R).importNode(i, !0);
    P.currentNode = a;
    let o = P.nextNode(), r = 0, l = 0, d = s[0];
    for (; d !== void 0; ) {
      if (r === d.index) {
        let p;
        d.type === 2 ? p = new it(o, o.nextSibling, this, t) : d.type === 1 ? p = new d.ctor(o, d.name, d.strings, this, t) : d.type === 6 && (p = new re(o, this, t)), this._$AV.push(p), d = s[++l];
      }
      r !== (d == null ? void 0 : d.index) && (o = P.nextNode(), r++);
    }
    return P.currentNode = R, a;
  }
  p(t) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
  }
}
class it {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, i, s, a) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
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
    t = W(this, t, i), J(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== Y && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Kt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && J(this._$AH) ? this._$AA.nextSibling.data = t : this.T(R.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: i, _$litType$: s } = t, a = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = tt.createElement(Rt(s.h, s.h[0]), this.options)), s);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === a) this._$AH.p(i);
    else {
      const r = new ee(a, this), l = r.u(this.options);
      r.p(i), this.T(l), this._$AH = r;
    }
  }
  _$AC(t) {
    let i = zt.get(t.strings);
    return i === void 0 && zt.set(t.strings, i = new tt(t)), i;
  }
  k(t) {
    xt(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, a = 0;
    for (const o of t) a === i.length ? i.push(s = new it(this.O(K()), this.O(K()), this, this.options)) : s = i[a], s._$AI(o), a++;
    a < i.length && (this._$AR(s && s._$AB.nextSibling, a), i.length = a);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, i); t !== this._$AB; ) {
      const a = At(t).nextSibling;
      At(t).remove(), t = a;
    }
  }
  setConnected(t) {
    var i;
    this._$AM === void 0 && (this._$Cv = t, (i = this._$AP) == null || i.call(this, t));
  }
}
class dt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, i, s, a, o) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = t, this.name = i, this._$AM = a, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(t, i = this, s, a) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) t = W(this, t, i, 0), r = !J(t) || t !== this._$AH && t !== Y, r && (this._$AH = t);
    else {
      const l = t;
      let d, p;
      for (t = o[0], d = 0; d < o.length - 1; d++) p = W(this, l[s + d], i, d), p === Y && (p = this._$AH[d]), r || (r = !J(p) || p !== this._$AH[d]), p === c ? t = c : t !== c && (t += (p ?? "") + o[d + 1]), this._$AH[d] = p;
    }
    r && !a && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ie extends dt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class se extends dt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class ae extends dt {
  constructor(t, i, s, a, o) {
    super(t, i, s, a, o), this.type = 5;
  }
  _$AI(t, i = this) {
    if ((t = W(this, t, i, 0) ?? c) === Y) return;
    const s = this._$AH, a = t === c && s !== c || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== c && (s === c || a);
    a && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class re {
  constructor(t, i, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    W(this, t);
  }
}
const mt = X.litHtmlPolyfillSupport;
mt == null || mt(tt, it), (X.litHtmlVersions ?? (X.litHtmlVersions = [])).push("3.3.2");
const oe = (e, t, i) => {
  const s = (i == null ? void 0 : i.renderBefore) ?? t;
  let a = s._$litPart$;
  if (a === void 0) {
    const o = (i == null ? void 0 : i.renderBefore) ?? null;
    s._$litPart$ = a = new it(t.insertBefore(K(), o), o, void 0, i ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis;
class y extends B {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = oe(i, this.renderRoot, this.renderOptions);
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
}
var qt;
y._$litElement$ = !0, y.finalized = !0, (qt = M.litElementHydrateSupport) == null || qt.call(M, { LitElement: y });
const _t = M.litElementPolyfillSupport;
_t == null || _t({ LitElement: y });
(M.litElementVersions ?? (M.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const A = (e) => (t, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = { attribute: !0, type: String, converter: ot, reflect: !1, hasChanged: vt }, le = (e = ne, t, i) => {
  const { kind: s, metadata: a } = i;
  let o = globalThis.litPropertyMetadata.get(a);
  if (o === void 0 && globalThis.litPropertyMetadata.set(a, o = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), o.set(i.name, e), s === "accessor") {
    const { name: r } = i;
    return { set(l) {
      const d = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(r, d, e, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(r, void 0, e, l), l;
    } };
  }
  if (s === "setter") {
    const { name: r } = i;
    return function(l) {
      const d = this[r];
      t.call(this, l), this.requestUpdate(r, d, e, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function x(e) {
  return (t, i) => typeof i == "object" ? le(e, t, i) : ((s, a, o) => {
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
  return x({ ...e, state: !0, attribute: !1 });
}
const j = {
  actionable: "mdi:play",
  recurring: "mdi:refresh",
  habit: "mdi:star-four-points",
  chore: "mdi:home",
  reminder: "mdi:bell",
  note: "mdi:note-text",
  someday: "mdi:clock-outline",
  shopping: "mdi:cart",
  gift: "mdi:gift"
}, F = {
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
function pt(e) {
  for (const t of e)
    if (t in j) return t;
  return null;
}
const E = C`
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
    --rgb-primary-color: var(--rgb-primary-color, 3, 169, 244);
    --rgb-accent-color: var(--rgb-accent-color, 255, 152, 0);
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
    background: rgba(var(--rgb-state, var(--rgb-primary-color)), 0.20);
    color: rgb(var(--rgb-state, var(--rgb-primary-color)));
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
    background: rgba(var(--rgb-primary-color), 0.10);
    color: rgb(var(--rgb-primary-color));
    padding: 3px 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  /* ── Queue / action button ── */
  .queue-btn {
    border: 0;
    border-radius: 8px;
    padding: 8px 14px;
    background: rgba(var(--rgb-primary-color), 0.20);
    color: rgb(var(--rgb-primary-color));
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
    border-color: rgb(var(--rgb-primary-color));
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
    background: rgb(var(--rgb-primary-color));
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

  /* ── Empty state ── */
  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--yahatl-text-secondary);
    font-size: 15px;
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
class ce {
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
class de {
  constructor() {
    this._api = null, this._hass = null, this._subscribers = /* @__PURE__ */ new Set(), this.state = {
      lists: [],
      items: /* @__PURE__ */ new Map(),
      queue: null,
      context: null,
      meta: null,
      tags: [],
      loading: !1
    };
  }
  get api() {
    return this._api;
  }
  get hass() {
    return this._hass;
  }
  setHass(t) {
    this._hass = t, this._api = new ce(t);
  }
  subscribe(t) {
    return this._subscribers.add(t), () => this._subscribers.delete(t);
  }
  _notify() {
    for (const t of this._subscribers) t();
  }
  // --- Data loading ---
  async loadLists() {
    this._api && (this.state.lists = await this._api.getLists(), this._notify());
  }
  async loadItems(t, i) {
    if (!this._api) return;
    const s = await this._api.getItems(t, i);
    this.state.items.set(t, s), this._notify();
  }
  async loadQueue(t) {
    this._api && (this.state.queue = await this._api.getQueue(t), this._notify());
  }
  async loadContext() {
    this._api && (this.state.context = await this._api.getContext(), this._notify());
  }
  async loadMeta() {
    this._api && (this.state.meta = await this._api.getMeta(), this._notify());
  }
  async loadTags() {
    this._api && (this.state.tags = await this._api.getTags(), this._notify());
  }
  // --- Mutations (call API then refresh) ---
  async createItem(t, i) {
    this._api && (await this._api.createItem(t, i), await this.loadItems(t), await this.loadQueue());
  }
  async saveItem(t, i, s) {
    this._api && (await this._api.saveItem(t, i, s), await this.loadItems(t), await this.loadQueue());
  }
  async deleteItem(t, i) {
    this._api && (await this._api.deleteItem(t, i), await this.loadItems(t), await this.loadQueue());
  }
  async completeItem(t, i) {
    this._api && (this.state.queue && (this.state.queue = {
      ...this.state.queue,
      items: this.state.queue.items.filter((s) => s.item.uid !== i)
    }, this._notify()), await this._api.completeItem(t, i), await this.loadItems(t), await this.loadQueue());
  }
  async deferItem(t, i, s) {
    this._api && (await this._api.deferItem(t, i, s), await this.loadItems(t), await this.loadQueue());
  }
  /** Delay to next valid period (server-computed). Returns the new
   *  deferred_until ISO string so the UI can confirm when it'll be back. */
  async delayItem(t, i) {
    if (!this._api) return null;
    this.state.queue && (this.state.queue = {
      ...this.state.queue,
      items: this.state.queue.items.filter((a) => a.item.uid !== i)
    }, this._notify());
    const s = await this._api.delayItem(t, i);
    return await this.loadItems(t), await this.loadQueue(), (s == null ? void 0 : s.deferred_until) ?? null;
  }
  async setContext(t) {
    this._api && (this.state.context = await this._api.setContext(t), await this.loadQueue());
  }
  async saveMeta(t, i) {
    this._api && (this.state.meta = await this._api.setMeta(t, i), this._notify(), await this.loadQueue());
  }
  async renameTag(t, i) {
    this._api && (await this._api.renameTag(t, i), await this.loadTags());
  }
  async deleteTag(t) {
    this._api && (await this._api.deleteTag(t), await this.loadTags());
  }
  async getItemDetails(t, i) {
    return this._api ? this._api.getItemDetails(t, i) : null;
  }
}
const u = new de();
class U {
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
function pe(e, t, i) {
  e.dispatchEvent(
    new CustomEvent(t, {
      detail: i,
      bubbles: !0,
      composed: !0,
      cancelable: !1
    })
  );
}
let Z = null;
function et(e, t) {
  (!Z || !Z.isConnected) && (Z = document.createElement("yahatl-item-editor"), document.body.appendChild(Z)), Z.open(t);
}
var he = Object.defineProperty, ue = Object.getOwnPropertyDescriptor, S = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? ue(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && he(t, i, a), a;
};
let f = class extends y {
  constructor() {
    super(...arguments), this._config = {}, this._quickAddValue = "", this._quickAddBusy = !1, this._flash = "", this._showUpcoming = !1, this._store = new U(this), this._initialized = !1, this._drag = {
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
    var l, d, p;
    const e = this._store.state.queue, t = this._config.max_items || 10, i = this._config.title || "Up Next", s = this._config.todo_entity || "", a = (e == null ? void 0 : e.items.slice(0, t)) || [], o = (d = (l = this.hass) == null ? void 0 : l.user) == null ? void 0 : d.name, r = this._store.state.context;
    return n`
      <ha-card>
        <div class="card-header">${i}</div>
        ${o ? n`<div class="greeting">Hello, ${o}</div>` : c}
        ${this._flash ? n`<div class="flash">${this._flash}</div>` : c}

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

        ${a.length === 0 ? n`<div class="empty-state">Nothing in the queue</div>` : a.map((h, m) => this._renderItem(h, m, s))}
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
                @click=${() => et(this, {
        entityId: `todo.${i.list_id}`,
        itemId: i.item.uid,
        hass: this.hass
      })}
              >
                <span class="upcoming-row__title">${i.item.title}</span>
                <span class="upcoming-row__reason">${i.reason || "not yet"}</span>
              </div>
            `
    ) : c}
    ` : c;
  }
  _renderItem(e, t, i) {
    const s = e.item, a = pt(s.traits), o = a ? F[a] : "var(--rgb-primary-color)", r = a ? j[a] : "mdi:checkbox-marked-circle-outline", l = this._formatDue(s.due), d = e.list_id ? `todo.${e.list_id}` : i;
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
          @click=${() => this._onItemClick(d, s.uid)}
          @touchstart=${(p) => this._onTouchStart(p, d, s.uid)}
          @touchmove=${(p) => this._onTouchMove(p)}
          @touchend=${() => this._onTouchEnd()}
          @touchcancel=${() => this._onTouchEnd()}
        >
        ${s.priority ? n`<div class="priority-rail priority-rail--${s.priority}"></div>` : c}
        <div class="queue-rank">${t + 1}</div>
        <div class="mush-shape-icon">
          <ha-icon icon=${r}></ha-icon>
        </div>
        <div class="queue-info">
          <div class="mush-state-info__primary">${s.title}</div>
          <div class="queue-meta">
            ${l ? n`<span class=${l.className}>${l.label}</span>` : c}
            ${l && (s.time_estimate || s.tags.length) ? n`<span class="sep">·</span>` : c}
            ${s.time_estimate ? n`<span>${s.time_estimate}m</span>` : c}
            ${s.time_estimate && s.tags.length ? n`<span class="sep">·</span>` : c}
            ${s.tags.length > 0 ? n`<span>${s.tags.map((p) => `#${p}`).join(" ")}</span>` : c}
            ${s.current_streak > 0 ? n`<span class="sep">·</span><span>${s.current_streak} day streak</span>` : c}
          </div>
        </div>
        <div class="queue-actions">
          <button
            class="queue-btn queue-btn--ghost"
            title="Delay to the next time this task is schedulable"
            @click=${(p) => {
      p.stopPropagation(), this._delay(d, s.uid);
    }}
          >
            delay
          </button>
          <button
            class="queue-btn"
            @click=${(p) => {
      p.stopPropagation(), this._complete(d, s.uid);
    }}
          >
            done
          </button>
        </div>
        </div>
      </div>
    `;
  }
  _formatDue(e) {
    if (!e) return null;
    const t = new Date(e), i = /* @__PURE__ */ new Date();
    if (t < i)
      return { label: `Overdue ${Math.ceil((i.getTime() - t.getTime()) / 864e5)}d`, className: "overdue" };
    if (t.toDateString() === i.toDateString())
      return { label: "Today", className: "due-today" };
    const s = new Date(i);
    return s.setDate(s.getDate() + 1), t.toDateString() === s.toDateString() ? { label: "Tomorrow", className: "" } : { label: t.toLocaleDateString(), className: "" };
  }
  async _complete(e, t) {
    await u.completeItem(e, t);
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
    const o = f.SWIPE_MAX, r = Math.max(-o, Math.min(o, s));
    t.el.style.transform = `translateX(${r}px)`;
    const l = t.el.parentElement;
    if (l) {
      const d = Math.min(1, Math.abs(r) / f.SWIPE_THRESHOLD), p = l.querySelector(".swipe-hint--done"), h = l.querySelector(".swipe-hint--delay");
      p && (p.style.opacity = s > 0 ? String(d) : "0"), h && (h.style.opacity = s < 0 ? String(d) : "0");
    }
  }
  _onTouchEnd() {
    const e = this._drag;
    if (!e.active || !e.el) {
      e.active = !1;
      return;
    }
    const t = e.el, i = t.parentElement, s = f.SWIPE_THRESHOLD, a = e.dx <= -s, o = e.dx >= s;
    t.style.transition = "transform 180ms ease", t.style.transform = "translateX(0)", window.setTimeout(() => {
      if (t.style.transition = "", i) {
        const d = i.querySelector(".swipe-hint--done"), p = i.querySelector(".swipe-hint--delay");
        d && (d.style.opacity = "0"), p && (p.style.opacity = "0");
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
        await u.createItem(i, { title: t, needs_detail: !0 }), this._quickAddValue = "";
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
    et(this, { entityId: e, itemId: t, hass: this.hass });
  }
  // --- Lovelace card editor support ---
  // Makes the card fully configurable from the UI card picker rather than
  // hand-written YAML: getStubConfig seeds sensible defaults when the card is
  // first added, getConfigElement supplies the ha-form visual editor below.
  static getConfigElement() {
    return document.createElement("yahatl-queue-card-editor");
  }
  static getStubConfig(e) {
    const t = (e == null ? void 0 : e.states) ?? {}, i = Object.keys(t).find(
      (a) => a.startsWith("sensor.") && a.includes("yahatl") && a.endsWith("_queue")
    ) ?? "sensor.yahatl_queue", s = Object.keys(t).find((a) => a.startsWith("todo.") && a.includes("yahatl")) ?? "todo.yahatl";
    return { entity: i, todo_entity: s, title: "Up Next", max_items: 8 };
  }
  getCardSize() {
    return 4;
  }
};
f.SWIPE_THRESHOLD = 80;
f.SWIPE_MAX = 140;
f.styles = [
  E,
  C`
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
        border-color: rgb(var(--rgb-primary-color));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-color), 0.20);
        color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.05);
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
        color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.12);
        color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.12);
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
S([
  x({ attribute: !1 })
], f.prototype, "hass", 2);
S([
  g()
], f.prototype, "_config", 2);
S([
  g()
], f.prototype, "_quickAddValue", 2);
S([
  g()
], f.prototype, "_quickAddBusy", 2);
S([
  g()
], f.prototype, "_flash", 2);
S([
  g()
], f.prototype, "_showUpcoming", 2);
f = S([
  A("yahatl-queue-card")
], f);
let q = class extends y {
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
        .schema=${q._schema}
        .computeLabel=${(e) => q._labels[e.name] ?? e.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    ` : c;
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
q._schema = [
  { name: "entity", required: !0, selector: { entity: { domain: "sensor" } } },
  { name: "todo_entity", required: !0, selector: { entity: { domain: "todo" } } },
  { name: "title", selector: { text: {} } },
  { name: "max_items", selector: { number: { min: 1, max: 50, mode: "box" } } }
];
q._labels = {
  entity: "Queue sensor",
  todo_entity: "Todo list entity",
  title: "Card title",
  max_items: "Max items shown"
};
S([
  x({ attribute: !1 })
], q.prototype, "hass", 2);
S([
  g()
], q.prototype, "_config", 2);
q = S([
  A("yahatl-queue-card-editor")
], q);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue",
  description: "Prioritized task queue with Mushroom-style layout"
});
var ge = Object.defineProperty, me = Object.getOwnPropertyDescriptor, I = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? me(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && ge(t, i, a), a;
};
const _e = ["pending", "in_progress", "completed", "missed"], be = ["actionable", "recurring", "habit", "chore", "reminder", "note"];
let w = class extends y {
  constructor() {
    super(...arguments), this._config = {}, this._activeListIdx = 0, this._filters = { status: null, trait: null, tag: null }, this._showFilters = !1, this._showNotYet = !1, this._showDeferred = !1, this._showCompleted = !1, this._store = new U(this), this._initialized = !1;
  }
  setConfig(e) {
    this._config = e;
  }
  static getStubConfig() {
    return {};
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadLists(), this._loadActiveList()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  render() {
    const e = this._store.state.lists, t = e[this._activeListIdx], i = (t == null ? void 0 : t.entity_id) || "", s = this._store.state.items.get(i) || [], a = this._applyFilters(s), o = Object.values(this._filters).filter(Boolean).length, r = [], l = [], d = [], p = [];
    for (const h of a)
      h.status === "completed" ? p.push(h) : this._isDeferred(h) ? d.push(h) : h.block_reason ? l.push(h) : r.push(h);
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
            ` : c}

        <div class="filter-toggle">
          <span class="filter-toggle__count">${r.length} items</span>
          <button class="filter-toggle__btn" @click=${() => this._showFilters = !this._showFilters}>
            Filters${o > 0 ? n`<span class="active-filter-badge">${o}</span>` : c}
          </button>
        </div>

        ${this._showFilters ? this._renderFilters() : c}

        ${a.length === 0 ? n`<div class="empty-state">No items match</div>` : c}
        ${r.map((h) => this._renderItem(h, i))}
        ${l.length > 0 ? this._renderGroup(
      "Not Yet",
      "mdi:timer-sand",
      l,
      i,
      this._showNotYet,
      () => this._showNotYet = !this._showNotYet
    ) : c}
        ${d.length > 0 ? this._renderGroup(
      "Deferred",
      "mdi:clock-outline",
      d,
      i,
      this._showDeferred,
      () => this._showDeferred = !this._showDeferred
    ) : c}
        ${p.length > 0 ? this._renderGroup(
      "Completed",
      "mdi:check-circle-outline",
      p,
      i,
      this._showCompleted,
      () => this._showCompleted = !this._showCompleted
    ) : c}
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
      ${a ? i.map((r) => this._renderItem(r, s)) : c}
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
          ${_e.map(
      (e) => n`
              <button
                class="mush-chip ${this._filters.status === e ? "mush-chip--filled" : ""}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => this._toggleFilter("status", e)}
              >
                ${e.replace("_", " ")}
              </button>
            `
    )}
        </div>
        <div class="filter-label">Traits</div>
        <div class="chips-strip" style="padding: 0">
          ${be.map(
      (e) => n`
              <button
                class="mush-chip ${this._filters.trait === e ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${F[e]}"
                @click=${() => this._toggleFilter("trait", e)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${j[e]}></ha-icon>
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
    const i = e.status === "completed", s = pt(e.traits), a = s ? F[s] : "var(--rgb-primary-color)", o = s ? j[s] : "", r = this._formatDue(e.due), l = this._isDeferred(e);
    return n`
      <div
        class="item-row"
        style="--rgb-state: ${a}"
        @click=${() => this._openEditor(t, e.uid)}
      >
        ${e.priority ? n`<div class="priority-rail priority-rail--${e.priority}"></div>` : c}

        <div
          class="item-check ${i ? "item-check--done" : ""}"
          @click=${(d) => {
      d.stopPropagation(), i || this._complete(t, e.uid);
    }}
        ></div>

        ${o ? n`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${o}></ha-icon>
            </div>` : c}

        <div class="item-info">
          <div class="item-title ${i ? "item-title--done" : ""}">
            ${e.title}
          </div>
          <div class="item-badges">
            ${r ? n`<span class=${r.className}>${r.label}</span>` : c}
            ${e.time_estimate ? n`<span>${e.time_estimate}m</span>` : c}
            ${e.has_recurrence ? n`<span>repeats</span>` : c}
            ${e.current_streak > 0 ? n`<span class="streak">${e.current_streak}d streak</span>` : c}
            ${e.needs_detail ? n`<span class="needs-detail">needs detail</span>` : c}
            ${l ? n`<span class="deferred">deferred</span>` : c}
            ${e.block_reason && !l ? n`<span class="deferred">${e.block_reason}</span>` : c}
          </div>
        </div>

        ${e.tags.length > 0 ? n`<span class="item-tags">${e.tags.map((d) => `#${d}`).join(" ")}</span>` : c}
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
    et(this, { entityId: e, itemId: t, hass: this.hass });
  }
  _formatDue(e) {
    if (!e) return null;
    const t = new Date(e), i = /* @__PURE__ */ new Date();
    if (t < i)
      return { label: `Overdue ${Math.ceil((i.getTime() - t.getTime()) / 864e5)}d`, className: "overdue" };
    if (t.toDateString() === i.toDateString())
      return { label: "Today", className: "due-today" };
    const s = new Date(i);
    return s.setDate(s.getDate() + 1), t.toDateString() === s.toDateString() ? { label: "Tomorrow", className: "" } : { label: t.toLocaleDateString(), className: "" };
  }
  getCardSize() {
    return 6;
  }
};
w.styles = [
  E,
  C`
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
        color: rgb(var(--rgb-primary-color));
        border-bottom-color: rgb(var(--rgb-primary-color));
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
        color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.20);
        color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .item-row:active {
        background: rgba(var(--rgb-primary-color), 0.08);
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
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .group-header:active {
        background: rgba(var(--rgb-primary-color), 0.08);
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
        background: rgba(var(--rgb-primary-color), 0.12);
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
I([
  x({ attribute: !1 })
], w.prototype, "hass", 2);
I([
  g()
], w.prototype, "_config", 2);
I([
  g()
], w.prototype, "_activeListIdx", 2);
I([
  g()
], w.prototype, "_filters", 2);
I([
  g()
], w.prototype, "_showFilters", 2);
I([
  g()
], w.prototype, "_showNotYet", 2);
I([
  g()
], w.prototype, "_showDeferred", 2);
I([
  g()
], w.prototype, "_showCompleted", 2);
w = I([
  A("yahatl-list-card")
], w);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-list-card",
  name: "Yahatl List",
  description: "Filterable item browser with Mushroom chips and trait icons"
});
var ye = Object.defineProperty, fe = Object.getOwnPropertyDescriptor, O = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? fe(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && ye(t, i, a), a;
};
let k = class extends y {
  constructor() {
    super(...arguments), this._config = {}, this._showNotYet = !1, this._showDeferred = !1, this._showCompleted = !1, this._draft = "", this._busy = !1, this._store = new U(this), this._initialized = !1;
  }
  setConfig(e) {
    if (!e.assigned_to)
      throw new Error("yahatl-my-tasks-card: 'assigned_to' (a Home Assistant user id) is required");
    this._config = e;
  }
  static getStubConfig() {
    return { assigned_to: "", title: "My Tasks" };
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

        ${t.length === 0 ? n`<div class="empty-state">Nothing assigned to you — nice.</div>` : c}
        ${i.map((r) => this._renderItem(r))}
        ${s.length > 0 ? this._renderGroup(
      "Not Yet",
      "mdi:timer-sand",
      s,
      this._showNotYet,
      () => this._showNotYet = !this._showNotYet
    ) : c}
        ${a.length > 0 ? this._renderGroup(
      "Deferred",
      "mdi:clock-outline",
      a,
      this._showDeferred,
      () => this._showDeferred = !this._showDeferred
    ) : c}
        ${o.length > 0 ? this._renderGroup(
      "Completed",
      "mdi:check-circle-outline",
      o,
      this._showCompleted,
      () => this._showCompleted = !this._showCompleted
    ) : c}

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
        }), this._draft = "";
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
      ${s ? i.map((o) => this._renderItem(o)) : c}
    `;
  }
  _isDeferred(e) {
    return !!e.deferred_until && new Date(e.deferred_until) > /* @__PURE__ */ new Date();
  }
  _renderItem(e) {
    const t = e.status === "completed", i = pt(e.traits), s = i ? F[i] : "var(--rgb-primary-color)", a = i ? j[i] : "", o = this._formatDue(e.due), r = this._isDeferred(e);
    return n`
      <div
        class="item-row"
        style="--rgb-state: ${s}"
        @click=${() => this._openEditor(e)}
      >
        ${e.priority ? n`<div class="priority-rail priority-rail--${e.priority}"></div>` : c}

        <div
          class="item-check ${t ? "item-check--done" : ""}"
          @click=${(l) => {
      l.stopPropagation(), t || this._complete(e);
    }}
        ></div>

        ${a ? n`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${a}></ha-icon>
            </div>` : c}

        <div class="item-info">
          <div class="item-title ${t ? "item-title--done" : ""}">
            ${e.title}
          </div>
          <div class="item-badges">
            ${e._listName ? n`<span class="list-tag">${e._listName}</span>` : c}
            ${o ? n`<span class=${o.className}>${o.label}</span>` : c}
            ${e.time_estimate ? n`<span>${e.time_estimate}m</span>` : c}
            ${e.has_recurrence ? n`<span>repeats</span>` : c}
            ${e.current_streak > 0 ? n`<span class="streak">${e.current_streak}d streak</span>` : c}
            ${e.needs_detail ? n`<span class="needs-detail">needs detail</span>` : c}
            ${r ? n`<span class="deferred">deferred</span>` : c}
            ${e.block_reason && !r ? n`<span class="deferred">${e.block_reason}</span>` : c}
          </div>
        </div>

        ${e.tags.length > 0 ? n`<span class="item-tags">${e.tags.map((l) => `#${l}`).join(" ")}</span>` : c}
      </div>
    `;
  }
  async _complete(e) {
    await u.completeItem(e._entityId, e.uid);
  }
  _openEditor(e) {
    et(this, {
      entityId: e._entityId,
      itemId: e.uid,
      hass: this.hass
    });
  }
  _formatDue(e) {
    if (!e) return null;
    const t = new Date(e), i = /* @__PURE__ */ new Date();
    if (t < i)
      return { label: `Overdue ${Math.ceil((i.getTime() - t.getTime()) / 864e5)}d`, className: "overdue" };
    if (t.toDateString() === i.toDateString())
      return { label: "Today", className: "due-today" };
    const s = new Date(i);
    return s.setDate(s.getDate() + 1), t.toDateString() === s.toDateString() ? { label: "Tomorrow", className: "" } : { label: t.toLocaleDateString(), className: "" };
  }
  getCardSize() {
    return 6;
  }
};
k.styles = [
  E,
  C`
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
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .item-row:active {
        background: rgba(var(--rgb-primary-color), 0.08);
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
        color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .group-header:active {
        background: rgba(var(--rgb-primary-color), 0.08);
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
        background: rgba(var(--rgb-primary-color), 0.12);
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
        border-color: rgb(var(--rgb-primary-color));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-color), 0.20);
        color: rgb(var(--rgb-primary-color));
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
O([
  x({ attribute: !1 })
], k.prototype, "hass", 2);
O([
  g()
], k.prototype, "_config", 2);
O([
  g()
], k.prototype, "_showNotYet", 2);
O([
  g()
], k.prototype, "_showDeferred", 2);
O([
  g()
], k.prototype, "_showCompleted", 2);
O([
  g()
], k.prototype, "_draft", 2);
O([
  g()
], k.prototype, "_busy", 2);
k = O([
  A("yahatl-my-tasks-card")
], k);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-my-tasks-card",
  name: "Yahatl My Tasks",
  description: "Combined list of tasks assigned to one person across every yahatl list"
});
var ve = Object.defineProperty, xe = Object.getOwnPropertyDescriptor, b = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? xe(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && ve(t, i, a), a;
};
const Lt = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], we = [
  "actionable",
  "recurring",
  "habit",
  "chore",
  "reminder",
  "note",
  "someday",
  "shopping",
  "gift"
], $e = ["eq", "neq", "gt", "lt", "gte", "lte", "bool"], ke = [
  { id: "work_hours", name: "Work hours", icon: "mdi:briefcase-clock" },
  { id: "productive", name: "Productive", icon: "mdi:lightning-bolt" },
  { id: "weekend_project", name: "Weekend project", icon: "mdi:hammer-wrench" }
], Ce = [
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
function bt(e, t) {
  var s;
  if (!e || !t) return t;
  const i = e.states[t];
  return ((s = i == null ? void 0 : i.attributes) == null ? void 0 : s.friendly_name) || t;
}
let _ = class extends y {
  constructor() {
    super(...arguments), this.mode = "dialog", this._visible = !1, this._entityId = "", this._itemId = null, this._item = {}, this._section = 0, this._busy = !1, this._error = "", this._allItems = [], this._existingTags = [], this._existingProjects = [], this._contexts = [], this._entityFilter = "", this._entityDropdownOpen = null, this._boundKey = (e) => {
      e.key === "Escape" && this.close();
    };
  }
  // --- Public API ---
  async open(e) {
    var s;
    this._entityId = e.entityId, this._itemId = e.itemId || null, e.hass && (this.hass = e.hass), this._contexts = ke, u.api.getMeta().then((a) => {
      var o;
      (o = a.contexts) != null && o.length && (this._contexts = a.contexts);
    }).catch(() => {
    });
    const t = u.api.getItems(this._entityId), i = u.api.getTags().catch(() => []);
    if (this._itemId) {
      const [a, o, r] = await Promise.all([
        u.getItemDetails(this._entityId, this._itemId),
        t,
        i
      ]);
      if (!a) return;
      this._item = { ...a }, this._allItems = o.filter((l) => l.uid !== this._itemId), this._existingTags = r.map((l) => l.name), this._existingProjects = [...new Set(o.map((l) => l.project).filter((l) => !!l))];
    } else {
      const [a, o] = await Promise.all([
        t,
        i
      ]);
      this._item = {
        title: "",
        description: "",
        traits: ["actionable"],
        tags: [],
        priority: null,
        project: null,
        assigned_to: (s = this.hass) != null && s.user ? [this.hass.user.id] : [],
        needs_detail: !1
      }, this._allItems = a, this._existingTags = o.map((r) => r.name), this._existingProjects = [...new Set(a.map((r) => r.project).filter((r) => !!r))];
    }
    this._section = 0, this._error = "", this._visible = !0, document.addEventListener("keydown", this._boundKey), document.body.style.overflow = "hidden";
  }
  // --- HA dialog-manager entry points (the show-dialog contract) ---
  async showDialog(e) {
    await this.open(e);
  }
  closeDialog() {
    return this.close(), !0;
  }
  close() {
    this._visible && (this._visible = !1, document.removeEventListener("keydown", this._boundKey), document.body.style.overflow = "", this.requestUpdate(), this.mode !== "inline" && pe(this, "dialog-closed", { dialog: "yahatl-item-editor" }));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._boundKey), document.body.style.overflow = "";
  }
  _overlayClick(e) {
    e.target.classList.contains("overlay") && this.close();
  }
  // --- Rendering ---
  render() {
    if (!this._visible) return c;
    const e = ["Basics", "Recurrence", "Requirements", "Blockers", "Schedule"], t = n`
      <div class="modal__header">
        <div class="modal__header-info">
          <h2 class="modal__title">${this._itemId ? "Edit item" : "New item"}</h2>
          ${this._itemId ? n`<div class="modal__sub">${this._entityId} · ${this._itemId.slice(0, 8)}…</div>` : c}
        </div>
        <button class="close-btn" @click=${this.close}>&times;</button>
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
      ${this._error ? n`<div class="error-msg">${this._error}</div>` : c}
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
        return c;
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
                    style="--rgb-state: var(--rgb-primary-color)"
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
              <button
                class="btn btn--danger"
                @click=${this._delete}
                ?disabled=${this._busy}
              >
                Delete this item
              </button>
            </div>
          ` : c}
    `;
  }
  // --- Section 1: Traits & Tags ---
  _renderTraitsTags() {
    const e = this._item.traits || [], t = this._item.tags || [];
    return n`
      <div class="field">
        <div class="field__label">Traits</div>
        <div class="traits-row">
          ${we.map(
      (i) => n`
              <button
                class="trait-toggle ${e.includes(i) ? "is-on" : ""}"
                style="--rgb-state: ${F[i]}"
                @click=${() => this._toggleTrait(i)}
              >
                <ha-icon icon=${j[i]}></ha-icon>
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
                <button class="tag-chip__remove" @click=${() => this._removeTag(s)}>&times;</button>
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

      ${t === "calendar" ? this._renderCalendarConfig() : c}
      ${t === "elapsed" ? this._renderElapsedConfig() : c}
      ${t === "frequency" ? this._renderFrequencyConfig() : c}
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
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._setCalendarPreset(t === r ? null : r)}
            >
              ${r}
            </button>
          `
    )}
        <button
          class="mush-chip ${a && !o ? "mush-chip--filled" : ""}"
          style="--rgb-state: var(--rgb-primary-color)"
          @click=${() => this._setCalendarPreset(null)}
        >
          Custom days
        </button>
      </div>

      ${a ? n`
            <div class="field">
              <div class="field__label">Days of the week</div>
              <div class="day-picker">
                ${Lt.map(
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
      const d = r.target.value.split(",").map((p) => parseInt(p.trim())).filter((p) => p >= 1 && p <= 31);
      this._updateRecurrence({
        calendar_days_of_month: d.length ? d : null
      });
    }}
                    />
                  </div>
                ` : c}
          ` : c}
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
                  ${bt(this.hass, t)}
                  <div class="entity-row__id">${t}</div>
                </div>
                <button class="entity-row__remove" @click=${() => {
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
                style="--rgb-state: var(--rgb-primary-color)"
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
                style="--rgb-state: var(--rgb-primary-color)"
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
                  ${bt(this.hass, t)}
                  <div class="entity-row__id">${t}</div>
                </div>
                <button class="entity-row__remove" @click=${() => {
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
          ${Ce.map((a) => {
      const o = this._presetState(a), r = o !== "off", l = o === "not";
      return n`
              <button
                class="mush-chip ${r ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${l ? "var(--rgb-danger)" : "var(--rgb-primary-color)"}"
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
                ${Lt.map(
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
                        ${bt(this.hass, a.entity_id)}
                        <div class="entity-row__id">${a.entity_id}</div>
                      </div>
                      <button class="entity-row__remove" @click=${() => this._updateConditionTrigger(o, { entity_id: "" })}>&times;</button>
                    </div>
                  ` : c}
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
                    ${$e.map(
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
    try {
      const t = this._item.requirements || this._emptyRequirements(), i = t.location || [], s = i.includes(e) ? i.filter((a) => a !== e) : [...i, e];
      this._setRequirements({ ...t, location: s }), this._error = `✓ loc ${e} → [${s.join(", ")}]`;
    } catch (t) {
      this._error = `✗ loc ${e}: ${String(t)}`;
    }
  }
  _toggleContext(e) {
    try {
      const t = this._item.requirements || this._emptyRequirements(), i = t.context || [], s = i.includes(e) ? i.filter((a) => a !== e) : [...i, e];
      this._setRequirements({ ...t, context: s }), this._error = `✓ ctx ${e} → [${s.join(", ")}]`;
    } catch (t) {
      this._error = `✗ ctx ${e}: ${String(t)}`;
    }
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
    var e, t, i, s, a, o, r, l;
    if (!((e = this._item.title) != null && e.trim())) {
      this._error = "Title is required";
      return;
    }
    this._busy = !0, this._error = "";
    try {
      const d = [
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
      ], p = {};
      for (const h of d)
        h in this._item && (p[h] = this._item[h]);
      if (p.blockers) {
        const h = p.blockers;
        !((t = h.items) != null && t.length) && !((i = h.sensors) != null && i.length) && (p.blockers = null);
      }
      if (p.requirements) {
        const h = p.requirements;
        !((s = h.location) != null && s.length) && !((a = h.people) != null && a.length) && !((o = h.time_constraints) != null && o.length) && !((r = h.context) != null && r.length) && !((l = h.sensors) != null && l.length) && (p.requirements = null);
      }
      p.time_blockers && p.time_blockers.length === 0 && delete p.time_blockers, p.condition_triggers && p.condition_triggers.length === 0 && delete p.condition_triggers, this._itemId ? await u.saveItem(this._entityId, this._itemId, p) : await u.createItem(this._entityId, p), this.close();
    } catch (d) {
      this._error = d.message || "Failed to save";
    } finally {
      this._busy = !1;
    }
  }
  async _delete() {
    if (this._itemId) {
      this._busy = !0;
      try {
        await u.deleteItem(this._entityId, this._itemId), this.close();
      } catch (e) {
        this._error = e.message || "Failed to delete";
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
        ` : c}
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
        const d = r.attributes.friendly_name || o.replace("person.", "");
        e.push({ id: l, name: d }), t.add(l);
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
_.styles = [
  E,
  C`
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
        color: rgb(var(--rgb-primary-color));
        border-color: rgb(var(--rgb-primary-color));
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
        border-color: rgb(var(--rgb-primary-color));
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
        border-color: rgb(var(--rgb-primary-color));
        background: rgba(var(--rgb-primary-color), 0.08);
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
        background: rgb(var(--rgb-primary-color));
        border-color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.10);
      }

      .assign-current ha-icon {
        --mdc-icon-size: 16px;
        color: rgb(var(--rgb-primary-color));
      }

      /* Delete */
      .delete-area {
        margin-top: 8px;
        padding-top: 16px;
        border-top: 1px solid var(--yahatl-divider);
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
        border-color: rgb(var(--rgb-primary-color));
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
        background: rgba(var(--rgb-primary-color), 0.08);
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
b([
  x()
], _.prototype, "mode", 2);
b([
  x({ attribute: !1 })
], _.prototype, "hass", 2);
b([
  g()
], _.prototype, "_visible", 2);
b([
  g()
], _.prototype, "_entityId", 2);
b([
  g()
], _.prototype, "_itemId", 2);
b([
  g()
], _.prototype, "_item", 2);
b([
  g()
], _.prototype, "_section", 2);
b([
  g()
], _.prototype, "_busy", 2);
b([
  g()
], _.prototype, "_error", 2);
b([
  g()
], _.prototype, "_allItems", 2);
b([
  g()
], _.prototype, "_existingTags", 2);
b([
  g()
], _.prototype, "_existingProjects", 2);
b([
  g()
], _.prototype, "_contexts", 2);
b([
  g()
], _.prototype, "_entityFilter", 2);
b([
  g()
], _.prototype, "_entityDropdownOpen", 2);
_ = b([
  A("yahatl-item-editor")
], _);
var Ae = Object.defineProperty, Se = Object.getOwnPropertyDescriptor, jt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Se(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && Ae(t, i, a), a;
};
let lt = class extends y {
  constructor() {
    super(...arguments), this._store = new U(this);
  }
  setConfig(e) {
  }
  connectedCallback() {
    super.connectedCallback(), u.loadContext(), u.loadMeta();
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
              style="--rgb-state: var(--rgb-primary-color)"
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
              style="--rgb-state: var(--rgb-primary-color)"
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
lt.styles = [
  E,
  C`
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
jt([
  x({ attribute: !1 })
], lt.prototype, "hass", 2);
lt = jt([
  A("yahatl-context-bar")
], lt);
var Te = Object.defineProperty, Ee = Object.getOwnPropertyDescriptor, Ht = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Ee(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && Te(t, i, a), a;
};
let ct = class extends y {
  constructor() {
    super(...arguments), this._store = new U(this), this._initialized = !1;
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadQueue()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  setConfig(e) {
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
        rgb: "var(--rgb-primary-color)"
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
ct.styles = [
  E,
  C`
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
Ht([
  x({ attribute: !1 })
], ct.prototype, "hass", 2);
ct = Ht([
  A("yahatl-stats-card")
], ct);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-stats-card",
  name: "Yahatl Stats",
  description: "Mushroom-style stat tiles: overdue, today, blocked, ready"
});
var Ie = Object.defineProperty, De = Object.getOwnPropertyDescriptor, st = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? De(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && Ie(t, i, a), a;
};
let H = class extends y {
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
        await u.createItem(this.entityId, { title: e }), this._value = "";
      } finally {
        this._busy = !1;
      }
    }
  }
};
H.styles = [
  E,
  C`
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
        border-color: rgb(var(--rgb-primary-color));
      }

      .capture-row button {
        padding: 0 18px;
        border: none;
        border-radius: 8px;
        background: rgba(var(--rgb-primary-color), 0.20);
        color: rgb(var(--rgb-primary-color));
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
st([
  x({ attribute: !1 })
], H.prototype, "hass", 2);
st([
  x()
], H.prototype, "entityId", 2);
st([
  g()
], H.prototype, "_value", 2);
st([
  g()
], H.prototype, "_busy", 2);
H = st([
  A("yahatl-quick-add")
], H);
var ze = Object.defineProperty, Le = Object.getOwnPropertyDescriptor, ht = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Le(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && ze(t, i, a), a;
};
let V = class extends y {
  constructor() {
    super(...arguments), this._config = {}, this._currentIdx = 0, this._store = new U(this), this._initialized = !1;
  }
  setConfig(e) {
    this._config = e;
  }
  static getStubConfig() {
    return {};
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
    for (const [t, i] of this._store.state.items)
      for (const s of i)
        s.needs_detail && e.push({ entityId: t, item: s });
    return e;
  }
  render() {
    const e = this._getInboxItems(), t = e.length;
    if (t === 0)
      return n`
        <ha-card>
          <div class="card-header">Inbox</div>
          <div class="empty-state">All caught up — nothing needs detail</div>
        </ha-card>
      `;
    const i = Math.min(this._currentIdx, t - 1), s = e[i], a = pt(s.item.traits), o = a ? F[a] : "var(--rgb-primary-color)", r = a ? j[a] : "mdi:tray-full";
    return n`
      <ha-card>
        <div class="inbox-header">
          <span class="inbox-header__title">Inbox</span>
          <span class="inbox-count">${i + 1} of ${t}</span>
        </div>

        <div class="inbox-item">
          <div class="inbox-title-row">
            <div class="mush-shape-icon" style="--rgb-state: ${o}">
              <ha-icon icon=${r}></ha-icon>
            </div>
            <div class="inbox-title">${s.item.title}</div>
          </div>
          ${s.item.tags.length > 0 ? n`
                <div class="inbox-tags">
                  ${s.item.tags.map(
      (l) => n`<span class="tag-chip">#${l}</span>`
    )}
                </div>
              ` : c}
          <div class="inbox-actions">
            <button
              class="btn btn--primary"
              @click=${() => this._openEditor(s.entityId, s.item.uid)}
            >
              Add details
            </button>
            <button
              class="btn btn--ghost"
              @click=${() => this._markDone(s.entityId, s.item.uid)}
            >
              Good enough
            </button>
          </div>
        </div>

        ${t > 1 ? n`
              <div class="nav-row">
                <button
                  class="btn btn--ghost"
                  ?disabled=${i === 0}
                  @click=${() => this._currentIdx = i - 1}
                >
                  Previous
                </button>
                <button
                  class="btn btn--ghost"
                  ?disabled=${i >= t - 1}
                  @click=${() => this._currentIdx = i + 1}
                >
                  Next
                </button>
              </div>
            ` : c}
      </ha-card>
    `;
  }
  _openEditor(e, t) {
    et(this, { entityId: e, itemId: t, hass: this.hass });
  }
  async _markDone(e, t) {
    await u.saveItem(e, t, { needs_detail: !1 }), await this._loadInbox();
  }
  getCardSize() {
    return 3;
  }
};
V.styles = [
  E,
  C`
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
ht([
  x({ attribute: !1 })
], V.prototype, "hass", 2);
ht([
  g()
], V.prototype, "_config", 2);
ht([
  g()
], V.prototype, "_currentIdx", 2);
V = ht([
  A("yahatl-inbox-card")
], V);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-inbox-card",
  name: "Yahatl Inbox",
  description: "Triage items that need more detail"
});
var qe = Object.defineProperty, Oe = Object.getOwnPropertyDescriptor, $ = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Oe(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (a = (s ? r(t, i, a) : r(a)) || a);
  return s && a && qe(t, i, a), a;
};
let v = class extends y {
  constructor() {
    super(...arguments), this._store = new U(this), this._initialized = !1, this._editingContext = null, this._editName = "", this._editIcon = "", this._editingLocation = null, this._editLocName = "", this._editLocIcon = "", this._renamingTag = null, this._renameValue = "", this._confirmDelete = null;
  }
  setConfig(e) {
  }
  static getStubConfig() {
    return {};
  }
  updated(e) {
    e.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, u.setHass(this.hass), u.loadMeta(), u.loadTags()) : e.has("hass") && this.hass && u.setHass(this.hass);
  }
  render() {
    const e = this._store.state.meta, t = this._store.state.tags, i = (e == null ? void 0 : e.contexts) || [], s = (e == null ? void 0 : e.locations) || [], a = this._getZones();
    return n`
      <ha-card>
        <div class="card-header">Manage</div>

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
              ` : c}
          ${s.map((o, r) => this._renderLocationRow(o, r, s.length))}
          ${this._editingLocation === "__new__" ? this._renderLocationEditor(null) : n`
                <button class="add-btn" @click=${() => this._startNewLocation()}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  Add location
                </button>
              `}
        </div>

        <!-- Confirm delete bar -->
        ${this._confirmDelete ? this._renderConfirmBar() : c}
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
          ${t > 0 ? n`<button class="icon-btn" @click=${() => this._moveContext(t, -1)} title="Move up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>` : c}
          ${t < i - 1 ? n`<button class="icon-btn" @click=${() => this._moveContext(t, 1)} title="Move down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>` : c}
          <button class="icon-btn" @click=${() => this._startEditContext(e)} title="Edit">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("context", e.id)} title="Delete">
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
          ${t > 0 ? n`<button class="icon-btn" @click=${() => this._moveLocation(t, -1)} title="Move up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>` : c}
          ${t < i - 1 ? n`<button class="icon-btn" @click=${() => this._moveLocation(t, 1)} title="Move down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>` : c}
          <button class="icon-btn" @click=${() => this._startEditLocation(e)} title="Edit">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("location", e.id)} title="Delete">
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
                <button class="icon-btn" @click=${() => this._startRenameTag(e)} title="Rename">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="icon-btn icon-btn--danger" @click=${() => this._requestDelete("tag", e.name)} title="Delete">
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
    const s = (e == null ? void 0 : e.id) || i.toLowerCase().replace(/\s+/g, "_"), a = this._editIcon || "mdi:label", o = {};
    let r;
    e ? (e.id !== s && (o[e.id] = s), r = t.contexts.map(
      (l) => l.id === e.id ? { id: e.id, name: i, icon: a } : l
    )) : r = [...t.contexts, { id: s, name: i, icon: a }], await u.saveMeta({ ...t, contexts: r }, o), this._editingContext = null;
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
      (r) => r.id === e.id ? { id: e.id, name: i, icon: a } : r
    ) : o = [...t.locations, { id: s, name: i, icon: a }], await u.saveMeta({ ...t, locations: o }), this._editingLocation = null;
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
    !t || t === e || (await u.renameTag(e, t), this._renamingTag = null);
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
v.styles = [
  E,
  C`
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
        background: rgba(var(--rgb-primary-color), 0.10);
        color: rgb(var(--rgb-primary-color));
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
        border-color: rgb(var(--rgb-primary-color));
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
        border: 1px solid rgb(var(--rgb-primary-color));
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
        border-color: rgb(var(--rgb-primary-color));
        color: rgb(var(--rgb-primary-color));
      }

      .add-btn ha-icon {
        --mdc-icon-size: 16px;
      }
    `
];
$([
  x({ attribute: !1 })
], v.prototype, "hass", 2);
$([
  g()
], v.prototype, "_editingContext", 2);
$([
  g()
], v.prototype, "_editName", 2);
$([
  g()
], v.prototype, "_editIcon", 2);
$([
  g()
], v.prototype, "_editingLocation", 2);
$([
  g()
], v.prototype, "_editLocName", 2);
$([
  g()
], v.prototype, "_editLocIcon", 2);
$([
  g()
], v.prototype, "_renamingTag", 2);
$([
  g()
], v.prototype, "_renameValue", 2);
$([
  g()
], v.prototype, "_confirmDelete", 2);
v = $([
  A("yahatl-manage-card")
], v);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-manage-card",
  name: "Yahatl Manage",
  description: "Manage contexts, tags, and locations for yahatl"
});
export {
  lt as YahtlContextBar,
  V as YahtlInboxCard,
  _ as YahtlItemEditor,
  w as YahtlListCard,
  v as YahtlManageCard,
  k as YahtlMyTasksCard,
  f as YahtlQueueCard,
  H as YahtlQuickAdd,
  ct as YahtlStatsCard
};
