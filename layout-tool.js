(() => {
 'use strict';
 const pageScope = page => '#exhibit[data-page="' + page + '"]';
 const scenes = {
  intro: [
   ['intro-art', '首页拼贴', pageScope('intro')+' .book-art']
  ],
  p1: [
   ['wall-sort', '排序工具栏', pageScope('wall') + ' > main > .wall-tools'],
   ['wall-grid', '整面小票墙', pageScope('wall') + ' > main > .tickets'],
   ...Array.from({length:30}, (_, i) => {
    const id = String(i + 1).padStart(2, '0');
    return ['wall-ticket-' + id, '小票 ' + id, pageScope('wall') + ' .tile[data-id="' + id + '"]'];
   })
  ],
  p2: [
   ['pick-back', '返回小票墙', pageScope('pick') + ' > main > .screen-tools'],
   ['pick-layout', '购物篮页 · 整体分栏', '#exhibit .pick'],
   ['pick-receipt', '小票和操作提示', '#exhibit .pick > .receipt-panel'],
   ['pick-basket', '购物篮', '#exhibit .pick .cart-stage'],
   ['pick-actions', '底部操作按钮', '#exhibit .pick .cart-panel > .actions']
  ],
  p3: [
   ['analysis-back', '返回购物篮', pageScope('analysis') + ' > main > .screen-tools'],
   ['analysis-layout', '数据页 · 整体分栏', '#exhibit .analysis'],
   ['analysis-chart', '图表和指标', '#exhibit .analysis .chart-area'],
   ['analysis-receipt', '票面预览', '#exhibit .analysis > .receipt-panel'],
   ['analysis-actions', '揭晓按钮', '#exhibit .analysis-next']
  ],
  p4: [
   ['profile-paper', '整张人格小票', '#personality-receipt'],
   ['profile-composition', '肖像与标题 · 整体排法', '#personality-receipt .personality-hero'],
   ['profile-portrait', '肖像和印章', '#personality-receipt .personality-portrait'],
   ['profile-name', '人格名称', '#personality-title'],
   ['profile-footer', '页尾链接', '#personality-receipt .personality-foot']
  ]
 };
 const targets = new Map(Object.values(scenes).flat().map(([id, label, selector]) => [id, {label, selector}]));
 const defaults = {x:0, y:0, size:100, width:null, height:null, gap:null, columns:null, split:null,
  font:null, leading:null, tracking:null, composition:0};
 const channel = 'food-decode-layout';
 const storageKey = 'food-decode-layout-draft-v1';
 const limits = {x:[-1800,1800], y:[-900,900], size:[25,250], width:[1,1800], height:[1,900],
  gap:[0,180], columns:[3,10], split:[160,700], font:[6,160], leading:[6,200], tracking:[-10,30], composition:[0,2]};
 const textRoots = {intro:pageScope('intro'),p1:pageScope('wall'),p2:pageScope('pick'),p3:pageScope('analysis'),p4:'#personality-receipt'};
 const pathAttributes = {chart:'data-layout-chart', id:'id', idkey:'data-id', item:'data-i', action:'data-act', mode:'data-mode'};
 const gaps = new Set(['wall-grid','pick-layout','pick-actions','analysis-layout','profile-composition']);
 const splitLayouts = new Set(['pick-layout','analysis-layout']);

 function isText(id) {return typeof id === 'string' && id.startsWith('text:');}
 function selectorFor(id) {
  if (targets.has(id)) return targets.get(id).selector;
  if (!isText(id) || id.length > 900) return null;
  const partsOfId = id.split(':');
  const [,scene,path] = partsOfId;
  if (partsOfId.length !== 3 || !Object.hasOwn(textRoots,scene) || !path) return null;
  const parts = [];
  for (const step of path.split('/')) {
   const match = /^([a-z][a-z0-9-]*)~(n|id|idkey|item|action|mode|chart)~([a-zA-Z0-9_-]+)$/.exec(step);
   if (!match) return null;
   const [,tag,kind,value] = match;
   if (kind === 'n') {
    if (!/^[1-9][0-9]*$/.test(value)) return null;
    parts.push(tag + ':nth-of-type(' + value + ')');
   } else {
    parts.push(tag + '[' + pathAttributes[kind] + '="' + value + '"]');
   }
  }
  return textRoots[scene] + ' > ' + parts.join(' > ');
 }
 function availableFields(id) {
  if (!id) return [];
  const fields = ['x','y','size'];
  if (isText(id)) return [...fields,'font','leading','tracking'];
  fields.push('width');
  if (id !== 'pick-basket') fields.push('height');
  if (gaps.has(id)) fields.push('gap');
  if (id === 'wall-grid') fields.push('columns');
  if (splitLayouts.has(id)) fields.push('split');
  if (id === 'profile-composition') fields.push('composition');
  return fields;
 }

 function normalizeValue(name, value) {
  if (!Number.isFinite(value)) return defaults[name];
  const [min,max] = limits[name];
  const precision = name === 'tracking' ? 10 : 1;
  return Math.max(min, Math.min(max, Math.round(value * precision) / precision));
 }
 function clean(layout) {
  const result = {};
  for (const [id,values] of Object.entries(layout ?? {})) {
   if (!values || !selectorFor(id)) continue;
   const item = Object.fromEntries(availableFields(id)
    .map(name => [name, normalizeValue(name,values[name])])
    .filter(([name,value]) => value !== defaults[name]));
   if (Object.keys(item).length) result[id] = item;
  }
  return result;
 }
 function css(layout) {
  const rules = [];
  const rule = (selector, declarations) => rules.push(selector + ' { ' + declarations.join('; ') + '; }');
  for (const [id,item] of Object.entries(layout)) {
   const selector = selectorFor(id);
   if (!selector) continue;
   const declarations = [];
   const {x,y,size} = {...defaults,...item};
   if (x || y || size !== 100) {
    const base = id === 'profile-paper' ? 'translateX(-50%) scale(var(--stage-scale)) ' : '';
    declarations.push('transform: ' + base + 'translate(' + x + 'px, ' + y + 'px) scale(' + size / 100 + ')');
    const leaf = id.split('/').at(-1).split('~')[0];
    if (isText(id) && /^(span|small|em|strong|i|b|a)$/.test(leaf)) declarations.push('display: inline-block');
   }
   const lengths = {width:'width', height:'height', gap:'gap', font:'font-size', leading:'line-height', tracking:'letter-spacing'};
   for (const [name,property] of Object.entries(lengths)) {
    if (item[name] != null && !(id === 'profile-paper' && name === 'height')) declarations.push(property + ': ' + item[name] + 'px');
   }
   if (item.width != null && id === 'pick-basket') declarations.push('max-width: none');
   if (item.split != null) declarations.push('grid-template-columns: ' + item.split + 'px minmax(0, 1fr)');
   if (id === 'profile-composition' && (item.composition || item.gap != null)) {
    declarations.push('display: grid', 'align-items: center');
    if (item.composition) declarations.push('grid-template-columns: repeat(2, minmax(0, 1fr))', 'text-align: left');
   }
   if (id === 'wall-grid' && (item.columns || item.gap != null || item.height)) {
    const columns = item.columns ?? 6;
    declarations.push('grid-template-columns: repeat(' + columns + ', minmax(0, 1fr))',
     'grid-template-rows: repeat(' + Math.ceil(30/columns) + ', minmax(0, 1fr))');
    if (!item.height) declarations.push('height: 592px');
    rule(selector+' > .tile', ['grid-template-rows: minmax(0, 1fr) 24px']);
    rule(selector+' > .tile .mount', ['height: 100%', 'min-height: 0']);
    rule(selector+' > .tile .mount img', ['height: min(84px, calc(100% - 4px))']);
   }
   if (/^wall-ticket-/.test(id) && item.height) {
    declarations.push('grid-template-rows: minmax(0, 1fr) 24px');
    rule(selector+' .mount', ['height: 100%', 'min-height: 0']);
    rule(selector+' .mount img', ['height: min(84px, calc(100% - 4px))']);
   }
   if (id === 'profile-paper' && item.height) {
    rule(selector+' > .personality-paper', ['height: '+item.height+'px','min-height: 0','max-height: none']);
   }
   if (id === 'profile-composition' && item.composition) {
    rule(selector+' > .personality-portrait', ['grid-row: 1','grid-column: '+item.composition]);
    rule(selector+' > .personality-portrait img', ['max-width: 100%','height: 212px']);
    rule(selector+' > .personality-portrait::before', ['width: 82%','height: auto','aspect-ratio: 1','transform: none']);
    rule(selector+' > .personality-portrait > .personality-stamp', ['right: 1%','bottom: 8%','min-width: 58px','min-height: 46px']);
    rule(selector+' > .personality-title-copy', ['grid-row: 1','grid-column: '+(3-item.composition)]);
   }
   if (declarations.length) rule(selector,declarations);
  }
  return rules.join('\n');
 }
 function send(recipient, type, payload = {}) {
  recipient.postMessage({channel,type,...payload}, '*');
 }
 function readBaseline() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--food-decode-layout').trim();
  try { return clean(JSON.parse(value.slice(1, -1))); } catch { return {}; }
 }
 function directText(node) {
  if (!(node instanceof HTMLElement) || node.matches('option, script, style, template')) return '';
  if (node.matches('select')) return node.selectedOptions[0]?.textContent.trim() ?? '';
  return [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE)
   .map(child => child.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g,' ');
 }
 function textKey(scene, node) {
  const scope = textRoots[scene];
  const root = scope && document.querySelector(scope);
  if (!root?.contains(node) || node.closest('.paper-transition,.book-transition,.basket-handoff')) return null;
  const steps = [];
  for (let el = node; el !== root; el = el.parentElement) {
   const tag = el.localName;
   const siblings = [...el.parentElement.children].filter(sibling => sibling.localName === tag);
   const attribute = Object.entries(pathAttributes).find(([,name]) => {
    const value = el.getAttribute(name);
    return value && /^[a-zA-Z0-9_-]+$/.test(value) && siblings.filter(sibling => sibling.getAttribute(name) === value).length === 1;
   });
   const token = attribute ? attribute[0]+'~'+el.getAttribute(attribute[1]) : 'n~'+(siblings.indexOf(el)+1);
   steps.unshift(tag+'~'+token);
  }
  const id = 'text:'+scene+':'+steps.join('/');
  return selectorFor(id) ? id : null;
 }
 function textOption(scene,node) {
  const text = directText(node);
  if (!text) return null;
  const id = textKey(scene,node);
  if (!id) return null;
  const role = node.matches('button,summary') ? '按钮 · ' : /^H[1-6]$/.test(node.tagName) ? '标题 · ' : '';
  const tile = node.closest('.tile[data-id]');
  return [id,role+(tile ? tile.dataset.id+' 号 · ' : '')+(text.length>48 ? text.slice(0,47)+'…' : text)];
 }

 function setupEditor(frame) {
  const chooser = document.querySelector('#layout-target');
  const sceneButtons = [...document.querySelectorAll('[data-layout-scene]')];
  const fields = Object.fromEntries(Object.keys(defaults).map(name => [name, document.querySelector('#layout-' + name)]));
  const modeButtons = [...document.querySelectorAll('[name="layout-mode"]')];
  const hint = document.querySelector('#layout-hint');
  const reset = document.querySelector('#layout-reset-item');
  const download = document.querySelector('#layout-export');
  const status = document.querySelector('#layout-status');
  const selectedByScene = {};
  let scene = '';
  let mode = 'block';
  let textTargets = [];
  let draft = null;
  let saveTimer;
  let storageAvailable = true;
  try {
   const saved = localStorage.getItem(storageKey);
   if (saved !== null) draft = clean(JSON.parse(saved));
  } catch { storageAvailable = false; }

  function saveDraft() {
   if (!storageAvailable || draft === null) return;
   try { localStorage.setItem(storageKey, JSON.stringify(draft)); }
   catch { storageAvailable = false; }
  }
  function targetKey() {return scene + ':' + mode;}
  function rebuildOptions(preferred = selectedByScene[targetKey()]) {
   const entries = mode === 'text' ? textTargets : mode === 'block' ? scenes[scene] || [] : [];
   chooser.replaceChildren(...entries.map(([id,label]) => new Option(label,id)));
   if (entries.some(([id]) => id === preferred)) chooser.value = preferred;
   chooser.disabled = reset.disabled = entries.length === 0;
   hint.textContent = mode === 'text' ? '点画面里的文字，或从列表选择。清空数值可用原字号。'
    :mode === 'block' ? '选中区块后可拖动。整页分栏、列数和间距在对应的容器里设置。'
    :'可以正常点小票、切换图表和展开档案。';
   syncFields();
  }
  function setScene(current) {
   if (scene !== current) textTargets = [];
   scene = current;
   sceneButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.layoutScene === scene));
   rebuildOptions();
  }
  function syncFields() {
   const values = {...defaults,...draft?.[chooser.value]};
   const available = availableFields(chooser.value);
   for (const [name,input] of Object.entries(fields)) {
    const canEdit = available.includes(name);
    input.closest('label').hidden = !canEdit;
    input.disabled = !canEdit || draft === null;
    input.value = values[name] ?? '';
   }
  }
  function syncPreview() {
   send(frame.contentWindow, 'update', {layout:draft ?? {}, selected:chooser.value, mode});
  }
  function updateItem(id, values, sendToPreview) {
   draft = clean({...draft, [id]:values});
   clearTimeout(saveTimer);
   saveTimer = setTimeout(saveDraft, 180);
   status.textContent = storageAvailable ? '预览已更新，草稿留在本机。' : '预览已更新，关闭前请导出。';
   if (sendToPreview) syncPreview();
  }

  window.addEventListener('message', event => {
   if (event.source !== frame.contentWindow || event.data?.channel !== channel) return;
   const data = event.data;
   if (data.type === 'ready') {
    draft ??= clean(data.baseline);
    download.disabled = false;
    setScene(data.scene);
    syncFields();
    syncPreview();
   } else if (data.type === 'scene') {
    setScene(data.scene);
    syncPreview();
   } else if (data.type === 'text-targets' && mode === 'text' && data.scene === scene) {
    const previous = chooser.value;
    textTargets = data.entries;
    rebuildOptions(previous || selectedByScene[targetKey()]);
    if (previous !== chooser.value) syncPreview();
   } else if (data.type === 'select-text' && mode === 'text' && data.scene === scene) {
    if (!textTargets.some(([id]) => id === data.id)) textTargets = [...textTargets,[data.id,data.label]];
    selectedByScene[targetKey()] = data.id;
    rebuildOptions(data.id);
    syncPreview();
   } else if (data.type === 'drag' && data.id === chooser.value) {
    updateItem(data.id, data.values, false);
    syncFields();
   }
  });
  window.addEventListener('pagehide', saveDraft);
  for (const button of sceneButtons) {
   button.addEventListener('click', () => send(frame.contentWindow, 'navigate', {scene:button.dataset.layoutScene}));
  }
  chooser.addEventListener('change', () => {
   selectedByScene[targetKey()] = chooser.value;
   syncFields();
   syncPreview();
  });
  modeButtons.forEach(button => button.addEventListener('change', () => {
   mode = button.value;
   rebuildOptions();
   syncPreview();
  }));
  for (const [name,input] of Object.entries(fields)) {
   const applyField = allowEmpty => {
    if (!chooser.value || input.disabled) return;
    const value = input.type === 'select-one' ? Number(input.value) : input.valueAsNumber;
    if (input.value === '' && !allowEmpty) return;
    updateItem(chooser.value, {...draft[chooser.value],[name]:Number.isFinite(value) ? value : defaults[name]}, true);
   };
   input.addEventListener('input', () => applyField(false));
   input.addEventListener('change', () => {
    applyField(true);
    syncFields();
   });
  }
  reset.addEventListener('click', () => {
   if (!chooser.value) return;
   updateItem(chooser.value, defaults, true);
   syncFields();
  });
  download.disabled = true;
  download.addEventListener('click', () => {
   const contents = '/* 小票解码排版编辑器导出 */\n:root { --food-decode-layout: \'' + JSON.stringify(draft) + '\'; }\n' + css(draft) + '\n';
   const url = URL.createObjectURL(new Blob([contents], {type:'text/css;charset=utf-8'}));
   const link = document.createElement('a');
   link.href = url;
   link.download = 'layout-overrides.css';
   link.click();
   setTimeout(() => URL.revokeObjectURL(url), 2000);
   status.textContent = '已导出。替换网页目录里的同名文件即可应用。';
  });
  setScene('');
  frame.addEventListener('load', () => send(frame.contentWindow, 'hello'));
  send(frame.contentWindow, 'hello');
 }

 function setupPreview() {
  const baseline = readBaseline();
  document.querySelector('link[href="layout-overrides.css"]').disabled = true;
  const overrides = document.createElement('style');
  const editorStyle = document.createElement('style');
  editorStyle.textContent = '.layout-selected{outline:2px dashed #a64f1c;outline-offset:4px;cursor:move!important;touch-action:none} .layout-selected *{cursor:move!important} .layout-text-mode{cursor:crosshair}';
  document.head.append(overrides,editorStyle);
  let layout = baseline;
  let selectedId = '';
  let mode = 'preview';
  let selectedNode = null;
  let lastScene = '';
  let drag = null;
  let catalogFrame = 0;
  let latestCatalog = '';
  const currentScene = () => personalityReceipt.open ? 'p4' : ({intro:'intro',wall:'p1',pick:'p2',analysis:'p3'})[page] ?? '';
  const announce = () => send(parent, 'ready', {baseline,scene:currentScene()});

  function refreshSelection() {
   const scene = currentScene();
   const known = mode === 'text' ? selectedId.startsWith('text:'+scene+':')
    :mode === 'block' && scenes[scene]?.some(([id]) => id === selectedId);
   const selector = known && selectorFor(selectedId);
   const next = selector ? document.querySelector(selector) : null;
   if (next !== selectedNode) {
    selectedNode?.classList.remove('layout-selected');
    next?.classList.add('layout-selected');
    selectedNode = next;
   }
   if (scene !== lastScene) {
    lastScene = scene;
    send(parent, 'scene', {scene});
   }
  }
  function publishTextTargets() {
   if (mode !== 'text' || catalogFrame) return;
   catalogFrame = requestAnimationFrame(() => {
    catalogFrame = 0;
    if (mode !== 'text') return;
    const scene = currentScene();
    const scope = textRoots[scene];
    const root = scope && document.querySelector(scope);
    const entries = root ? [...root.querySelectorAll('*')]
     .filter(node => directText(node) && node.getClientRects().length && getComputedStyle(node).visibility === 'visible')
     .map(node => textOption(scene,node)).filter(Boolean) : [];
    const signature = JSON.stringify([scene,entries]);
    if (signature !== latestCatalog) {
     latestCatalog = signature;
     send(parent,'text-targets',{scene,entries});
    }
   });
  }
  window.addEventListener('message', event => {
   if (event.source !== parent || event.data?.channel !== channel) return;
   const data = event.data;
   if (data.type === 'hello') {
    announce();
   } else if (data.type === 'update') {
    layout = clean(data.layout);
    selectedId = selectorFor(data.selected) ? data.selected : '';
    if (mode !== data.mode) latestCatalog = '';
    mode = data.mode;
    exhibit.classList.toggle('layout-text-mode',mode === 'text');
    overrides.textContent = css(layout);
    refreshSelection();
    publishTextTargets();
   } else if (data.type === 'navigate' && scenes[data.scene]) {
    if (data.scene === currentScene()) return;
    const destination = ({intro:'intro',p1:'wall',p2:'pick',p3:'analysis',p4:'analysis'})[data.scene];
    if (!ticket && ['pick','analysis'].includes(destination)) select('12',destination);
    else go(destination,{focus:false});
    if (data.scene === 'p4') openPersonalityReceipt();
    refreshSelection();
   }
  });
  new MutationObserver(() => {refreshSelection();publishTextTargets();}).observe(exhibit,{
   subtree:true,childList:true,attributes:true,attributeFilter:['data-page','open']
  });
  document.addEventListener('pointerdown', event => {
   if (event.button !== 0 || mode === 'preview') return;
   if (mode === 'text') {
    const scene = currentScene();
    const scope = textRoots[scene];
    const root = scope && document.querySelector(scope);
    if (!root?.contains(event.target)) return;
    for (let node = event.target; node && node !== root; node = node.parentElement) {
     const entry = textOption(scene,node);
     if (!entry) continue;
     const [id,label] = entry;
     if (id !== selectedId) {
      selectedId = id;
      refreshSelection();
      send(parent,'select-text',{scene,id,label});
     }
     break;
    }
   }
   if (!selectedNode?.contains(event.target)) return;
   const item = {...defaults,...layout[selectedId]};
   const box = selectedNode.getBoundingClientRect();
   const pixels = box.width / selectedNode.offsetWidth / (item.size / 100);
   if (!Number.isFinite(pixels) || pixels <= 0) return;
   drag = {id:selectedId, pointer:event.pointerId, x:event.clientX, y:event.clientY, item, pixels};
   selectedNode.setPointerCapture(event.pointerId);
   event.preventDefault();
   event.stopPropagation();
  },true);
  document.addEventListener('pointermove', event => {
   if (!drag || drag.pointer !== event.pointerId) return;
   const {id,item,pixels} = drag;
   const values = {...item,
    x:normalizeValue('x',item.x+(event.clientX-drag.x)/pixels),
    y:normalizeValue('y',item.y+(event.clientY-drag.y)/pixels)
   };
   layout = clean({...layout,[id]:values});
   overrides.textContent = css(layout);
   send(parent,'drag',{id,values});
   event.stopPropagation();
  },true);
  function finishDrag(event) {
   if (drag?.pointer === event.pointerId) drag = null;
  }
  document.addEventListener('pointerup',finishDrag,true);
  document.addEventListener('pointercancel',finishDrag,true);
  document.addEventListener('lostpointercapture',finishDrag,true);
  document.addEventListener('click', event => {
   if (event.detail && (mode === 'text' || selectedNode?.contains(event.target))) {
    event.preventDefault();
    event.stopPropagation();
   }
  },true);
  announce();
 }

 const frame = document.querySelector('#layout-preview');
 const query = new URLSearchParams(location.search);
 const isPreview = parent !== window && query.get('layout') === '1';
 if (frame) {
  setupEditor(frame);
  const width = query.get('stage') || '1440';
  frame.src = 'index.html?layout=1&stage=' + encodeURIComponent(width);
 } else if (isPreview) {
  setupPreview();
 } else {
  const launcher = document.querySelector('.layout-launcher');
  if (launcher) launcher.hidden = false;
 }
})();
