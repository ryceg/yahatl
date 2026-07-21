/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const et = globalThis, ut = et.ShadowRoot && (et.ShadyCSS === void 0 || et.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, gt = Symbol(), vt = /* @__PURE__ */ new WeakMap();
let Lt = class {
  constructor(t, i, s) {
    if (this._$cssResult$ = !0, s !== gt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = i;
  }
  get styleSheet() {
    let t = this.o;
    const i = this.t;
    if (ut && t === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (t = vt.get(i)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && vt.set(i, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const jt = (e) => new Lt(typeof e == "string" ? e : e + "", void 0, gt), k = (e, ...t) => {
  const i = e.length === 1 ? e[0] : t.reduce((s, a, r) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[r + 1], e[0]);
  return new Lt(i, e, gt);
}, Ht = (e, t) => {
  if (ut) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const s = document.createElement("style"), a = et.litNonce;
    a !== void 0 && s.setAttribute("nonce", a), s.textContent = i.cssText, e.appendChild(s);
  }
}, ft = ut ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const s of t.cssRules) i += s.cssText;
  return jt(i);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Bt, defineProperty: Ut, getOwnPropertyDescriptor: Wt, getOwnPropertyNames: Ft, getOwnPropertySymbols: Yt, getPrototypeOf: Vt } = Object, E = globalThis, xt = E.trustedTypes, Qt = xt ? xt.emptyScript : "", lt = E.reactiveElementPolyfillSupport, Y = (e, t) => e, it = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Qt : null;
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
} }, mt = (e, t) => !Bt(e, t), $t = { attribute: !0, type: String, converter: it, reflect: !1, useDefault: !1, hasChanged: mt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), E.litPropertyMetadata ?? (E.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let M = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, i = $t) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(t, i), !i.noAccessor) {
      const s = Symbol(), a = this.getPropertyDescriptor(t, s, i);
      a !== void 0 && Ut(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, i, s) {
    const { get: a, set: r } = Wt(this.prototype, t) ?? { get() {
      return this[i];
    }, set(o) {
      this[i] = o;
    } };
    return { get: a, set(o) {
      const l = a == null ? void 0 : a.call(this);
      r == null || r.call(this, o), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? $t;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Y("elementProperties"))) return;
    const t = Vt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Y("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Y("properties"))) {
      const i = this.properties, s = [...Ft(i), ...Yt(i)];
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
      for (const a of s) i.unshift(ft(a));
    } else t !== void 0 && i.push(ft(t));
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
    return Ht(t, this.constructor.elementStyles), t;
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
    var r;
    const s = this.constructor.elementProperties.get(t), a = this.constructor._$Eu(t, s);
    if (a !== void 0 && s.reflect === !0) {
      const o = (((r = s.converter) == null ? void 0 : r.toAttribute) !== void 0 ? s.converter : it).toAttribute(i, s.type);
      this._$Em = t, o == null ? this.removeAttribute(a) : this.setAttribute(a, o), this._$Em = null;
    }
  }
  _$AK(t, i) {
    var r, o;
    const s = this.constructor, a = s._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const l = s.getPropertyOptions(a), c = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((r = l.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? l.converter : it;
      this._$Em = a;
      const d = c.fromAttribute(i, l.type);
      this[a] = d ?? ((o = this._$Ej) == null ? void 0 : o.get(a)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(t, i, s, a = !1, r) {
    var o;
    if (t !== void 0) {
      const l = this.constructor;
      if (a === !1 && (r = this[t]), s ?? (s = l.getPropertyOptions(t)), !((s.hasChanged ?? mt)(r, i) || s.useDefault && s.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(l._$Eu(t, s)))) return;
      this.C(t, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, i, { useDefault: s, reflect: a, wrapped: r }, o) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, o ?? i ?? this[t]), r !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (i = void 0), this._$AL.set(t, i)), a === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [r, o] of a) {
        const { wrapped: l } = o, c = this[r];
        l !== !0 || this._$AL.has(r) || c === void 0 || this.C(r, void 0, o, c);
      }
    }
    let t = !1;
    const i = this._$AL;
    try {
      t = this.shouldUpdate(i), t ? (this.willUpdate(i), (s = this._$EO) == null || s.forEach((a) => {
        var r;
        return (r = a.hostUpdate) == null ? void 0 : r.call(a);
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
M.elementStyles = [], M.shadowRootOptions = { mode: "open" }, M[Y("elementProperties")] = /* @__PURE__ */ new Map(), M[Y("finalized")] = /* @__PURE__ */ new Map(), lt == null || lt({ ReactiveElement: M }), (E.reactiveElementVersions ?? (E.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis, wt = (e) => e, st = V.trustedTypes, kt = st ? st.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Dt = "$lit$", T = `lit$${Math.random().toFixed(9).slice(2)}$`, qt = "?" + T, Zt = `<${qt}>`, P = document, Q = () => P.createComment(""), Z = (e) => e === null || typeof e != "object" && typeof e != "function", _t = Array.isArray, Xt = (e) => _t(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", ct = `[ 	
\f\r]`, F = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ct = /-->/g, At = />/g, D = RegExp(`>|${ct}(?:([^\\s"'>=/]+)(${ct}*=${ct}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), St = /'/g, Tt = /"/g, Ot = /^(?:script|style|textarea|title)$/i, Kt = (e) => (t, ...i) => ({ _$litType$: e, strings: t, values: i }), n = Kt(1), R = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), Et = /* @__PURE__ */ new WeakMap(), q = P.createTreeWalker(P, 129);
function Pt(e, t) {
  if (!_t(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return kt !== void 0 ? kt.createHTML(t) : t;
}
const Gt = (e, t) => {
  const i = e.length - 1, s = [];
  let a, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = F;
  for (let l = 0; l < i; l++) {
    const c = e[l];
    let d, p, m = -1, w = 0;
    for (; w < c.length && (o.lastIndex = w, p = o.exec(c), p !== null); ) w = o.lastIndex, o === F ? p[1] === "!--" ? o = Ct : p[1] !== void 0 ? o = At : p[2] !== void 0 ? (Ot.test(p[2]) && (a = RegExp("</" + p[2], "g")), o = D) : p[3] !== void 0 && (o = D) : o === D ? p[0] === ">" ? (o = a ?? F, m = -1) : p[1] === void 0 ? m = -2 : (m = o.lastIndex - p[2].length, d = p[1], o = p[3] === void 0 ? D : p[3] === '"' ? Tt : St) : o === Tt || o === St ? o = D : o === Ct || o === At ? o = F : (o = D, a = void 0);
    const S = o === D && e[l + 1].startsWith("/>") ? " " : "";
    r += o === F ? c + Zt : m >= 0 ? (s.push(d), c.slice(0, m) + Dt + c.slice(m) + T + S) : c + T + (m === -2 ? l : S);
  }
  return [Pt(e, r + (e[i] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class X {
  constructor({ strings: t, _$litType$: i }, s) {
    let a;
    this.parts = [];
    let r = 0, o = 0;
    const l = t.length - 1, c = this.parts, [d, p] = Gt(t, i);
    if (this.el = X.createElement(d, s), q.currentNode = this.el.content, i === 2 || i === 3) {
      const m = this.el.content.firstChild;
      m.replaceWith(...m.childNodes);
    }
    for (; (a = q.nextNode()) !== null && c.length < l; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const m of a.getAttributeNames()) if (m.endsWith(Dt)) {
          const w = p[o++], S = a.getAttribute(m).split(T), tt = /([.?@])?(.*)/.exec(w);
          c.push({ type: 1, index: r, name: tt[2], strings: S, ctor: tt[1] === "." ? te : tt[1] === "?" ? ee : tt[1] === "@" ? ie : ot }), a.removeAttribute(m);
        } else m.startsWith(T) && (c.push({ type: 6, index: r }), a.removeAttribute(m));
        if (Ot.test(a.tagName)) {
          const m = a.textContent.split(T), w = m.length - 1;
          if (w > 0) {
            a.textContent = st ? st.emptyScript : "";
            for (let S = 0; S < w; S++) a.append(m[S], Q()), q.nextNode(), c.push({ type: 2, index: ++r });
            a.append(m[w], Q());
          }
        }
      } else if (a.nodeType === 8) if (a.data === qt) c.push({ type: 2, index: r });
      else {
        let m = -1;
        for (; (m = a.data.indexOf(T, m + 1)) !== -1; ) c.push({ type: 7, index: r }), m += T.length - 1;
      }
      r++;
    }
  }
  static createElement(t, i) {
    const s = P.createElement("template");
    return s.innerHTML = t, s;
  }
}
function j(e, t, i = e, s) {
  var o, l;
  if (t === R) return t;
  let a = s !== void 0 ? (o = i._$Co) == null ? void 0 : o[s] : i._$Cl;
  const r = Z(t) ? void 0 : t._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== r && ((l = a == null ? void 0 : a._$AO) == null || l.call(a, !1), r === void 0 ? a = void 0 : (a = new r(e), a._$AT(e, i, s)), s !== void 0 ? (i._$Co ?? (i._$Co = []))[s] = a : i._$Cl = a), a !== void 0 && (t = j(e, a._$AS(e, t.values), a, s)), t;
}
class Jt {
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
    const { el: { content: i }, parts: s } = this._$AD, a = ((t == null ? void 0 : t.creationScope) ?? P).importNode(i, !0);
    q.currentNode = a;
    let r = q.nextNode(), o = 0, l = 0, c = s[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let d;
        c.type === 2 ? d = new G(r, r.nextSibling, this, t) : c.type === 1 ? d = new c.ctor(r, c.name, c.strings, this, t) : c.type === 6 && (d = new se(r, this, t)), this._$AV.push(d), c = s[++l];
      }
      o !== (c == null ? void 0 : c.index) && (r = q.nextNode(), o++);
    }
    return q.currentNode = P, a;
  }
  p(t) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
  }
}
class G {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, i, s, a) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
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
    t = j(this, t, i), Z(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== R && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Xt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && Z(this._$AH) ? this._$AA.nextSibling.data = t : this.T(P.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var r;
    const { values: i, _$litType$: s } = t, a = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = X.createElement(Pt(s.h, s.h[0]), this.options)), s);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === a) this._$AH.p(i);
    else {
      const o = new Jt(a, this), l = o.u(this.options);
      o.p(i), this.T(l), this._$AH = o;
    }
  }
  _$AC(t) {
    let i = Et.get(t.strings);
    return i === void 0 && Et.set(t.strings, i = new X(t)), i;
  }
  k(t) {
    _t(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, a = 0;
    for (const r of t) a === i.length ? i.push(s = new G(this.O(Q()), this.O(Q()), this, this.options)) : s = i[a], s._$AI(r), a++;
    a < i.length && (this._$AR(s && s._$AB.nextSibling, a), i.length = a);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, i); t !== this._$AB; ) {
      const a = wt(t).nextSibling;
      wt(t).remove(), t = a;
    }
  }
  setConnected(t) {
    var i;
    this._$AM === void 0 && (this._$Cv = t, (i = this._$AP) == null || i.call(this, t));
  }
}
class ot {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, i, s, a, r) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = i, this._$AM = a, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(t, i = this, s, a) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) t = j(this, t, i, 0), o = !Z(t) || t !== this._$AH && t !== R, o && (this._$AH = t);
    else {
      const l = t;
      let c, d;
      for (t = r[0], c = 0; c < r.length - 1; c++) d = j(this, l[s + c], i, c), d === R && (d = this._$AH[c]), o || (o = !Z(d) || d !== this._$AH[c]), d === h ? t = h : t !== h && (t += (d ?? "") + r[c + 1]), this._$AH[c] = d;
    }
    o && !a && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class te extends ot {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class ee extends ot {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class ie extends ot {
  constructor(t, i, s, a, r) {
    super(t, i, s, a, r), this.type = 5;
  }
  _$AI(t, i = this) {
    if ((t = j(this, t, i, 0) ?? h) === R) return;
    const s = this._$AH, a = t === h && s !== h || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, r = t !== h && (s === h || a);
    a && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class se {
  constructor(t, i, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    j(this, t);
  }
}
const dt = V.litHtmlPolyfillSupport;
dt == null || dt(X, G), (V.litHtmlVersions ?? (V.litHtmlVersions = [])).push("3.3.2");
const ae = (e, t, i) => {
  const s = (i == null ? void 0 : i.renderBefore) ?? t;
  let a = s._$litPart$;
  if (a === void 0) {
    const r = (i == null ? void 0 : i.renderBefore) ?? null;
    s._$litPart$ = a = new G(t.insertBefore(Q(), r), r, void 0, i ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = globalThis;
class y extends M {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ae(i, this.renderRoot, this.renderOptions);
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
    return R;
  }
}
var zt;
y._$litElement$ = !0, y.finalized = !0, (zt = O.litElementHydrateSupport) == null || zt.call(O, { LitElement: y });
const ht = O.litElementPolyfillSupport;
ht == null || ht({ LitElement: y });
(O.litElementVersions ?? (O.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const C = (e) => (t, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const re = { attribute: !0, type: String, converter: it, reflect: !1, hasChanged: mt }, oe = (e = re, t, i) => {
  const { kind: s, metadata: a } = i;
  let r = globalThis.litPropertyMetadata.get(a);
  if (r === void 0 && globalThis.litPropertyMetadata.set(a, r = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), r.set(i.name, e), s === "accessor") {
    const { name: o } = i;
    return { set(l) {
      const c = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(o, c, e, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, e, l), l;
    } };
  }
  if (s === "setter") {
    const { name: o } = i;
    return function(l) {
      const c = this[o];
      t.call(this, l), this.requestUpdate(o, c, e, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function x(e) {
  return (t, i) => typeof i == "object" ? oe(e, t, i) : ((s, a, r) => {
    const o = a.hasOwnProperty(r);
    return a.constructor.createProperty(r, s), o ? Object.getOwnPropertyDescriptor(a, r) : void 0;
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
const H = {
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
function bt(e) {
  for (const t of e)
    if (t in H) return t;
  return null;
}
const L = k`
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
class ne {
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
class le {
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
    this._hass = t, this._api = new ne(t);
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
const u = new le();
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
function Nt(e, t, i) {
  e.dispatchEvent(
    new CustomEvent(t, {
      detail: i,
      bubbles: !0,
      composed: !0,
      cancelable: !1
    })
  );
}
function yt(e, t) {
  Nt(e, "show-dialog", {
    dialogTag: "yahatl-item-editor",
    dialogImport: () => Promise.resolve(),
    dialogParams: t,
    addHistory: !0
  });
}
var ce = Object.defineProperty, de = Object.getOwnPropertyDescriptor, A = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? de(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && ce(t, i, a), a;
};
let v = class extends y {
  constructor() {
    super(...arguments), this._config = {}, this._quickAddValue = "", this._quickAddBusy = !1, this._flash = "", this._store = new U(this), this._initialized = !1, this._drag = {
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
    var l, c, d;
    const e = this._store.state.queue, t = this._config.max_items || 10, i = this._config.title || "Up Next", s = this._config.todo_entity || "", a = (e == null ? void 0 : e.items.slice(0, t)) || [], r = (c = (l = this.hass) == null ? void 0 : l.user) == null ? void 0 : c.name, o = this._store.state.context;
    return n`
      <ha-card>
        <div class="card-header">${i}</div>
        ${r ? n`<div class="greeting">Hello, ${r}</div>` : h}
        ${this._flash ? n`<div class="flash">${this._flash}</div>` : h}

        <div class="queue-controls" style="padding-top: 10px">
          <select @change=${(p) => this._setLocation(p.target.value)}>
            <option value="">Location: any</option>
            ${this._getZones().map(
      (p) => n`<option value=${p.id} ?selected=${(o == null ? void 0 : o.location) === p.id}>${p.name}</option>`
    )}
          </select>
          <select @change=${(p) => this._setContextFilter(p.target.value)}>
            <option value="">Context: any</option>
            ${(((d = this._store.state.meta) == null ? void 0 : d.contexts) || []).map(
      (p) => n`<option value=${p.id} ?selected=${((o == null ? void 0 : o.contexts) || []).includes(p.id)}>${p.name}</option>`
    )}
          </select>
        </div>

        <div class="capture-row">
          <input
            type="text"
            placeholder="Quick add a task…"
            .value=${this._quickAddValue}
            @input=${(p) => this._quickAddValue = p.target.value}
            @keydown=${(p) => {
      p.key === "Enter" && this._quickAdd(s);
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

        ${a.length === 0 ? n`<div class="empty-state">Nothing in the queue</div>` : a.map((p, m) => this._renderItem(p, m, s))}
      </ha-card>
    `;
  }
  _renderItem(e, t, i) {
    const s = e.item, a = bt(s.traits), r = a ? K[a] : "var(--rgb-primary-color)", o = a ? H[a] : "mdi:checkbox-marked-circle-outline", l = this._formatDue(s.due), c = i || `todo.${e.list_id}`;
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
          style="--rgb-state: ${r}"
          @click=${() => this._onItemClick(c, s.uid)}
          @touchstart=${(d) => this._onTouchStart(d, c, s.uid)}
          @touchmove=${(d) => this._onTouchMove(d)}
          @touchend=${() => this._onTouchEnd()}
          @touchcancel=${() => this._onTouchEnd()}
        >
        ${s.priority ? n`<div class="priority-rail priority-rail--${s.priority}"></div>` : h}
        <div class="queue-rank">${t + 1}</div>
        <div class="mush-shape-icon">
          <ha-icon icon=${o}></ha-icon>
        </div>
        <div class="queue-info">
          <div class="mush-state-info__primary">${s.title}</div>
          <div class="queue-meta">
            ${l ? n`<span class=${l.className}>${l.label}</span>` : h}
            ${l && (s.time_estimate || s.tags.length) ? n`<span class="sep">·</span>` : h}
            ${s.time_estimate ? n`<span>${s.time_estimate}m</span>` : h}
            ${s.time_estimate && s.tags.length ? n`<span class="sep">·</span>` : h}
            ${s.tags.length > 0 ? n`<span>${s.tags.map((d) => `#${d}`).join(" ")}</span>` : h}
            ${s.current_streak > 0 ? n`<span class="sep">·</span><span>${s.current_streak} day streak</span>` : h}
          </div>
        </div>
        <div class="queue-actions">
          <button
            class="queue-btn queue-btn--ghost"
            title="Delay to the next time this task is schedulable"
            @click=${(d) => {
      d.stopPropagation(), this._delay(c, s.uid);
    }}
          >
            delay
          </button>
          <button
            class="queue-btn"
            @click=${(d) => {
      d.stopPropagation(), this._complete(c, s.uid);
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
    const r = v.SWIPE_MAX, o = Math.max(-r, Math.min(r, s));
    t.el.style.transform = `translateX(${o}px)`;
    const l = t.el.parentElement;
    if (l) {
      const c = Math.min(1, Math.abs(o) / v.SWIPE_THRESHOLD), d = l.querySelector(".swipe-hint--done"), p = l.querySelector(".swipe-hint--delay");
      d && (d.style.opacity = s > 0 ? String(c) : "0"), p && (p.style.opacity = s < 0 ? String(c) : "0");
    }
  }
  _onTouchEnd() {
    const e = this._drag;
    if (!e.active || !e.el) {
      e.active = !1;
      return;
    }
    const t = e.el, i = t.parentElement, s = v.SWIPE_THRESHOLD, a = e.dx <= -s, r = e.dx >= s;
    t.style.transition = "transform 180ms ease", t.style.transform = "translateX(0)", window.setTimeout(() => {
      if (t.style.transition = "", i) {
        const c = i.querySelector(".swipe-hint--done"), d = i.querySelector(".swipe-hint--delay");
        c && (c.style.opacity = "0"), d && (d.style.opacity = "0");
      }
    }, 180);
    const { entity: o, id: l } = e;
    e.active = !1, a ? this._delay(o, l) : r && this._complete(o, l);
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
    yt(this, { entityId: e, itemId: t, hass: this.hass });
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
v.SWIPE_THRESHOLD = 80;
v.SWIPE_MAX = 140;
v.styles = [
  L,
  k`
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
    `
];
A([
  x({ attribute: !1 })
], v.prototype, "hass", 2);
A([
  g()
], v.prototype, "_config", 2);
A([
  g()
], v.prototype, "_quickAddValue", 2);
A([
  g()
], v.prototype, "_quickAddBusy", 2);
A([
  g()
], v.prototype, "_flash", 2);
v = A([
  C("yahatl-queue-card")
], v);
let I = class extends y {
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
        .schema=${I._schema}
        .computeLabel=${(e) => I._labels[e.name] ?? e.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    ` : h;
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
I._schema = [
  { name: "entity", required: !0, selector: { entity: { domain: "sensor" } } },
  { name: "todo_entity", required: !0, selector: { entity: { domain: "todo" } } },
  { name: "title", selector: { text: {} } },
  { name: "max_items", selector: { number: { min: 1, max: 50, mode: "box" } } }
];
I._labels = {
  entity: "Queue sensor",
  todo_entity: "Todo list entity",
  title: "Card title",
  max_items: "Max items shown"
};
A([
  x({ attribute: !1 })
], I.prototype, "hass", 2);
A([
  g()
], I.prototype, "_config", 2);
I = A([
  C("yahatl-queue-card-editor")
], I);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-queue-card",
  name: "Yahatl Queue",
  description: "Prioritized task queue with Mushroom-style layout"
});
var he = Object.defineProperty, pe = Object.getOwnPropertyDescriptor, W = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? pe(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && he(t, i, a), a;
};
const ue = ["pending", "in_progress", "completed", "missed"], ge = ["actionable", "recurring", "habit", "chore", "reminder", "note"];
let z = class extends y {
  constructor() {
    super(...arguments), this._config = {}, this._activeListIdx = 0, this._filters = { status: null, trait: null, tag: null }, this._showFilters = !1, this._store = new U(this), this._initialized = !1;
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
    const e = this._store.state.lists, t = e[this._activeListIdx], i = (t == null ? void 0 : t.entity_id) || "", s = this._store.state.items.get(i) || [], a = this._applyFilters(s), r = Object.values(this._filters).filter(Boolean).length;
    return n`
      <ha-card>
        ${e.length > 0 ? n`
              <div class="tabs">
                ${e.map(
      (o, l) => n`
                    <button
                      class="tab ${l === this._activeListIdx ? "active" : ""}"
                      @click=${() => this._selectList(l)}
                    >
                      ${o.name}
                    </button>
                  `
    )}
              </div>
            ` : h}

        <div class="filter-toggle">
          <span class="filter-toggle__count">${a.length} items</span>
          <button class="filter-toggle__btn" @click=${() => this._showFilters = !this._showFilters}>
            Filters${r > 0 ? n`<span class="active-filter-badge">${r}</span>` : h}
          </button>
        </div>

        ${this._showFilters ? this._renderFilters() : h}

        ${a.length === 0 ? n`<div class="empty-state">No items match</div>` : a.map((o) => this._renderItem(o, i))}
      </ha-card>
    `;
  }
  _renderFilters() {
    return n`
      <div class="filters">
        <div class="filter-label">Status</div>
        <div class="chips-strip" style="padding: 0 0 4px">
          ${ue.map(
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
          ${ge.map(
      (e) => n`
              <button
                class="mush-chip ${this._filters.trait === e ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${K[e]}"
                @click=${() => this._toggleFilter("trait", e)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${H[e]}></ha-icon>
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
    const i = e.status === "completed", s = bt(e.traits), a = s ? K[s] : "var(--rgb-primary-color)", r = s ? H[s] : "", o = this._formatDue(e.due), l = e.deferred_until && new Date(e.deferred_until) > /* @__PURE__ */ new Date();
    return n`
      <div
        class="item-row"
        style="--rgb-state: ${a}"
        @click=${() => this._openEditor(t, e.uid)}
      >
        ${e.priority ? n`<div class="priority-rail priority-rail--${e.priority}"></div>` : h}

        <div
          class="item-check ${i ? "item-check--done" : ""}"
          @click=${(c) => {
      c.stopPropagation(), i || this._complete(t, e.uid);
    }}
        ></div>

        ${r ? n`<div class="mush-shape-icon mush-shape-icon--sm">
              <ha-icon icon=${r}></ha-icon>
            </div>` : h}

        <div class="item-info">
          <div class="item-title ${i ? "item-title--done" : ""}">
            ${e.title}
          </div>
          <div class="item-badges">
            ${o ? n`<span class=${o.className}>${o.label}</span>` : h}
            ${e.time_estimate ? n`<span>${e.time_estimate}m</span>` : h}
            ${e.has_recurrence ? n`<span>repeats</span>` : h}
            ${e.current_streak > 0 ? n`<span class="streak">${e.current_streak}d streak</span>` : h}
            ${e.needs_detail ? n`<span class="needs-detail">needs detail</span>` : h}
            ${l ? n`<span class="deferred">deferred</span>` : h}
          </div>
        </div>

        ${e.tags.length > 0 ? n`<span class="item-tags">${e.tags.map((c) => `#${c}`).join(" ")}</span>` : h}
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
    yt(this, { entityId: e, itemId: t, hass: this.hass });
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
z.styles = [
  L,
  k`
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
W([
  x({ attribute: !1 })
], z.prototype, "hass", 2);
W([
  g()
], z.prototype, "_config", 2);
W([
  g()
], z.prototype, "_activeListIdx", 2);
W([
  g()
], z.prototype, "_filters", 2);
W([
  g()
], z.prototype, "_showFilters", 2);
z = W([
  C("yahatl-list-card")
], z);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-list-card",
  name: "Yahatl List",
  description: "Filterable item browser with Mushroom chips and trait icons"
});
var me = Object.defineProperty, _e = Object.getOwnPropertyDescriptor, b = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? _e(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && me(t, i, a), a;
};
const It = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], be = [
  "actionable",
  "recurring",
  "habit",
  "chore",
  "reminder",
  "note",
  "someday",
  "shopping",
  "gift"
], ye = ["eq", "neq", "gt", "lt", "gte", "lte", "bool"], ve = [
  { id: "work_hours", name: "Work hours", icon: "mdi:briefcase-clock" },
  { id: "productive", name: "Productive", icon: "mdi:lightning-bolt" },
  { id: "weekend_project", name: "Weekend project", icon: "mdi:hammer-wrench" }
], fe = [
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
function pt(e, t) {
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
    this._entityId = e.entityId, this._itemId = e.itemId || null, e.hass && (this.hass = e.hass), this._contexts = ve, u.api.getMeta().then((a) => {
      var r;
      (r = a.contexts) != null && r.length && (this._contexts = a.contexts);
    }).catch(() => {
    });
    const t = u.api.getItems(this._entityId), i = u.api.getTags().catch(() => []);
    if (this._itemId) {
      const [a, r, o] = await Promise.all([
        u.getItemDetails(this._entityId, this._itemId),
        t,
        i
      ]);
      if (!a) return;
      this._item = { ...a }, this._allItems = r.filter((l) => l.uid !== this._itemId), this._existingTags = o.map((l) => l.name), this._existingProjects = [...new Set(r.map((l) => l.project).filter((l) => !!l))];
    } else {
      const [a, r] = await Promise.all([
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
      }, this._allItems = a, this._existingTags = r.map((o) => o.name), this._existingProjects = [...new Set(a.map((o) => o.project).filter((o) => !!o))];
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
    this._visible && (this._visible = !1, document.removeEventListener("keydown", this._boundKey), document.body.style.overflow = "", this.requestUpdate(), this.mode !== "inline" && Nt(this, "dialog-closed", { dialog: "yahatl-item-editor" }));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._boundKey), document.body.style.overflow = "";
  }
  _overlayClick(e) {
    e.target.classList.contains("overlay") && this.close();
  }
  // --- Rendering ---
  render() {
    if (!this._visible) return h;
    const e = ["Basics", "Recurrence", "Requirements", "Blockers", "Schedule"], t = n`
      <div class="modal__header">
        <div class="modal__header-info">
          <h2 class="modal__title">${this._itemId ? "Edit item" : "New item"}</h2>
          ${this._itemId ? n`<div class="modal__sub">${this._entityId} · ${this._itemId.slice(0, 8)}…</div>` : h}
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
      ${this._error ? n`<div class="error-msg">${this._error}</div>` : h}
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
        return h;
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
          ` : h}
    `;
  }
  // --- Section 1: Traits & Tags ---
  _renderTraitsTags() {
    const e = this._item.traits || [], t = this._item.tags || [];
    return n`
      <div class="field">
        <div class="field__label">Traits</div>
        <div class="traits-row">
          ${be.map(
      (i) => n`
              <button
                class="trait-toggle ${e.includes(i) ? "is-on" : ""}"
                style="--rgb-state: ${K[i]}"
                @click=${() => this._toggleTrait(i)}
              >
                <ha-icon icon=${H[i]}></ha-icon>
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

      ${t === "calendar" ? this._renderCalendarConfig() : h}
      ${t === "elapsed" ? this._renderElapsedConfig() : h}
      ${t === "frequency" ? this._renderFrequencyConfig() : h}
    `;
  }
  _renderCalendarConfig() {
    const e = this._item.recurrence, t = e.calendar_preset || null, i = e.calendar_days || [], s = e.calendar_days_of_month || [], a = !t, r = !t && i.length === 0;
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
          class="mush-chip ${a && !r ? "mush-chip--filled" : ""}"
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
                ${It.map(
      (o, l) => n`
                    <button
                      class="day-btn ${i.includes(l) ? "active" : ""}"
                      @click=${() => this._toggleCalendarDay(l)}
                    >
                      ${o}
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
                      @change=${(o) => {
      const c = o.target.value.split(",").map((d) => parseInt(d.trim())).filter((d) => d >= 1 && d <= 31);
      this._updateRecurrence({
        calendar_days_of_month: c.length ? c : null
      });
    }}
                    />
                  </div>
                ` : h}
          ` : h}
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
                  ${pt(this.hass, t)}
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
                @click=${() => {
        const s = e.location || [];
        this._setRequirements({
          ...e,
          location: s.includes(t) ? s.filter((a) => a !== t) : [...s, t]
        });
      }}
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
                @click=${() => {
        const i = e.context || [];
        this._setRequirements({
          ...e,
          context: i.includes(t.id) ? i.filter((s) => s !== t.id) : [...i, t.id]
        });
      }}
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
                  ${pt(this.hass, t)}
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
    const e = this._item.time_blockers || [], t = this._item.condition_triggers || [], i = this._item.deferred_until;
    return n`
      <fieldset>
        <legend>Time Blockers</legend>
        <div class="field__label" style="margin-bottom: 6px">Shortcuts</div>
        <div class="chips-strip" style="padding: 0 0 4px">
          ${fe.map((s) => {
      const a = this._presetState(s), r = a !== "off", o = a === "not";
      return n`
              <button
                class="mush-chip ${r ? "mush-chip--filled" : "mush-chip--state"}"
                style="--rgb-state: ${o ? "var(--rgb-danger)" : "var(--rgb-primary-color)"}"
                title="Click to cycle: only during → not during → off"
                @click=${() => this._cyclePreset(s)}
              >
                <span class="mush-chip__icon">
                  <ha-icon icon=${s.icon}></ha-icon>
                </span>
                ${o ? `Not ${s.label.toLowerCase()}` : s.label}
              </button>
            `;
    })}
        </div>
        <div class="hint" style="margin-bottom: 10px">
          Shortcuts add a matching time blocker below. Tap again to invert (NOT), and once
          more to clear.
        </div>
        ${e.map(
      (s, a) => n`
            <div class="dyn-row">
              <div class="row2">
                <div class="field">
                  <div class="field__label">Start</div>
                  <input
                    class="input"
                    type="time"
                    .value=${s.start_time || ""}
                    @change=${(r) => this._updateTimeBlocker(a, {
        start_time: r.target.value
      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">End</div>
                  <input
                    class="input"
                    type="time"
                    .value=${s.end_time || ""}
                    @change=${(r) => this._updateTimeBlocker(a, {
        end_time: r.target.value
      })}
                  />
                </div>
              </div>
              <div class="field" style="margin-top: 8px">
                <div class="field__label">Mode</div>
                <select
                  class="select"
                  .value=${s.mode || "suppress"}
                  @change=${(r) => this._updateTimeBlocker(a, {
        mode: r.target.value
      })}
                >
                  <option value="suppress">Suppress</option>
                  <option value="allow">Allow only</option>
                </select>
              </div>
              <div class="day-picker">
                ${It.map(
        (r, o) => n`
                    <button
                      class="day-btn ${!s.days || s.days.includes(o) ? "active" : ""}"
                      @click=${() => this._toggleTimeBlockerDay(a, o)}
                    >
                      ${r}
                    </button>
                  `
      )}
              </div>
              <button
                class="btn btn--danger"
                style="font-size: 12px; padding: 6px 12px"
                @click=${() => this._removeTimeBlocker(a)}
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
      (s, a) => n`
            <div class="dyn-row">
              <div class="field" style="margin-bottom: 8px">
                <div class="field__label">Entity</div>
                ${s.entity_id ? n`
                    <div class="entity-row" style="margin-bottom: 6px">
                      <div class="entity-row__name">
                        ${pt(this.hass, s.entity_id)}
                        <div class="entity-row__id">${s.entity_id}</div>
                      </div>
                      <button class="entity-row__remove" @click=${() => this._updateConditionTrigger(a, { entity_id: "" })}>&times;</button>
                    </div>
                  ` : h}
                ${this._renderEntityCombo(
        `ct-entity-${a}`,
        s.entity_id ? "Change entity…" : "Select entity…",
        [],
        (r) => this._updateConditionTrigger(a, { entity_id: r })
      )}
              </div>
              <div class="row2">
                <div class="field">
                  <div class="field__label">Operator</div>
                  <select
                    class="select"
                    .value=${s.operator || "eq"}
                    @change=${(r) => this._updateConditionTrigger(a, {
        operator: r.target.value
      })}
                  >
                    ${ye.map(
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
                    .value=${s.value || ""}
                    @change=${(r) => this._updateConditionTrigger(a, {
        value: r.target.value
      })}
                  />
                </div>
                <div class="field">
                  <div class="field__label">On match</div>
                  <select
                    class="select"
                    .value=${s.on_match || "boost"}
                    @change=${(r) => this._updateConditionTrigger(a, {
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
                @click=${() => this._removeConditionTrigger(a)}
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
            .value=${this._toLocalDt(i)}
            @change=${(s) => {
      const a = s.target.value;
      this._set(
        "deferred_until",
        a ? new Date(a).toISOString() : null
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
    const i = [...this._item.time_blockers || []], s = { ...i[e] }, a = s.days ? [...s.days] : [0, 1, 2, 3, 4, 5, 6], r = a.indexOf(t);
    r >= 0 ? a.splice(r, 1) : a.push(t), s.days = a.length === 7 ? null : a, i[e] = s, this._set("time_blockers", i);
  }
  // Time-blocker preset (schedule shortcut) helpers
  _sameDays(e, t) {
    const i = e && e.length ? [...e].sort((a, r) => a - r).join(",") : "", s = t && t.length ? [...t].sort((a, r) => a - r).join(",") : "";
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
    var e, t, i, s, a, r, o, l;
    if (!((e = this._item.title) != null && e.trim())) {
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
      ], d = {};
      for (const p of c)
        p in this._item && (d[p] = this._item[p]);
      if (d.blockers) {
        const p = d.blockers;
        !((t = p.items) != null && t.length) && !((i = p.sensors) != null && i.length) && (d.blockers = null);
      }
      if (d.requirements) {
        const p = d.requirements;
        !((s = p.location) != null && s.length) && !((a = p.people) != null && a.length) && !((r = p.time_constraints) != null && r.length) && !((o = p.context) != null && o.length) && !((l = p.sensors) != null && l.length) && (d.requirements = null);
      }
      d.time_blockers && d.time_blockers.length === 0 && delete d.time_blockers, d.condition_triggers && d.condition_triggers.length === 0 && delete d.condition_triggers, this._itemId ? await u.saveItem(this._entityId, this._itemId, d) : await u.createItem(this._entityId, d), this.close();
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
    for (const [a, r] of Object.entries(this.hass.states)) {
      if (e.includes(a)) continue;
      const o = r.attributes.friendly_name || a;
      t && !a.toLowerCase().includes(t) && !o.toLowerCase().includes(t) || i.push({ id: a, name: o });
    }
    return i.sort((a, r) => a.name.localeCompare(r.name)), t ? i.slice(0, 50) : i.slice(0, 20);
  }
  _renderEntityCombo(e, t, i, s) {
    const a = this._entityDropdownOpen === e, r = a ? this._getFilteredEntities(i) : [];
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
          @input=${(o) => {
      this._entityFilter = o.target.value;
    }}
        />
        ${a ? n`
          <div class="entity-combo__dropdown">
            ${r.length > 0 ? r.map(
      (o) => n`
                    <div
                      class="entity-combo__option"
                      @mousedown=${(l) => {
        l.preventDefault(), s(o.id), this._entityDropdownOpen = null, this._entityFilter = "";
      }}
                    >
                      <span class="entity-combo__option-name">${o.name}</span>
                      <span class="entity-combo__option-id">${o.id}</span>
                    </div>
                  `
    ) : n`<div class="entity-combo__option"><span class="entity-combo__option-name" style="color: var(--yahatl-text-secondary)">No matches</span></div>`}
          </div>
        ` : h}
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
      for (const [r, o] of Object.entries(this.hass.states)) {
        if (!r.startsWith("person.")) continue;
        const l = o.attributes.user_id;
        if (!l || t.has(l)) continue;
        const c = o.attributes.friendly_name || r.replace("person.", "");
        e.push({ id: l, name: c }), t.add(l);
      }
    return e.sort((r, o) => r.name.localeCompare(o.name)), e;
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
  L,
  k`
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
  C("yahatl-item-editor")
], _);
var xe = Object.defineProperty, $e = Object.getOwnPropertyDescriptor, Mt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? $e(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && xe(t, i, a), a;
};
let at = class extends y {
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
        const a = s.attributes.friendly_name || i.replace("zone.", ""), r = s.attributes.icon || "mdi:map-marker";
        e.push({ id: a.toLowerCase(), name: a, icon: r });
      }
    return e;
  }
  render() {
    const e = this._store.state.context, t = this._store.state.meta, i = (e == null ? void 0 : e.location) || null, s = (e == null ? void 0 : e.contexts) || [], a = this._getMergedLocations(), r = (t == null ? void 0 : t.contexts) || [];
    return n`
      <div class="context-bar">
        <span class="section-label">Where</span>
        ${a.map(
      (o) => n`
            <button
              class="mush-chip ${i === o.id ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._setLocation(i === o.id ? null : o.id)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${o.icon}></ha-icon>
              </span>
              ${o.name}
            </button>
          `
    )}
        <span class="section-label">Doing</span>
        ${r.map(
      (o) => n`
            <button
              class="mush-chip ${s.includes(o.id) ? "mush-chip--filled" : "mush-chip--state"}"
              style="--rgb-state: var(--rgb-primary-color)"
              @click=${() => this._toggleContext(o.id, s)}
            >
              <span class="mush-chip__icon">
                <ha-icon icon=${o.icon}></ha-icon>
              </span>
              ${o.name}
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
at.styles = [
  L,
  k`
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
Mt([
  x({ attribute: !1 })
], at.prototype, "hass", 2);
at = Mt([
  C("yahatl-context-bar")
], at);
var we = Object.defineProperty, ke = Object.getOwnPropertyDescriptor, Rt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? ke(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && we(t, i, a), a;
};
let rt = class extends y {
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
rt.styles = [
  L,
  k`
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
Rt([
  x({ attribute: !1 })
], rt.prototype, "hass", 2);
rt = Rt([
  C("yahatl-stats-card")
], rt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-stats-card",
  name: "Yahatl Stats",
  description: "Mushroom-style stat tiles: overdue, today, blocked, ready"
});
var Ce = Object.defineProperty, Ae = Object.getOwnPropertyDescriptor, J = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Ae(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && Ce(t, i, a), a;
};
let N = class extends y {
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
N.styles = [
  L,
  k`
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
J([
  x({ attribute: !1 })
], N.prototype, "hass", 2);
J([
  x()
], N.prototype, "entityId", 2);
J([
  g()
], N.prototype, "_value", 2);
J([
  g()
], N.prototype, "_busy", 2);
N = J([
  C("yahatl-quick-add")
], N);
var Se = Object.defineProperty, Te = Object.getOwnPropertyDescriptor, nt = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Te(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && Se(t, i, a), a;
};
let B = class extends y {
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
    const i = Math.min(this._currentIdx, t - 1), s = e[i], a = bt(s.item.traits), r = a ? K[a] : "var(--rgb-primary-color)", o = a ? H[a] : "mdi:tray-full";
    return n`
      <ha-card>
        <div class="inbox-header">
          <span class="inbox-header__title">Inbox</span>
          <span class="inbox-count">${i + 1} of ${t}</span>
        </div>

        <div class="inbox-item">
          <div class="inbox-title-row">
            <div class="mush-shape-icon" style="--rgb-state: ${r}">
              <ha-icon icon=${o}></ha-icon>
            </div>
            <div class="inbox-title">${s.item.title}</div>
          </div>
          ${s.item.tags.length > 0 ? n`
                <div class="inbox-tags">
                  ${s.item.tags.map(
      (l) => n`<span class="tag-chip">#${l}</span>`
    )}
                </div>
              ` : h}
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
            ` : h}
      </ha-card>
    `;
  }
  _openEditor(e, t) {
    yt(this, { entityId: e, itemId: t, hass: this.hass });
  }
  async _markDone(e, t) {
    await u.saveItem(e, t, { needs_detail: !1 }), await this._loadInbox();
  }
  getCardSize() {
    return 3;
  }
};
B.styles = [
  L,
  k`
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
nt([
  x({ attribute: !1 })
], B.prototype, "hass", 2);
nt([
  g()
], B.prototype, "_config", 2);
nt([
  g()
], B.prototype, "_currentIdx", 2);
B = nt([
  C("yahatl-inbox-card")
], B);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-inbox-card",
  name: "Yahatl Inbox",
  description: "Triage items that need more detail"
});
var Ee = Object.defineProperty, Ie = Object.getOwnPropertyDescriptor, $ = (e, t, i, s) => {
  for (var a = s > 1 ? void 0 : s ? Ie(t, i) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (a = (s ? o(t, i, a) : o(a)) || a);
  return s && a && Ee(t, i, a), a;
};
let f = class extends y {
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
          ${i.map((r, o) => this._renderContextRow(r, o, i.length))}
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
          ${t.length === 0 ? n`<div class="empty-state" style="padding: 12px 16px">No tags in use</div>` : t.map((r) => this._renderTagRow(r))}
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
              ` : h}
          ${s.map((r, o) => this._renderLocationRow(r, o, s.length))}
          ${this._editingLocation === "__new__" ? this._renderLocationEditor(null) : n`
                <button class="add-btn" @click=${() => this._startNewLocation()}>
                  <ha-icon icon="mdi:plus"></ha-icon>
                  Add location
                </button>
              `}
        </div>

        <!-- Confirm delete bar -->
        ${this._confirmDelete ? this._renderConfirmBar() : h}
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
              </button>` : h}
          ${t < i - 1 ? n`<button class="icon-btn" @click=${() => this._moveContext(t, 1)} title="Move down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>` : h}
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
              </button>` : h}
          ${t < i - 1 ? n`<button class="icon-btn" @click=${() => this._moveLocation(t, 1)} title="Move down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>` : h}
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
    const s = (e == null ? void 0 : e.id) || i.toLowerCase().replace(/\s+/g, "_"), a = this._editIcon || "mdi:label", r = {};
    let o;
    e ? (e.id !== s && (r[e.id] = s), o = t.contexts.map(
      (l) => l.id === e.id ? { id: e.id, name: i, icon: a } : l
    )) : o = [...t.contexts, { id: s, name: i, icon: a }], await u.saveMeta({ ...t, contexts: o }, r), this._editingContext = null;
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
    let r;
    e ? r = t.locations.map(
      (o) => o.id === e.id ? { id: e.id, name: i, icon: a } : o
    ) : r = [...t.locations, { id: s, name: i, icon: a }], await u.saveMeta({ ...t, locations: r }), this._editingLocation = null;
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
        const a = s.attributes.friendly_name || i.replace("zone.", ""), r = s.attributes.icon || "mdi:map-marker";
        e.push({ id: a.toLowerCase(), name: a, icon: r });
      }
    return e;
  }
  getCardSize() {
    return 6;
  }
};
f.styles = [
  L,
  k`
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
], f.prototype, "hass", 2);
$([
  g()
], f.prototype, "_editingContext", 2);
$([
  g()
], f.prototype, "_editName", 2);
$([
  g()
], f.prototype, "_editIcon", 2);
$([
  g()
], f.prototype, "_editingLocation", 2);
$([
  g()
], f.prototype, "_editLocName", 2);
$([
  g()
], f.prototype, "_editLocIcon", 2);
$([
  g()
], f.prototype, "_renamingTag", 2);
$([
  g()
], f.prototype, "_renameValue", 2);
$([
  g()
], f.prototype, "_confirmDelete", 2);
f = $([
  C("yahatl-manage-card")
], f);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "yahatl-manage-card",
  name: "Yahatl Manage",
  description: "Manage contexts, tags, and locations for yahatl"
});
export {
  at as YahtlContextBar,
  B as YahtlInboxCard,
  _ as YahtlItemEditor,
  z as YahtlListCard,
  f as YahtlManageCard,
  v as YahtlQueueCard,
  N as YahtlQuickAdd,
  rt as YahtlStatsCard
};
