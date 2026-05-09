/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis, ct = X.ShadowRoot && (X.ShadyCSS === void 0 || X.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, dt = Symbol(), gt = /* @__PURE__ */ new WeakMap();
let It = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== dt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ct && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = gt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && gt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Dt = (s) => new It(typeof s == "string" ? s : s + "", void 0, dt), A = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, a) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[a + 1], s[0]);
  return new It(e, s, dt);
}, Lt = (s, t) => {
  if (ct) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = X.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, mt = ct ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return Dt(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Nt, defineProperty: Rt, getOwnPropertyDescriptor: Mt, getOwnPropertyNames: Bt, getOwnPropertySymbols: Ht, getPrototypeOf: Ut } = Object, w = globalThis, bt = w.trustedTypes, jt = bt ? bt.emptyScript : "", at = w.reactiveElementPolyfillSupport, H = (s, t) => s, J = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? jt : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, pt = (s, t) => !Nt(s, t), _t = { attribute: !0, type: String, converter: J, reflect: !1, useDefault: !1, hasChanged: pt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), w.litPropertyMetadata ?? (w.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let P = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = _t) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && Rt(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: a } = Mt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(o) {
      this[e] = o;
    } };
    return { get: r, set(o) {
      const d = r == null ? void 0 : r.call(this);
      a == null || a.call(this, o), this.requestUpdate(t, d, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? _t;
  }
  static _$Ei() {
    if (this.hasOwnProperty(H("elementProperties"))) return;
    const t = Ut(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(H("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(H("properties"))) {
      const e = this.properties, i = [...Bt(e), ...Ht(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(mt(r));
    } else t !== void 0 && e.push(mt(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Lt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var a;
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (((a = i.converter) == null ? void 0 : a.toAttribute) !== void 0 ? i.converter : J).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var a, o;
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const d = i.getPropertyOptions(r), c = typeof d.converter == "function" ? { fromAttribute: d.converter } : ((a = d.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? d.converter : J;
      this._$Em = r;
      const l = c.fromAttribute(e, d.type);
      this[r] = l ?? ((o = this._$Ej) == null ? void 0 : o.get(r)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, a) {
    var o;
    if (t !== void 0) {
      const d = this.constructor;
      if (r === !1 && (a = this[t]), i ?? (i = d.getPropertyOptions(t)), !((i.hasChanged ?? pt)(a, e) || i.useDefault && i.reflect && a === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(d._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: a }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, o ?? e ?? this[t]), a !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, o] of this._$Ep) this[a] = o;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [a, o] of r) {
        const { wrapped: d } = o, c = this[a];
        d !== !0 || this._$AL.has(a) || c === void 0 || this.C(a, void 0, o, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((r) => {
        var a;
        return (a = r.hostUpdate) == null ? void 0 : a.call(r);
      }), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var r;
      return (r = i.hostUpdated) == null ? void 0 : r.call(i);
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
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
P.elementStyles = [], P.shadowRootOptions = { mode: "open" }, P[H("elementProperties")] = /* @__PURE__ */ new Map(), P[H("finalized")] = /* @__PURE__ */ new Map(), at == null || at({ ReactiveElement: P }), (w.reactiveElementVersions ?? (w.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = globalThis, vt = (s) => s, tt = U.trustedTypes, ft = tt ? tt.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, Et = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, Tt = "?" + $, Yt = `<${Tt}>`, E = document, j = () => E.createComment(""), Y = (s) => s === null || typeof s != "object" && typeof s != "function", ht = Array.isArray, Ft = (s) => ht(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", ot = `[ 	
\f\r]`, B = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, yt = /-->/g, xt = />/g, C = RegExp(`>|${ot}(?:([^\\s"'>=/]+)(${ot}*=${ot}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), $t = /'/g, wt = /"/g, zt = /^(?:script|style|textarea|title)$/i, Wt = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), n = Wt(1), D = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), kt = /* @__PURE__ */ new WeakMap(), S = E.createTreeWalker(E, 129);
function Ot(s, t) {
  if (!ht(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ft !== void 0 ? ft.createHTML(t) : t;
}
const Qt = (s, t) => {
  const e = s.length - 1, i = [];
  let r, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = B;
  for (let d = 0; d < e; d++) {
    const c = s[d];
    let l, u, g = -1, y = 0;
    for (; y < c.length && (o.lastIndex = y, u = o.exec(c), u !== null); ) y = o.lastIndex, o === B ? u[1] === "!--" ? o = yt : u[1] !== void 0 ? o = xt : u[2] !== void 0 ? (zt.test(u[2]) && (r = RegExp("</" + u[2], "g")), o = C) : u[3] !== void 0 && (o = C) : o === C ? u[0] === ">" ? (o = r ?? B, g = -1) : u[1] === void 0 ? g = -2 : (g = o.lastIndex - u[2].length, l = u[1], o = u[3] === void 0 ? C : u[3] === '"' ? wt : $t) : o === wt || o === $t ? o = C : o === yt || o === xt ? o = B : (o = C, r = void 0);
    const x = o === C && s[d + 1].startsWith("/>") ? " " : "";
    a += o === B ? c + Yt : g >= 0 ? (i.push(l), c.slice(0, g) + Et + c.slice(g) + $ + x) : c + $ + (g === -2 ? d : x);
  }
  return [Ot(s, a + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class F {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let a = 0, o = 0;
    const d = t.length - 1, c = this.parts, [l, u] = Qt(t, e);
    if (this.el = F.createElement(l, i), S.currentNode = this.el.content, e === 2 || e === 3) {
      const g = this.el.content.firstChild;
      g.replaceWith(...g.childNodes);
    }
    for (; (r = S.nextNode()) !== null && c.length < d; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const g of r.getAttributeNames()) if (g.endsWith(Et)) {
          const y = u[o++], x = r.getAttribute(g).split($), G = /([.?@])?(.*)/.exec(y);
          c.push({ type: 1, index: a, name: G[2], strings: x, ctor: G[1] === "." ? Zt : G[1] === "?" ? Kt : G[1] === "@" ? Gt : it }), r.removeAttribute(g);
        } else g.startsWith($) && (c.push({ type: 6, index: a }), r.removeAttribute(g));
        if (zt.test(r.tagName)) {
          const g = r.textContent.split($), y = g.length - 1;
          if (y > 0) {
            r.textContent = tt ? tt.emptyScript : "";
            for (let x = 0; x < y; x++) r.append(g[x], j()), S.nextNode(), c.push({ type: 2, index: ++a });
            r.append(g[y], j());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Tt) c.push({ type: 2, index: a });
      else {
        let g = -1;
        for (; (g = r.data.indexOf($, g + 1)) !== -1; ) c.push({ type: 7, index: a }), g += $.length - 1;
      }
      a++;
    }
  }
  static createElement(t, e) {
    const i = E.createElement("template");
    return i.innerHTML = t, i;
  }
}
function L(s, t, e = s, i) {
  var o, d;
  if (t === D) return t;
  let r = i !== void 0 ? (o = e._$Co) == null ? void 0 : o[i] : e._$Cl;
  const a = Y(t) ? void 0 : t._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== a && ((d = r == null ? void 0 : r._$AO) == null || d.call(r, !1), a === void 0 ? r = void 0 : (r = new a(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = r : e._$Cl = r), r !== void 0 && (t = L(s, r._$AS(s, t.values), r, i)), t;
}
class Vt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = ((t == null ? void 0 : t.creationScope) ?? E).importNode(e, !0);
    S.currentNode = r;
    let a = S.nextNode(), o = 0, d = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let l;
        c.type === 2 ? l = new Q(a, a.nextSibling, this, t) : c.type === 1 ? l = new c.ctor(a, c.name, c.strings, this, t) : c.type === 6 && (l = new Xt(a, this, t)), this._$AV.push(l), c = i[++d];
      }
      o !== (c == null ? void 0 : c.index) && (a = S.nextNode(), o++);
    }
    return S.currentNode = E, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class Q {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = L(this, t, e), Y(t) ? t === p || t == null || t === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : t !== this._$AH && t !== D && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ft(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== p && Y(this._$AH) ? this._$AA.nextSibling.data = t : this.T(E.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var a;
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = F.createElement(Ot(i.h, i.h[0]), this.options)), i);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === r) this._$AH.p(e);
    else {
      const o = new Vt(r, this), d = o.u(this.options);
      o.p(e), this.T(d), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = kt.get(t.strings);
    return e === void 0 && kt.set(t.strings, e = new F(t)), e;
  }
  k(t) {
    ht(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const a of t) r === e.length ? e.push(i = new Q(this.O(j()), this.O(j()), this, this.options)) : i = e[r], i._$AI(a), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const r = vt(t).nextSibling;
      vt(t).remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class it {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, a) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = p;
  }
  _$AI(t, e = this, i, r) {
    const a = this.strings;
    let o = !1;
    if (a === void 0) t = L(this, t, e, 0), o = !Y(t) || t !== this._$AH && t !== D, o && (this._$AH = t);
    else {
      const d = t;
      let c, l;
      for (t = a[0], c = 0; c < a.length - 1; c++) l = L(this, d[i + c], e, c), l === D && (l = this._$AH[c]), o || (o = !Y(l) || l !== this._$AH[c]), l === p ? t = p : t !== p && (t += (l ?? "") + a[c + 1]), this._$AH[c] = l;
    }
    o && !r && this.j(t);
  }
  j(t) {
    t === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Zt extends it {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === p ? void 0 : t;
  }
}
class Kt extends it {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== p);
  }
}
class Gt extends it {
  constructor(t, e, i, r, a) {
    super(t, e, i, r, a), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = L(this, t, e, 0) ?? p) === D) return;
    const i = this._$AH, r = t === p && i !== p || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, a = t !== p && (i === p || r);
    r && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Xt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    L(this, t);
  }
}
const nt = U.litHtmlPolyfillSupport;
nt == null || nt(F, Q), (U.litHtmlVersions ?? (U.litHtmlVersions = [])).push("3.3.2");
const Jt = (s, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const a = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = r = new Q(t.insertBefore(j(), a), a, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = globalThis;
class _ extends P {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Jt(e, this.renderRoot, this.renderOptions);
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
    return D;
  }
}
var St;
_._$litElement$ = !0, _.finalized = !0, (St = I.litElementHydrateSupport) == null || St.call(I, { LitElement: _ });
const lt = I.litElementPolyfillSupport;
lt == null || lt({ LitElement: _ });
(I.litElementVersions ?? (I.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(s, t);
  }) : customElements.define(s, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const te = { attribute: !0, type: String, converter: J, reflect: !1, hasChanged: pt }, ee = (s = te, t, e) => {
  const { kind: i, metadata: r } = e;
  let a = globalThis.litPropertyMetadata.get(r);
  if (a === void 0 && globalThis.litPropertyMetadata.set(r, a = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), a.set(e.name, s), i === "accessor") {
    const { name: o } = e;
    return { set(d) {
      const c = t.get.call(this);
      t.set.call(this, d), this.requestUpdate(o, c, s, !0, d);
    }, init(d) {
      return d !== void 0 && this.C(o, void 0, s, d), d;
    } };
  }
  if (i === "setter") {
    const { name: o } = e;
    return function(d) {
      const c = this[o];
      t.call(this, d), this.requestUpdate(o, c, s, !0, d);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function f(s) {
  return (t, e) => typeof e == "object" ? ee(s, t, e) : ((i, r, a) => {
    const o = r.hasOwnProperty(a);
    return r.constructor.createProperty(a, i), o ? Object.getOwnPropertyDescriptor(r, a) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(s) {
  return f({ ...s, state: !0, attribute: !1 });
}
const N = {
  actionable: "mdi:play",
  recurring: "mdi:refresh",
  habit: "mdi:star-four-points",
  chore: "mdi:home",
  reminder: "mdi:bell",
  note: "mdi:note-text"
}, W = {
  actionable: "var(--rgb-blue, 33, 150, 243)",
  recurring: "var(--rgb-deep-purple, 110, 65, 171)",
  habit: "var(--rgb-green, 76, 175, 80)",
  chore: "var(--rgb-orange, 255, 152, 0)",
  reminder: "var(--rgb-pink, 233, 30, 99)",
  note: "var(--rgb-purple, 146, 107, 199)"
};
function ut(s) {
  for (const t of s)
    if (t in N) return t;
  return null;
}
const q = A`
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
    font-size: 18px;
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
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: 0.1px;
    color: var(--yahatl-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mush-state-info__secondary {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
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
    font-size: 14px;
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
    padding: 7px 12px;
    background: rgba(var(--rgb-primary-color), 0.20);
    color: rgb(var(--rgb-primary-color));
    font-weight: 500;
    font-size: 12px;
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
    font-size: 12px;
    line-height: 16px;
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
    font-size: 12px;
    color: var(--yahatl-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 500;
  }

  .input,
  .textarea,
  .select {
    padding: 10px 12px;
    border: 1px solid var(--yahatl-divider);
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
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
    font-size: 13px;
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
    --mdc-icon-size: 16px;
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
    font-size: 12px;
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
    padding: 9px 18px;
    border: 0;
    border-radius: 10px;
    font-size: 13px;
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
    font-size: 14px;
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
class se {
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
  async getItems(t, e) {
    return this.hass.callWS({
      type: "yahatl/items_list",
      entity_id: t,
      ...e
    });
  }
  async getItemDetails(t, e) {
    return this.hass.callWS({
      type: "yahatl/item_details",
      entity_id: t,
      item_id: e
    });
  }
  async createItem(t, e) {
    return this.hass.callWS({
      type: "yahatl/item_create",
      entity_id: t,
      ...e
    });
  }
  async saveItem(t, e, i) {
    return this.hass.callWS({
      type: "yahatl/item_save",
      entity_id: t,
      item_id: e,
      ...i
    });
  }
  async deleteItem(t, e) {
    await this.hass.callWS({
      type: "yahatl/item_delete",
      entity_id: t,
      item_id: e
    });
  }
  async completeItem(t, e) {
    return this.hass.callWS({
      type: "yahatl/item_complete",
      entity_id: t,
      item_id: e,
      user_id: this.userId
    });
  }
  async deferItem(t, e, i) {
    return this.hass.callWS({
      type: "yahatl/item_defer",
      entity_id: t,
      item_id: e,
      deferred_until: i
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
}
class ie {
  constructor() {
    this._api = null, this._hass = null, this._subscribers = /* @__PURE__ */ new Set(), this.state = {
      lists: [],
      items: /* @__PURE__ */ new Map(),
      queue: null,
      context: null,
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
    this._hass = t, this._api = new se(t);
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
  async loadItems(t, e) {
    if (!this._api) return;
    const i = await this._api.getItems(t, e);
    this.state.items.set(t, i), this._notify();
  }
  async loadQueue(t) {
    this._api && (this.state.queue = await this._api.getQueue(t), this._notify());
  }
  async loadContext() {
    this._api && (this.state.context = await this._api.getContext(), this._notify());
  }
  // --- Mutations (call API then refresh) ---
  async createItem(t, e) {
    this._api && (await this._api.createItem(t, e), await this.loadItems(t), await this.loadQueue());
  }
  async saveItem(t, e, i) {
    this._api && (await this._api.saveItem(t, e, i), await this.loadItems(t), await this.loadQueue());
  }
  async deleteItem(t, e) {
    this._api && (await this._api.deleteItem(t, e), await this.loadItems(t), await this.loadQueue());
  }
  async completeItem(t, e) {
    this._api && (await this._api.completeItem(t, e), await this.loadItems(t), await this.loadQueue());
  }
  async deferItem(t, e, i) {
    this._api && (await this._api.deferItem(t, e, i), await this.loadItems(t), await this.loadQueue());
  }
  async setContext(t) {
    this._api && (this.state.context = await this._api.setContext(t), await this.loadQueue());
  }
  async getItemDetails(t, e) {
    return this._api ? this._api.getItemDetails(t, e) : null;
  }
}
const h = new ie();
class V {
  constructor(t) {
    this.host = t, t.addController(this);
  }
  hostConnected() {
    this._unsub = h.subscribe(() => this.host.requestUpdate());
  }
  hostDisconnected() {
    var t;
    (t = this._unsub) == null || t.call(this);
  }
  get state() {
    return h.state;
  }
}
var re = Object.defineProperty, ae = Object.getOwnPropertyDescriptor, Z = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? ae(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && re(t, e, r), r;
};
let T = class extends _ {
  constructor() {
    super(...arguments), this._config = {}, this._quickAddValue = "", this._quickAddBusy = !1, this._store = new V(this), this._initialized = !1;
  }
  setConfig(s) {
    this._config = s;
  }
  updated(s) {
    s.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, h.setHass(this.hass), h.loadQueue(), h.loadLists()) : s.has("hass") && this.hass && h.setHass(this.hass);
  }
  render() {
    var d, c;
    const s = this._store.state.queue, t = this._config.max_items || 10, e = this._config.title || "Up Next", i = this._config.todo_entity || "", r = (s == null ? void 0 : s.items.slice(0, t)) || [], a = (c = (d = this.hass) == null ? void 0 : d.user) == null ? void 0 : c.name, o = this._store.state.context;
    return n`
      <ha-card>
        <div class="card-header">${e}</div>
        ${a ? n`<div class="greeting">Hello, ${a}</div>` : p}

        <div class="queue-controls" style="padding-top: 10px">
          <select @change=${(l) => this._setLocation(l.target.value)}>
            <option value="">Location: any</option>
            ${this._getZones().map(
      (l) => n`<option value=${l.id} ?selected=${(o == null ? void 0 : o.location) === l.id}>${l.name}</option>`
    )}
          </select>
          <select @change=${(l) => this._setContextFilter(l.target.value)}>
            <option value="">Context: any</option>
            ${["focused_work", "calls_ok", "errands", "exercise", "relaxation"].map(
      (l) => n`<option value=${l} ?selected=${((o == null ? void 0 : o.contexts) || []).includes(l)}>${l.replace(/_/g, " ")}</option>`
    )}
          </select>
        </div>

        <div class="capture-row">
          <input
            type="text"
            placeholder="Quick add a task…"
            .value=${this._quickAddValue}
            @input=${(l) => this._quickAddValue = l.target.value}
            @keydown=${(l) => {
      l.key === "Enter" && this._quickAdd(i);
    }}
            ?disabled=${this._quickAddBusy}
          />
          <button
            @click=${() => this._quickAdd(i)}
            ?disabled=${this._quickAddBusy || !this._quickAddValue.trim()}
          >
            add
          </button>
        </div>

        ${r.length === 0 ? n`<div class="empty-state">Nothing in the queue</div>` : r.map((l, u) => this._renderItem(l, u, i))}
      </ha-card>
    `;
  }
  _renderItem(s, t, e) {
    const i = s.item, r = ut(i.traits), a = r ? W[r] : "var(--rgb-primary-color)", o = r ? N[r] : "mdi:checkbox-marked-circle-outline", d = this._formatDue(i.due), c = e || `todo.${s.list_id}`;
    return n`
      <div
        class="queue-item"
        style="--rgb-state: ${a}"
        @click=${() => this._openEditor(c, i.uid)}
      >
        ${i.priority ? n`<div class="priority-rail priority-rail--${i.priority}"></div>` : p}
        <div class="queue-rank">${t + 1}</div>
        <div class="mush-shape-icon">
          <ha-icon icon=${o}></ha-icon>
        </div>
        <div class="queue-info">
          <div class="mush-state-info__primary">${i.title}</div>
          <div class="queue-meta">
            ${d ? n`<span class=${d.className}>${d.label}</span>` : p}
            ${d && (i.time_estimate || i.tags.length) ? n`<span class="sep">·</span>` : p}
            ${i.time_estimate ? n`<span>${i.time_estimate}m</span>` : p}
            ${i.time_estimate && i.tags.length ? n`<span class="sep">·</span>` : p}
            ${i.tags.length > 0 ? n`<span>${i.tags.map((l) => `#${l}`).join(" ")}</span>` : p}
            ${i.current_streak > 0 ? n`<span class="sep">·</span><span>${i.current_streak} day streak</span>` : p}
          </div>
        </div>
        <div class="queue-score">${Math.round(s.score)}</div>
        <div class="queue-actions">
          <button
            class="queue-btn"
            @click=${(l) => {
      l.stopPropagation(), this._complete(c, i.uid);
    }}
          >
            done
          </button>
        </div>
      </div>
    `;
  }
  _formatDue(s) {
    if (!s) return null;
    const t = new Date(s), e = /* @__PURE__ */ new Date();
    if (t < e)
      return { label: `Overdue ${Math.ceil((e.getTime() - t.getTime()) / 864e5)}d`, className: "overdue" };
    if (t.toDateString() === e.toDateString())
      return { label: "Today", className: "due-today" };
    const i = new Date(e);
    return i.setDate(i.getDate() + 1), t.toDateString() === i.toDateString() ? { label: "Tomorrow", className: "" } : { label: t.toLocaleDateString(), className: "" };
  }
  async _complete(s, t) {
    await h.completeItem(s, t);
  }
  async _quickAdd(s) {
    var i;
    const t = this._quickAddValue.trim();
    if (!t) return;
    const e = s || ((i = this._store.state.lists[0]) == null ? void 0 : i.entity_id);
    if (e) {
      this._quickAddBusy = !0;
      try {
        await h.createItem(e, { title: t }), this._quickAddValue = "";
      } finally {
        this._quickAddBusy = !1;
      }
    }
  }
  _getZones() {
    var t;
    if (!((t = this.hass) != null && t.states)) return [];
    const s = [];
    for (const [e, i] of Object.entries(this.hass.states))
      if (e.startsWith("zone.")) {
        const r = i.attributes.friendly_name || e.replace("zone.", "");
        s.push({ id: r.toLowerCase(), name: r });
      }
    return s;
  }
  async _setLocation(s) {
    await h.setContext({ location: s || null });
  }
  async _setContextFilter(s) {
    s ? await h.setContext({ contexts: [s] }) : await h.setContext({ contexts: [] });
  }
  _openEditor(s, t) {
    this.dispatchEvent(
      new CustomEvent("yahatl-open-editor", {
        detail: { entityId: s, itemId: t, hass: this.hass },
        bubbles: !0,
        composed: !0
      })
    );
  }
  getCardSize() {
    return 4;
  }
};
T.styles = [
  q,
  A`
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
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--yahatl-divider);
        gap: 12px;
        cursor: pointer;
        position: relative;
        transition: background-color 120ms ease;
        -webkit-tap-highlight-color: transparent;
      }

      .queue-item:hover {
        background: rgba(var(--rgb-primary-color), 0.05);
      }

      .queue-item:active {
        background: rgba(var(--rgb-primary-color), 0.08);
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
    `
];
Z([
  f({ attribute: !1 })
], T.prototype, "hass", 2);
Z([
  m()
], T.prototype, "_config", 2);
Z([
  m()
], T.prototype, "_quickAddValue", 2);
Z([
  m()
], T.prototype, "_quickAddBusy", 2);
T = Z([
  O("yahatl-queue-card")
], T);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue",
  description: "Prioritized task queue with Mushroom-style layout"
});
var oe = Object.defineProperty, ne = Object.getOwnPropertyDescriptor, M = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? ne(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && oe(t, e, r), r;
};
const le = ["pending", "in_progress", "completed", "missed"], ce = ["actionable", "recurring", "habit", "chore", "reminder", "note"];
let k = class extends _ {
  constructor() {
    super(...arguments), this._config = {}, this._activeListIdx = 0, this._filters = { status: null, trait: null, tag: null }, this._showFilters = !1, this._store = new V(this), this._initialized = !1;
  }
  setConfig(s) {
    this._config = s;
  }
  updated(s) {
    s.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, h.setHass(this.hass), h.loadLists(), this._loadActiveList()) : s.has("hass") && this.hass && h.setHass(this.hass);
  }
  render() {
    const s = this._store.state.lists, t = s[this._activeListIdx], e = (t == null ? void 0 : t.entity_id) || "", i = this._store.state.items.get(e) || [], r = this._applyFilters(i), a = Object.values(this._filters).filter(Boolean).length;
    return n`
      <ha-card>
        ${s.length > 0 ? n`
              <div class="tabs">
                ${s.map(
      (o, d) => n`
                    <button
                      class="tab ${d === this._activeListIdx ? "active" : ""}"
                      @click=${() => this._selectList(d)}
                    >
                      ${o.name}
                    </button>
                  `
    )}
              </div>
            ` : p}

        <div class="filter-toggle">
          <span class="filter-toggle__count">${r.length} items</span>
          <button class="filter-toggle__btn" @click=${() => this._showFilters = !this._showFilters}>
            Filters${a > 0 ? n`<span class="active-filter-badge">${a}</span>` : p}
          </button>
        </div>

        ${this._showFilters ? this._renderFilters() : p}

        ${r.length === 0 ? n`<div class="empty-state">No items match</div>` : r.map((o) => this._renderItem(o, e))}
      </ha-card>
    `;
  }
  _renderFilters() {
    return n`
      <div class="filters">
        <div class="filter-label">Status</div>
        <div class="chips-strip" style="padding: 0 0 4px">
          ${le.map(
      (s) => n`
              <button
                class="mush-chip ${this._filters.status === s ? "mush-chip--filled" : ""}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => this._toggleFilter("status", s)}
              >
                ${s.replace("_", " ")}
              </button>
            `
    )}
        </div>
        <div class="filter-label">Traits</div>
        <div class="chips-strip" style="padding: 0">
          ${ce.map(
      (s) => n`
              <button
                class="mush-chip ${this._filters.trait === s ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${W[s]}"
                @click=${() => this._toggleFilter("trait", s)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${N[s]}></ha-icon>
                </span>
                ${s}
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  _renderItem(s, t) {
    const e = s.status === "completed", i = ut(s.traits), r = i ? W[i] : "var(--rgb-primary-color)", a = i ? N[i] : "", o = this._formatDue(s.due), d = s.deferred_until && new Date(s.deferred_until) > /* @__PURE__ */ new Date();
    return n`
      <div
        class="item-row"
        style="--rgb-state: ${r}"
        @click=${() => this._openEditor(t, s.uid)}
      >
        ${s.priority ? n`<div class="priority-rail priority-rail--${s.priority}"></div>` : p}

        <div
          class="item-check ${e ? "item-check--done" : ""}"
          @click=${(c) => {
      c.stopPropagation(), e || this._complete(t, s.uid);
    }}
        ></div>

        ${a ? n`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${a}></ha-icon>
            </div>` : p}

        <div class="item-info">
          <div class="item-title ${e ? "item-title--done" : ""}">
            ${s.title}
          </div>
          <div class="item-badges">
            ${o ? n`<span class=${o.className}>${o.label}</span>` : p}
            ${s.time_estimate ? n`<span>${s.time_estimate}m</span>` : p}
            ${s.has_recurrence ? n`<span>repeats</span>` : p}
            ${s.current_streak > 0 ? n`<span class="streak">${s.current_streak}d streak</span>` : p}
            ${s.needs_detail ? n`<span class="needs-detail">needs detail</span>` : p}
            ${d ? n`<span class="deferred">deferred</span>` : p}
          </div>
        </div>

        ${s.tags.length > 0 ? n`<span class="item-tags">${s.tags.map((c) => `#${c}`).join(" ")}</span>` : p}
      </div>
    `;
  }
  _applyFilters(s) {
    let t = s;
    return this._filters.status && (t = t.filter((e) => e.status === this._filters.status)), this._filters.trait && (t = t.filter((e) => e.traits.includes(this._filters.trait))), this._filters.tag && (t = t.filter((e) => e.tags.includes(this._filters.tag))), t;
  }
  _toggleFilter(s, t) {
    this._filters = {
      ...this._filters,
      [s]: this._filters[s] === t ? null : t
    };
  }
  _selectList(s) {
    this._activeListIdx = s, this._loadActiveList();
  }
  async _loadActiveList() {
    const t = this._store.state.lists[this._activeListIdx];
    t && await h.loadItems(t.entity_id);
  }
  async _complete(s, t) {
    await h.completeItem(s, t);
  }
  _openEditor(s, t) {
    this.dispatchEvent(
      new CustomEvent("yahatl-open-editor", {
        detail: { entityId: s, itemId: t, hass: this.hass },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _formatDue(s) {
    if (!s) return null;
    const t = new Date(s), e = /* @__PURE__ */ new Date();
    if (t < e)
      return { label: `Overdue ${Math.ceil((e.getTime() - t.getTime()) / 864e5)}d`, className: "overdue" };
    if (t.toDateString() === e.toDateString())
      return { label: "Today", className: "due-today" };
    const i = new Date(e);
    return i.setDate(i.getDate() + 1), t.toDateString() === i.toDateString() ? { label: "Tomorrow", className: "" } : { label: t.toLocaleDateString(), className: "" };
  }
  getCardSize() {
    return 6;
  }
};
k.styles = [
  q,
  A`
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
    `
];
M([
  f({ attribute: !1 })
], k.prototype, "hass", 2);
M([
  m()
], k.prototype, "_config", 2);
M([
  m()
], k.prototype, "_activeListIdx", 2);
M([
  m()
], k.prototype, "_filters", 2);
M([
  m()
], k.prototype, "_showFilters", 2);
k = M([
  O("yahatl-list-card")
], k);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-list-card",
  name: "Yahatl List",
  description: "Filterable item browser with Mushroom chips and trait icons"
});
var de = Object.defineProperty, pe = Object.getOwnPropertyDescriptor, v = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? pe(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && de(t, e, r), r;
};
const At = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], he = [
  "actionable",
  "recurring",
  "habit",
  "chore",
  "reminder",
  "note"
], ue = ["eq", "neq", "gt", "lt", "gte", "lte", "bool"];
function Ct(s, t) {
  var i;
  if (!s || !t) return t;
  const e = s.states[t];
  return ((i = e == null ? void 0 : e.attributes) == null ? void 0 : i.friendly_name) || t;
}
let b = class extends _ {
  constructor() {
    super(...arguments), this.mode = "dialog", this._visible = !1, this._entityId = "", this._itemId = null, this._item = {}, this._section = 0, this._busy = !1, this._error = "", this._allItems = [], this._boundKey = this._onKey.bind(this);
  }
  // --- Public API ---
  async open(s) {
    var t;
    if (this._entityId = s.entityId, this._itemId = s.itemId || null, s.hass && (this.hass = s.hass), this._itemId) {
      const [e, i] = await Promise.all([
        h.getItemDetails(this._entityId, this._itemId),
        h.api.getItems(this._entityId)
      ]);
      if (!e) return;
      this._item = { ...e }, this._allItems = i.filter((r) => r.uid !== this._itemId);
    } else
      this._item = {
        title: "",
        description: "",
        traits: ["actionable"],
        tags: [],
        priority: null,
        assigned_to: (t = this.hass) != null && t.user ? [this.hass.user.id] : [],
        needs_detail: !1
      }, this._allItems = [];
    this._section = 0, this._error = "", this._visible = !0, document.addEventListener("keydown", this._boundKey);
  }
  close() {
    this._visible = !1, document.removeEventListener("keydown", this._boundKey), this.requestUpdate();
  }
  _onKey(s) {
    s.key === "Escape" && this.close();
  }
  // --- Rendering ---
  render() {
    if (!this._visible) return p;
    const s = this._itemId ? ["Basics", "Traits & Tags", "Recurrence", "Blockers", "Requirements", "Schedule"] : ["Basics", "Traits & Tags", "Recurrence"], t = n`
      <div class="modal__header">
        <div class="modal__header-info">
          <h2 class="modal__title">${this._itemId ? "Edit item" : "New item"}</h2>
          ${this._itemId ? n`<div class="modal__sub">${this._entityId} · ${this._itemId.slice(0, 8)}…</div>` : p}
        </div>
        <button class="close-btn" @click=${this.close}>&times;</button>
      </div>
      <div class="tabs">
        ${s.map(
      (e, i) => n`
            <button
              class="tab ${i === this._section ? "is-active" : ""}"
              @click=${() => this._section = i}
            >
              ${e}
            </button>
          `
    )}
      </div>
      <div class="content">${this._renderSection()}</div>
      ${this._error ? n`<div class="error-msg">${this._error}</div>` : p}
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
  _overlayClick(s) {
    s.target.classList.contains("overlay") && this.close();
  }
  _renderSection() {
    switch (this._section) {
      case 0:
        return this._renderBasics();
      case 1:
        return this._renderTraitsTags();
      case 2:
        return this._renderRecurrence();
      case 3:
        return this._renderBlockers();
      case 4:
        return this._renderRequirements();
      case 5:
        return this._renderSchedule();
      default:
        return p;
    }
  }
  // --- Section 0: Basics ---
  _renderBasics() {
    var i;
    const s = this._item, t = (i = this.hass) == null ? void 0 : i.user, e = (s.assigned_to || []).includes((t == null ? void 0 : t.id) || "");
    return n`
      <div class="field">
        <div class="field__label">Title</div>
        <input
          class="input"
          type="text"
          .value=${s.title || ""}
          @input=${(r) => this._set("title", r.target.value)}
        />
      </div>
      <div class="field">
        <div class="field__label">Description</div>
        <textarea
          class="textarea"
          rows="3"
          placeholder="Optional notes…"
          .value=${s.description || ""}
          @input=${(r) => this._set("description", r.target.value)}
        ></textarea>
      </div>
      <div class="row2">
        <div class="field">
          <div class="field__label">Priority</div>
          <select
            class="select"
            .value=${s.priority || ""}
            @change=${(r) => this._set(
      "priority",
      r.target.value || null
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
            .value=${String(s.time_estimate || "")}
            @input=${(r) => this._set(
      "time_estimate",
      parseInt(r.target.value) || null
    )}
          />
        </div>
      </div>
      <div class="field">
        <div class="field__label">Due</div>
        <input
          class="input"
          type="datetime-local"
          .value=${this._toLocalDt(s.due)}
          @change=${(r) => {
      const a = r.target.value;
      this._set("due", a ? new Date(a).toISOString() : null);
    }}
        />
      </div>
      <div class="field">
        <div class="field__label">Assigned to</div>
        <div class="assign-row">
          ${t ? n`
                <button
                  class="trait-toggle ${e ? "is-on" : ""}"
                  style="--rgb-state: var(--rgb-primary-color)"
                  @click=${() => this._toggleAssign(t.id)}
                >
                  <ha-icon icon="mdi:account"></ha-icon>
                  ${t.name}
                </button>
              ` : p}
        </div>
      </div>
      <label class="check-row">
        <input
          type="checkbox"
          .checked=${!!s.needs_detail}
          @change=${(r) => this._set("needs_detail", r.target.checked)}
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
          ` : p}
    `;
  }
  // --- Section 1: Traits & Tags ---
  _renderTraitsTags() {
    const s = this._item.traits || [], t = this._item.tags || [];
    return n`
      <div class="field">
        <div class="field__label">Traits</div>
        <div class="traits-row">
          ${he.map(
      (e) => n`
              <button
                class="trait-toggle ${s.includes(e) ? "is-on" : ""}"
                style="--rgb-state: ${W[e]}"
                @click=${() => this._toggleTrait(e)}
              >
                <ha-icon icon=${N[e]}></ha-icon>
                ${e}
              </button>
            `
    )}
        </div>
      </div>
      <div class="field">
        <div class="field__label">Tags</div>
        <div class="tags-row">
          ${t.map(
      (e, i) => n`
              <span class="tag-chip">
                #${e}
                <button class="tag-chip__remove" @click=${() => this._removeTag(i)}>&times;</button>
              </span>
            `
    )}
          <input
            class="tag-input"
            type="text"
            placeholder="add tag…"
            @keydown=${(e) => {
      e.key === "Enter" && this._addTag(e.target);
    }}
          />
        </div>
      </div>
    `;
  }
  // --- Section 2: Recurrence ---
  _renderRecurrence() {
    const s = this._item.recurrence, t = (s == null ? void 0 : s.type) || "none";
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

      ${t === "calendar" ? this._renderCalendarConfig() : p}
      ${t === "elapsed" ? this._renderElapsedConfig() : p}
      ${t === "frequency" ? this._renderFrequencyConfig() : p}
    `;
  }
  _renderCalendarConfig() {
    const s = this._item.recurrence, t = s.calendar_preset || null, e = s.calendar_days || [], i = s.calendar_days_of_month || [], r = !t, a = !t && e.length === 0;
    return n`
      <div class="chips-strip" style="padding-left: 0; padding-top: 12px">
        ${["daily", "weekdays", "weekends"].map(
      (o) => n`
            <button
              class="mush-chip ${t === o ? "mush-chip--filled" : ""}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._setCalendarPreset(t === o ? null : o)}
            >
              ${o}
            </button>
          `
    )}
        <button
          class="mush-chip ${r && !a ? "mush-chip--filled" : ""}"
          style="--rgb-state: var(--rgb-primary-color)"
          @click=${() => this._setCalendarPreset(null)}
        >
          Custom days
        </button>
      </div>

      ${r ? n`
            <div class="field">
              <div class="field__label">Days of the week</div>
              <div class="day-picker">
                ${At.map(
      (o, d) => n`
                    <button
                      class="day-btn ${e.includes(d) ? "active" : ""}"
                      @click=${() => this._toggleCalendarDay(d)}
                    >
                      ${o}
                    </button>
                  `
    )}
              </div>
            </div>

            ${e.length === 0 ? n`
                  <div class="field">
                    <div class="field__label">Or days of the month (1-31, comma-separated)</div>
                    <input
                      class="input"
                      type="text"
                      placeholder="e.g. 1, 15"
                      .value=${i.join(", ")}
                      @change=${(o) => {
      const c = o.target.value.split(",").map((l) => parseInt(l.trim())).filter((l) => l >= 1 && l <= 31);
      this._updateRecurrence({
        calendar_days_of_month: c.length ? c : null
      });
    }}
                    />
                  </div>
                ` : p}
          ` : p}
    `;
  }
  _renderElapsedConfig() {
    const s = this._item.recurrence;
    return n`
      <div class="row2" style="margin-top: 12px">
        <div class="field">
          <div class="field__label">Every</div>
          <input
            class="input"
            type="number"
            min="1"
            .value=${String(s.elapsed_interval || "")}
            @input=${(t) => this._updateRecurrence({
      elapsed_interval: parseInt(t.target.value) || null
    })}
          />
        </div>
        <div class="field">
          <div class="field__label">Unit</div>
          <select
            class="select"
            .value=${s.elapsed_unit || "days"}
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
    const s = this._item.recurrence;
    return n`
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; font-size: 13px">
        <span>Do this</span>
        <input
          class="input"
          type="number"
          min="1"
          style="width: 60px; flex: none"
          .value=${String(s.frequency_count || "")}
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
          .value=${String(s.frequency_period || "")}
          @input=${(t) => this._updateRecurrence({
      frequency_period: parseInt(t.target.value) || null
    })}
        />
        <select
          class="select"
          style="width: 90px; flex: none"
          .value=${s.frequency_unit || "days"}
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
    const s = this._item.blockers || {
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
          .value=${s.mode || "ALL"}
          @change=${(t) => this._setBlockers({ ...s, mode: t.target.value })}
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
            .value=${s.item_mode || "ANY"}
            @change=${(t) => this._setBlockers({ ...s, item_mode: t.target.value })}
          >
            <option value="ANY">ANY incomplete blocks</option>
            <option value="ALL">ALL must be incomplete to block</option>
          </select>
        </div>
        ${this._allItems.length > 0 ? this._allItems.map(
      (t) => n`
                <label class="check-row">
                  <input
                    type="checkbox"
                    .checked=${(s.items || []).includes(t.uid)}
                    @change=${() => this._toggleBlockerItem(t.uid)}
                  />
                  ${t.title}
                  <span style="font-size: 11px; color: var(--yahatl-text-secondary)">(${t.status})</span>
                </label>
              `
    ) : n`<div style="font-size: 13px; color: var(--yahatl-text-secondary)">No other items</div>`}
      </fieldset>

      <fieldset>
        <legend>Blocked by sensors</legend>
        <div class="field" style="margin-bottom: 8px">
          <select
            class="select"
            .value=${s.sensor_mode || "ANY"}
            @change=${(t) => this._setBlockers({ ...s, sensor_mode: t.target.value })}
          >
            <option value="ANY">ANY sensor on blocks</option>
            <option value="ALL">ALL must be on to block</option>
          </select>
        </div>
        <div class="entity-list">
          ${(s.sensors || []).map(
      (t, e) => n`
              <div class="entity-row">
                <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px; color: var(--yahatl-text-secondary)"></ha-icon>
                <div class="entity-row__name">
                  ${Ct(this.hass, t)}
                  <div class="entity-row__id">${t}</div>
                </div>
                <button class="entity-row__remove" @click=${() => {
        const i = [...s.sensors || []];
        i.splice(e, 1), this._setBlockers({ ...s, sensors: i });
      }}>&times;</button>
              </div>
            `
    )}
        </div>
        <ha-entity-picker
          .hass=${this.hass}
          @value-changed=${(t) => {
      const e = t.detail.value;
      e && !(s.sensors || []).includes(e) && this._setBlockers({ ...s, sensors: [...s.sensors || [], e] });
      const i = t.target;
      setTimeout(() => {
        i.value = "";
      }, 0);
    }}
          label="Add sensor entity"
        ></ha-entity-picker>
      </fieldset>
    `;
  }
  // --- Section 4: Requirements ---
  _renderRequirements() {
    const s = this._item.requirements || {
      mode: "ANY",
      location: [],
      people: [],
      time_constraints: [],
      context: [],
      sensors: []
    }, t = [
      "business_hours",
      "weekend",
      "evening",
      "morning",
      "night"
    ];
    return n`
      <div class="field">
        <div class="field__label">Mode</div>
        <select
          class="select"
          .value=${s.mode || "ANY"}
          @change=${(e) => this._setRequirements({ ...s, mode: e.target.value })}
        >
          <option value="ANY">ANY requirement met = eligible</option>
          <option value="ALL">ALL requirements must be met</option>
        </select>
      </div>
      <div class="field">
        <div class="field__label">Location (zones)</div>
        <div class="chips-strip" style="padding: 0">
          ${Object.entries(this._getZoneEntities()).map(
      ([e, i]) => n`
              <button
                class="mush-chip ${(s.location || []).includes(e) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
        const r = s.location || [];
        this._setRequirements({
          ...s,
          location: r.includes(e) ? r.filter((a) => a !== e) : [...r, e]
        });
      }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${this._getZoneIcon(e)}></ha-icon>
                </span>
                ${i}
              </button>
            `
    )}
        </div>
      </div>
      <div class="field">
        <div class="field__label">People</div>
        <div class="chips-strip" style="padding: 0">
          ${Object.entries(this._getPersonEntities()).map(
      ([e, i]) => n`
              <button
                class="mush-chip ${(s.people || []).includes(e) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
        const r = s.people || [];
        this._setRequirements({
          ...s,
          people: r.includes(e) ? r.filter((a) => a !== e) : [...r, e]
        });
      }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon="mdi:account"></ha-icon>
                </span>
                ${i}
              </button>
            `
    )}
        </div>
      </div>
      <fieldset>
        <legend>Time constraints</legend>
        <div class="chips-strip" style="padding: 0; padding-top: 4px">
          ${t.map(
      (e) => n`
              <button
                class="mush-chip ${(s.time_constraints || []).includes(e) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
        const i = s.time_constraints || [];
        this._setRequirements({
          ...s,
          time_constraints: i.includes(e) ? i.filter((r) => r !== e) : [...i, e]
        });
      }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${{ business_hours: "mdi:briefcase-clock", weekend: "mdi:calendar-weekend", evening: "mdi:weather-sunset", morning: "mdi:weather-sunset-up", night: "mdi:weather-night" }[e]}></ha-icon>
                </span>
                ${e.replace(/_/g, " ")}
              </button>
            `
    )}
        </div>
      </fieldset>
      <div class="field">
        <div class="field__label">Context</div>
        <div class="chips-strip" style="padding: 0">
          ${["focused_work", "calls_ok", "errands", "exercise", "relaxation"].map(
      (e) => n`
              <button
                class="mush-chip ${(s.context || []).includes(e) ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: var(--rgb-primary-color)"
                @click=${() => {
        const i = s.context || [];
        this._setRequirements({
          ...s,
          context: i.includes(e) ? i.filter((r) => r !== e) : [...i, e]
        });
      }}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${{ focused_work: "mdi:head-cog", calls_ok: "mdi:phone", errands: "mdi:cart", exercise: "mdi:run", relaxation: "mdi:sofa" }[e]}></ha-icon>
                </span>
                ${e.replace(/_/g, " ")}
              </button>
            `
    )}
        </div>
      </div>
      <fieldset>
        <legend>Required sensors</legend>
        <div class="entity-list">
          ${(s.sensors || []).map(
      (e, i) => n`
              <div class="entity-row">
                <ha-icon icon="mdi:eye" style="--mdc-icon-size: 16px; color: var(--yahatl-text-secondary)"></ha-icon>
                <div class="entity-row__name">
                  ${Ct(this.hass, e)}
                  <div class="entity-row__id">${e}</div>
                </div>
                <button class="entity-row__remove" @click=${() => {
        const r = [...s.sensors || []];
        r.splice(i, 1), this._setRequirements({ ...s, sensors: r });
      }}>&times;</button>
              </div>
            `
    )}
        </div>
        <ha-entity-picker
          .hass=${this.hass}
          @value-changed=${(e) => {
      const i = e.detail.value;
      i && !(s.sensors || []).includes(i) && this._setRequirements({ ...s, sensors: [...s.sensors || [], i] });
      const r = e.target;
      setTimeout(() => {
        r.value = "";
      }, 0);
    }}
          label="Add sensor entity"
        ></ha-entity-picker>
      </fieldset>
    `;
  }
  // --- Section 5: Schedule ---
  _renderSchedule() {
    const s = this._item.time_blockers || [], t = this._item.condition_triggers || [], e = this._item.deferred_until;
    return n`
      <fieldset>
        <legend>Time Blockers</legend>
        ${s.map(
      (i, r) => n`
            <div class="dyn-row">
              <div class="row2">
                <div class="field">
                  <div class="field__label">Start</div>
                  <input
                    class="input"
                    type="time"
                    .value=${i.start_time || ""}
                    @change=${(a) => this._updateTimeBlocker(r, {
        start_time: a.target.value
      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">End</div>
                  <input
                    class="input"
                    type="time"
                    .value=${i.end_time || ""}
                    @change=${(a) => this._updateTimeBlocker(r, {
        end_time: a.target.value
      })}
                  />
                </div>
              </div>
              <div class="field" style="margin-top: 8px">
                <div class="field__label">Mode</div>
                <select
                  class="select"
                  .value=${i.mode || "suppress"}
                  @change=${(a) => this._updateTimeBlocker(r, {
        mode: a.target.value
      })}
                >
                  <option value="suppress">Suppress</option>
                  <option value="allow">Allow only</option>
                </select>
              </div>
              <div class="day-picker">
                ${At.map(
        (a, o) => n`
                    <button
                      class="day-btn ${!i.days || i.days.includes(o) ? "active" : ""}"
                      @click=${() => this._toggleTimeBlockerDay(r, o)}
                    >
                      ${a}
                    </button>
                  `
      )}
              </div>
              <button
                class="btn btn--danger"
                style="font-size: 12px; padding: 6px 12px"
                @click=${() => this._removeTimeBlocker(r)}
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
      (i, r) => n`
            <div class="dyn-row">
              <div class="field" style="margin-bottom: 8px">
                <div class="field__label">Entity</div>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${i.entity_id || ""}
                  @value-changed=${(a) => this._updateConditionTrigger(r, {
        entity_id: a.detail.value
      })}
                  label="Select entity"
                ></ha-entity-picker>
              </div>
              <div class="row2">
                <div class="field">
                  <div class="field__label">Operator</div>
                  <select
                    class="select"
                    .value=${i.operator || "eq"}
                    @change=${(a) => this._updateConditionTrigger(r, {
        operator: a.target.value
      })}
                  >
                    ${ue.map(
        (a) => n`<option value=${a}>${a}</option>`
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
                    .value=${i.value || ""}
                    @change=${(a) => this._updateConditionTrigger(r, {
        value: a.target.value
      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">On match</div>
                  <select
                    class="select"
                    .value=${i.on_match || "boost"}
                    @change=${(a) => this._updateConditionTrigger(r, {
        on_match: a.target.value
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
                @click=${() => this._removeConditionTrigger(r)}
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
        <legend>Defer Until</legend>
        <div style="display: flex; gap: 8px; align-items: center">
          <input
            class="input"
            type="datetime-local"
            style="flex: 1"
            .value=${this._toLocalDt(e)}
            @change=${(i) => {
      const r = i.target.value;
      this._set(
        "deferred_until",
        r ? new Date(r).toISOString() : null
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
  _set(s, t) {
    this._item = { ...this._item, [s]: t };
  }
  _toggleTrait(s) {
    const t = [...this._item.traits || []], e = t.indexOf(s);
    e >= 0 ? t.splice(e, 1) : t.push(s), this._set("traits", t);
  }
  _toggleAssign(s) {
    const t = [...this._item.assigned_to || []], e = t.indexOf(s);
    e >= 0 ? t.splice(e, 1) : t.push(s), this._set("assigned_to", t);
  }
  _addTag(s) {
    const t = s.value.trim();
    t && !(this._item.tags || []).includes(t) && (this._set("tags", [...this._item.tags || [], t]), s.value = "");
  }
  _removeTag(s) {
    const t = [...this._item.tags || []];
    t.splice(s, 1), this._set("tags", t);
  }
  // Recurrence helpers
  _setRecurrenceType(s) {
    s === "none" ? this._set("recurrence", null) : this._set("recurrence", {
      type: s,
      ...s === "calendar" ? { calendar_preset: "daily", calendar_days: null, calendar_days_of_month: null } : {},
      ...s === "elapsed" ? { elapsed_interval: 1, elapsed_unit: "days" } : {},
      ...s === "frequency" ? { frequency_count: 3, frequency_period: 1, frequency_unit: "weeks" } : {}
    });
  }
  _updateRecurrence(s) {
    this._set("recurrence", { ...this._item.recurrence, ...s });
  }
  _setCalendarPreset(s) {
    this._updateRecurrence({
      calendar_preset: s,
      calendar_days: s ? null : [],
      calendar_days_of_month: null
    });
  }
  _toggleCalendarDay(s) {
    var i;
    const t = [...((i = this._item.recurrence) == null ? void 0 : i.calendar_days) || []], e = t.indexOf(s);
    e >= 0 ? t.splice(e, 1) : t.push(s), this._updateRecurrence({
      calendar_days: t.length ? t : null,
      calendar_days_of_month: null,
      calendar_preset: null
    });
  }
  // Blocker helpers
  _setBlockers(s) {
    this._set("blockers", s);
  }
  _toggleBlockerItem(s) {
    const t = this._item.blockers || { mode: "ALL", items: [], item_mode: "ANY", sensors: [], sensor_mode: "ANY" }, e = [...t.items || []], i = e.indexOf(s);
    i >= 0 ? e.splice(i, 1) : e.push(s), this._setBlockers({ ...t, items: e });
  }
  // Requirements helpers
  _setRequirements(s) {
    this._set("requirements", s);
  }
  // Time blocker helpers
  _addTimeBlocker() {
    const s = [...this._item.time_blockers || []];
    s.push({ start_time: "09:00", end_time: "17:00", mode: "suppress", days: null }), this._set("time_blockers", s);
  }
  _removeTimeBlocker(s) {
    const t = [...this._item.time_blockers || []];
    t.splice(s, 1), this._set("time_blockers", t);
  }
  _updateTimeBlocker(s, t) {
    const e = [...this._item.time_blockers || []];
    e[s] = { ...e[s], ...t }, this._set("time_blockers", e);
  }
  _toggleTimeBlockerDay(s, t) {
    const e = [...this._item.time_blockers || []], i = { ...e[s] }, r = i.days ? [...i.days] : [0, 1, 2, 3, 4, 5, 6], a = r.indexOf(t);
    a >= 0 ? r.splice(a, 1) : r.push(t), i.days = r.length === 7 ? null : r, e[s] = i, this._set("time_blockers", e);
  }
  // Condition trigger helpers
  _addConditionTrigger() {
    const s = [...this._item.condition_triggers || []];
    s.push({ entity_id: "", operator: "eq", value: "", on_match: "boost" }), this._set("condition_triggers", s);
  }
  _removeConditionTrigger(s) {
    const t = [...this._item.condition_triggers || []];
    t.splice(s, 1), this._set("condition_triggers", t);
  }
  _updateConditionTrigger(s, t) {
    const e = [...this._item.condition_triggers || []];
    e[s] = { ...e[s], ...t }, this._set("condition_triggers", e);
  }
  // --- Save / Delete ---
  async _save() {
    var s, t, e, i, r, a, o, d;
    if (!((s = this._item.title) != null && s.trim())) {
      this._error = "Title is required";
      return;
    }
    this._busy = !0, this._error = "";
    try {
      const c = [
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
        "deferred_until"
      ], l = {};
      for (const u of c)
        u in this._item && (l[u] = this._item[u]);
      if (l.blockers) {
        const u = l.blockers;
        !((t = u.items) != null && t.length) && !((e = u.sensors) != null && e.length) && (l.blockers = null);
      }
      if (l.requirements) {
        const u = l.requirements;
        !((i = u.location) != null && i.length) && !((r = u.people) != null && r.length) && !((a = u.time_constraints) != null && a.length) && !((o = u.context) != null && o.length) && !((d = u.sensors) != null && d.length) && (l.requirements = null);
      }
      l.time_blockers && l.time_blockers.length === 0 && delete l.time_blockers, l.condition_triggers && l.condition_triggers.length === 0 && delete l.condition_triggers, this._itemId ? await h.saveItem(this._entityId, this._itemId, l) : await h.createItem(this._entityId, l), this.close();
    } catch (c) {
      this._error = c.message || "Failed to save";
    } finally {
      this._busy = !1;
    }
  }
  async _delete() {
    if (this._itemId) {
      this._busy = !0;
      try {
        await h.deleteItem(this._entityId, this._itemId), this.close();
      } catch (s) {
        this._error = s.message || "Failed to delete";
      } finally {
        this._busy = !1;
      }
    }
  }
  // --- Utilities ---
  _toLocalDt(s) {
    if (!s) return "";
    try {
      const t = new Date(s), e = (i) => String(i).padStart(2, "0");
      return `${t.getFullYear()}-${e(t.getMonth() + 1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}`;
    } catch {
      return "";
    }
  }
  _splitComma(s) {
    return s.split(",").map((t) => t.trim()).filter(Boolean);
  }
  /** Get all zone entities from hass.states as { zone_name: friendly_name } */
  _getZoneEntities() {
    var t;
    if (!((t = this.hass) != null && t.states)) return {};
    const s = {};
    for (const [e, i] of Object.entries(this.hass.states))
      if (e.startsWith("zone.")) {
        const r = i.attributes.friendly_name || e.replace("zone.", "");
        s[r.toLowerCase()] = r;
      }
    return s;
  }
  _getZoneIcon(s) {
    var t;
    if (!((t = this.hass) != null && t.states)) return "mdi:map-marker";
    for (const [e, i] of Object.entries(this.hass.states))
      if (e.startsWith("zone.") && (i.attributes.friendly_name || e.replace("zone.", "")).toLowerCase() === s)
        return i.attributes.icon || "mdi:map-marker";
    return "mdi:map-marker";
  }
  /** Get all person entities from hass.states as { entity_id: friendly_name } */
  _getPersonEntities() {
    var t;
    if (!((t = this.hass) != null && t.states)) return {};
    const s = {};
    for (const [e, i] of Object.entries(this.hass.states))
      e.startsWith("person.") && (s[e] = i.attributes.friendly_name || e);
    return s;
  }
};
b.styles = [
  q,
  A`
      :host {
        display: block;
      }

      /* Overlay */
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 9999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        animation: overlay-in 200ms ease-out;
      }

      @keyframes overlay-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @media (min-width: 600px) {
        .overlay {
          align-items: center;
        }
      }

      /* Modal */
      .modal {
        background: var(--yahatl-card-bg);
        border-radius: 16px 16px 0 0;
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
        animation: modal-slide-up 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      @keyframes modal-slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      @media (min-width: 600px) {
        .modal {
          border-radius: 16px;
          max-height: 80vh;
          animation: modal-scale-in 200ms ease-out;
        }

        @keyframes modal-scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
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
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.15px;
        margin: 0;
        color: var(--yahatl-text);
      }

      .modal__sub {
        font-size: 12px;
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
        -webkit-overflow-scrolling: touch;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: 10px 14px;
        font-size: 13px;
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
        font-size: 13px;
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
        padding: 5px 10px;
        font-size: 12px;
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
        font-size: 13px;
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
        font-size: 11px;
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
        font-size: 12px;
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
        font-size: 12px;
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
        font-size: 13px;
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
        font-size: 13px;
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
        font-size: 13px;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .entity-row__id {
        font-size: 11px;
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

      ha-entity-picker {
        display: block;
        width: 100%;
      }
    `
];
v([
  f()
], b.prototype, "mode", 2);
v([
  f({ attribute: !1 })
], b.prototype, "hass", 2);
v([
  m()
], b.prototype, "_visible", 2);
v([
  m()
], b.prototype, "_entityId", 2);
v([
  m()
], b.prototype, "_itemId", 2);
v([
  m()
], b.prototype, "_item", 2);
v([
  m()
], b.prototype, "_section", 2);
v([
  m()
], b.prototype, "_busy", 2);
v([
  m()
], b.prototype, "_error", 2);
v([
  m()
], b.prototype, "_allItems", 2);
b = v([
  O("yahatl-item-editor")
], b);
document.addEventListener("yahatl-open-editor", ((s) => {
  let t = document.querySelector("yahatl-item-editor");
  t || (t = document.createElement("yahatl-item-editor"), document.body.appendChild(t)), t.open(s.detail);
}));
var ge = Object.defineProperty, me = Object.getOwnPropertyDescriptor, qt = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? me(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && ge(t, e, r), r;
};
const be = [
  "focused_work",
  "calls_ok",
  "errands",
  "exercise",
  "relaxation"
], _e = {
  focused_work: "mdi:head-cog",
  calls_ok: "mdi:phone",
  errands: "mdi:cart",
  exercise: "mdi:run",
  relaxation: "mdi:sofa"
};
function ve(s) {
  return s.replace(/_/g, " ");
}
let et = class extends _ {
  constructor() {
    super(...arguments), this._store = new V(this);
  }
  setConfig(s) {
  }
  connectedCallback() {
    super.connectedCallback(), h.loadContext();
  }
  _getZones() {
    var t;
    if (!((t = this.hass) != null && t.states)) return [];
    const s = [];
    for (const [e, i] of Object.entries(this.hass.states))
      if (e.startsWith("zone.")) {
        const r = i.attributes.friendly_name || e.replace("zone.", ""), a = i.attributes.icon || "mdi:map-marker";
        s.push({ id: r.toLowerCase(), name: r, icon: a });
      }
    return s;
  }
  render() {
    const s = this._store.state.context, t = (s == null ? void 0 : s.location) || null, e = (s == null ? void 0 : s.contexts) || [], i = this._getZones();
    return n`
      <div class="context-bar">
        <span class="section-label">Where</span>
        ${i.map(
      (r) => n`
            <button
              class="mush-chip ${t === r.id ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._setLocation(t === r.id ? null : r.id)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${r.icon}></ha-icon>
              </span>
              ${r.name}
            </button>
          `
    )}
        <span class="section-label">Doing</span>
        ${be.map(
      (r) => n`
            <button
              class="mush-chip ${e.includes(r) ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._toggleContext(r, e)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${_e[r]}></ha-icon>
              </span>
              ${ve(r)}
            </button>
          `
    )}
      </div>
    `;
  }
  async _setLocation(s) {
    await h.setContext({ location: s });
  }
  async _toggleContext(s, t) {
    const e = t.includes(s) ? t.filter((i) => i !== s) : [...t, s];
    await h.setContext({ contexts: e });
  }
};
et.styles = [
  q,
  A`
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
qt([
  f({ attribute: !1 })
], et.prototype, "hass", 2);
et = qt([
  O("yahatl-context-bar")
], et);
var fe = Object.defineProperty, ye = Object.getOwnPropertyDescriptor, Pt = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? ye(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && fe(t, e, r), r;
};
let st = class extends _ {
  constructor() {
    super(...arguments), this._store = new V(this), this._initialized = !1;
  }
  updated(s) {
    s.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, h.setHass(this.hass), h.loadQueue()) : s.has("hass") && this.hass && h.setHass(this.hass);
  }
  setConfig(s) {
  }
  render() {
    const s = this._store.state.queue;
    if (!s)
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
        value: s.overdue_count,
        label: "overdue",
        rgb: "var(--rgb-state-overdue)"
      },
      {
        icon: "mdi:calendar-today",
        value: s.due_today_count,
        label: "due today",
        rgb: "var(--rgb-state-due-today)"
      },
      {
        icon: "mdi:tray-full",
        value: s.blocked_count,
        label: "blocked",
        rgb: "var(--rgb-state-blocked)"
      },
      {
        icon: "mdi:check-circle-outline",
        value: s.total_actionable,
        label: "ready",
        rgb: "var(--rgb-primary-color)"
      }
    ];
    return n`
      <div class="stats-grid">
        ${t.map(
      (e) => n`
            <div class="stat-card" style="--rgb-state: ${e.rgb}">
              <div class="mush-state-item">
                <div class="mush-shape-icon">
                  <ha-icon icon=${e.icon}></ha-icon>
                </div>
                <div class="mush-state-info">
                  <div class="mush-state-info__primary">${e.value}</div>
                  <div class="mush-state-info__secondary">${e.label}</div>
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
st.styles = [
  q,
  A`
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
Pt([
  f({ attribute: !1 })
], st.prototype, "hass", 2);
st = Pt([
  O("yahatl-stats-card")
], st);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-stats-card",
  name: "Yahatl Stats",
  description: "Mushroom-style stat tiles: overdue, today, blocked, ready"
});
var xe = Object.defineProperty, $e = Object.getOwnPropertyDescriptor, K = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? $e(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && xe(t, e, r), r;
};
let z = class extends _ {
  constructor() {
    super(...arguments), this.entityId = "", this._value = "", this._busy = !1;
  }
  setConfig(s) {
    s.entity_id && (this.entityId = s.entity_id);
  }
  render() {
    return n`
      <div class="capture-row">
        <input
          type="text"
          placeholder="Quick add a task…"
          .value=${this._value}
          @input=${(s) => this._value = s.target.value}
          @keydown=${(s) => {
      s.key === "Enter" && this._add();
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
    const s = this._value.trim();
    if (!(!s || !this.entityId)) {
      this._busy = !0;
      try {
        await h.createItem(this.entityId, { title: s }), this._value = "";
      } finally {
        this._busy = !1;
      }
    }
  }
};
z.styles = [
  q,
  A`
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
K([
  f({ attribute: !1 })
], z.prototype, "hass", 2);
K([
  f()
], z.prototype, "entityId", 2);
K([
  m()
], z.prototype, "_value", 2);
K([
  m()
], z.prototype, "_busy", 2);
z = K([
  O("yahatl-quick-add")
], z);
var we = Object.defineProperty, ke = Object.getOwnPropertyDescriptor, rt = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? ke(t, e) : t, a = s.length - 1, o; a >= 0; a--)
    (o = s[a]) && (r = (i ? o(t, e, r) : o(r)) || r);
  return i && r && we(t, e, r), r;
};
let R = class extends _ {
  constructor() {
    super(...arguments), this._config = {}, this._currentIdx = 0, this._store = new V(this), this._initialized = !1;
  }
  setConfig(s) {
    this._config = s;
  }
  updated(s) {
    s.has("hass") && this.hass && !this._initialized ? (this._initialized = !0, h.setHass(this.hass), this._loadInbox()) : s.has("hass") && this.hass && h.setHass(this.hass);
  }
  async _loadInbox() {
    this._store.state.lists.length === 0 && await h.loadLists();
    for (const t of this._store.state.lists)
      await h.loadItems(t.entity_id, { needs_detail: !0 });
  }
  _getInboxItems() {
    const s = [];
    for (const [t, e] of this._store.state.items)
      for (const i of e)
        i.needs_detail && s.push({ entityId: t, item: i });
    return s;
  }
  render() {
    const s = this._getInboxItems(), t = s.length;
    if (t === 0)
      return n`
        <ha-card>
          <div class="card-header">Inbox</div>
          <div class="empty-state">All caught up — nothing needs detail</div>
        </ha-card>
      `;
    const e = Math.min(this._currentIdx, t - 1), i = s[e], r = ut(i.item.traits), a = r ? W[r] : "var(--rgb-primary-color)", o = r ? N[r] : "mdi:tray-full";
    return n`
      <ha-card>
        <div class="inbox-header">
          <span class="inbox-header__title">Inbox</span>
          <span class="inbox-count">${e + 1} of ${t}</span>
        </div>

        <div class="inbox-item">
          <div class="inbox-title-row">
            <div class="mush-shape-icon" style="--rgb-state: ${a}">
              <ha-icon icon=${o}></ha-icon>
            </div>
            <div class="inbox-title">${i.item.title}</div>
          </div>
          ${i.item.tags.length > 0 ? n`
                <div class="inbox-tags">
                  ${i.item.tags.map(
      (d) => n`<span class="tag-chip">#${d}</span>`
    )}
                </div>
              ` : p}
          <div class="inbox-actions">
            <button
              class="btn btn--primary"
              @click=${() => this._openEditor(i.entityId, i.item.uid)}
            >
              Add details
            </button>
            <button
              class="btn btn--ghost"
              @click=${() => this._markDone(i.entityId, i.item.uid)}
            >
              Good enough
            </button>
          </div>
        </div>

        ${t > 1 ? n`
              <div class="nav-row">
                <button
                  class="btn btn--ghost"
                  ?disabled=${e === 0}
                  @click=${() => this._currentIdx = e - 1}
                >
                  Previous
                </button>
                <button
                  class="btn btn--ghost"
                  ?disabled=${e >= t - 1}
                  @click=${() => this._currentIdx = e + 1}
                >
                  Next
                </button>
              </div>
            ` : p}
      </ha-card>
    `;
  }
  _openEditor(s, t) {
    this.dispatchEvent(
      new CustomEvent("yahatl-open-editor", {
        detail: { entityId: s, itemId: t, hass: this.hass },
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _markDone(s, t) {
    await h.saveItem(s, t, { needs_detail: !1 }), await this._loadInbox();
  }
  getCardSize() {
    return 3;
  }
};
R.styles = [
  q,
  A`
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
rt([
  f({ attribute: !1 })
], R.prototype, "hass", 2);
rt([
  m()
], R.prototype, "_config", 2);
rt([
  m()
], R.prototype, "_currentIdx", 2);
R = rt([
  O("yahatl-inbox-card")
], R);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-inbox-card",
  name: "Yahatl Inbox",
  description: "Triage items that need more detail"
});
export {
  et as YahtlContextBar,
  R as YahtlInboxCard,
  b as YahtlItemEditor,
  k as YahtlListCard,
  T as YahtlQueueCard,
  z as YahtlQuickAdd,
  st as YahtlStatsCard
};
