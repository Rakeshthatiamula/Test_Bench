// ---------- helpers ----------
const byId = (id) => TESTS.find(t => t.id === id);

function typeBadge(type){
  if(type === 'parametric') return '<span class="type-badge param">Parametric</span>';
  if(type === 'nonparametric') return '<span class="type-badge nonparam">Non-parametric</span>';
  return '<span class="type-badge gatekeeper">Assumption check</span>';
}

function flagClass(type){
  if(type === 'parametric') return 'param';
  if(type === 'nonparametric') return 'nonparam';
  return 'gatekeeper';
}

// ---------- render test cards ----------
function renderCards(filter){
  const grid = document.getElementById('cardGrid');
  grid.innerHTML = '';
  const list = filter === 'all' ? TESTS : TESTS.filter(t => t.type === filter);
  list.forEach(t => {
    const card = document.createElement('div');
    card.className = 'test-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Open details for ' + t.name);
    card.dataset.id = t.id;
    card.innerHTML = `
      <div class="type-flag ${flagClass(t.type)}"></div>
      <div class="cat-tag">${t.category}</div>
      <h3>${t.name}</h3>
      <div class="oneliner">${t.oneLiner}</div>
      <div class="card-footer">
        ${typeBadge(t.type)}
        <span class="arrow-icon">↳ open</span>
      </div>
    `;
    card.addEventListener('click', () => openDrawer(t.id));
    card.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openDrawer(t.id); } });
    grid.appendChild(card);
  });
}

document.getElementById('filterRow').addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if(!chip) return;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  renderCards(chip.dataset.filter);
});

renderCards('all');

// ---------- drawer ----------
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerContent = document.getElementById('drawerContent');

function openDrawer(id){
  const t = byId(id);
  if(!t) return;

  document.querySelectorAll('.fnode.test-node').forEach(n => n.classList.remove('selected'));
  const activeNode = document.querySelector(`.fnode.test-node[data-id="${id}"]`);
  if(activeNode) activeNode.classList.add('selected');

  const related = t.related ? byId(t.related) : null;

  drawerContent.innerHTML = `
    <div class="drawer-header">
      <div class="cat-tag">${t.category}</div>
      <h2 id="drawerTitle">${t.name}</h2>
      <div class="drawer-badges">${typeBadge(t.type)}</div>
      <p class="drawer-oneliner">${t.oneLiner}</p>
    </div>

    <div class="drawer-section">
      <h4>Definition</h4>
      <p>${t.definition}</p>
    </div>

    <div class="drawer-section">
      <h4>Hypotheses</h4>
      <div class="hyp-box">
        <div class="hyp-card h0"><span class="h-label">H₀ — Null</span>${t.hypotheses.h0}</div>
        <div class="hyp-card h1"><span class="h-label">H₁ — Alternative</span>${t.hypotheses.h1}</div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>How the statistic works</h4>
      <div class="stat-idea">${t.statisticIdea}</div>
    </div>

    <div class="drawer-section">
      <h4>Assumptions</h4>
      <ul class="assump-list">
        ${t.assumptions.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>

    <div class="drawer-section">
      <h4>When to use it</h4>
      <p>${t.whenToUse}</p>
    </div>

    <div class="drawer-section">
      <h4>Worked example — from an ML workflow</h4>
      <div class="example-box">
        <div class="ex-row"><span class="ex-label">Scenario</span>${t.mlExample.scenario}</div>
        <div class="ex-row"><span class="ex-label">Test run</span>${t.mlExample.data}</div>
        <div class="ex-row conclusion"><span class="ex-label">Conclusion</span>${t.mlExample.conclusion}</div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Trade-offs</h4>
      <div class="pc-grid">
        <div class="pc-col pros">
          <h5>+ Strengths</h5>
          <ul>${t.prosCons.pros.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="pc-col cons">
          <h5>− Watch out for</h5>
          <ul>${t.prosCons.cons.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
      </div>
    </div>

    ${related ? `
    <div class="drawer-section">
      <h4>Related test</h4>
      <a class="related-link" data-id="${related.id}">
        <div class="rl-text">
          <span class="rl-label">${t.relatedLabel}</span>
          <strong>${related.name}</strong>
        </div>
        <span class="arrow-icon">↳</span>
      </a>
    </div>` : ''}
  `;

  const relatedLink = drawerContent.querySelector('.related-link');
  if(relatedLink){
    relatedLink.addEventListener('click', () => openDrawer(relatedLink.dataset.id));
  }

  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  drawer.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeDrawer(){
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  document.body.style.overflow = '';
  document.querySelectorAll('.fnode.test-node').forEach(n => n.classList.remove('selected'));
}

document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeDrawer(); });

// ---------- rules table ----------
const RULES = [
  ["One sample vs. a fixed value (known population SD)", "One-Sample Z-Test", "—"],
  ["One sample vs. a fixed value (SD unknown — the common case)", "One-Sample t-test", "Wilcoxon Signed-Rank (1-sample)"],
  ["One sample, categorical data vs. expected proportions", "—", "Chi-Square Test"],
  ["Compare means of 2 independent groups (SD unknown)", "Independent Samples t-test", "Mann-Whitney U test"],
  ["Compare means of 2 independent groups (SD known)", "Two-Sample Z-Test", "—"],
  ["Compare 2 paired / related continuous samples", "Paired t-test", "Wilcoxon Signed-Rank Test"],
  ["Compare 2 paired / related binary outcomes", "—", "McNemar's Test"],
  ["Compare 3+ paired / related samples (repeated measures)", "—", "Friedman Test"],
  ["Compare means across 3+ independent groups (equal variance)", "One-Way ANOVA", "Kruskal-Wallis H Test"],
  ["Compare means across 3+ independent groups (unequal variance)", "Welch's ANOVA", "Kruskal-Wallis H Test"],
  ["Compare groups across 2 categorical factors at once", "Two-Way ANOVA", "—"],
  ["Association between 2 categorical variables (cells ≥ 5)", "—", "Chi-Square Test"],
  ["Association between 2 categorical variables (small / sparse)", "—", "Fisher's Exact Test"],
  ["Post-hoc: which groups differ after a significant ANOVA (all pairs)", "Tukey's HSD", "—"],
  ["Post-hoc: which groups differ vs. one control group", "Dunnett's Test", "—"],
  ["Post-hoc: which groups differ after a significant Kruskal-Wallis", "—", "Dunn's Test"],
  ["Relationship between 2 continuous variables", "Pearson Correlation", "Spearman Correlation"],
  ["Compare proportions / conversion rates (A/B testing)", "Two-Proportion Z-Test", "Fisher's Exact Test (rare events)"],
  ["Check if a sample is normally distributed", "—", "Shapiro-Wilk / Kolmogorov-Smirnov"],
  ["Check if groups have equal variance", "Levene's Test", "—"],
  ["Detect feature/data drift between two periods", "—", "Kolmogorov-Smirnov (2-sample)"]
];

const RULE_TEST_MAP = {
  "Pearson Correlation": "pearson", "Spearman Correlation": "spearman",
  "Chi-Square Test": "chisquare", "Fisher's Exact Test": "fisher",
  "Fisher's Exact Test (rare events)": "fisher",
  "Two-Proportion Z-Test": "ztest_prop",
  "Independent Samples t-test": "ttest_ind", "Mann-Whitney U test": "mannwhitney",
  "Paired t-test": "ttest_paired", "Wilcoxon Signed-Rank Test": "wilcoxon",
  "One-Way ANOVA": "anova", "Kruskal-Wallis H Test": "kruskal",
  "Shapiro-Wilk / Kolmogorov-Smirnov": "shapiro",
  "Levene's Test": "levene",
  "Kolmogorov-Smirnov (2-sample)": "ks_one_sample",
  "One-Sample Z-Test": "ztest_one_sample",
  "One-Sample t-test": "ttest_one_sample",
  "Wilcoxon Signed-Rank (1-sample)": "wilcoxon_one_sample",
  "Two-Sample Z-Test": "ztest_two_sample",
  "McNemar's Test": "mcnemar",
  "Friedman Test": "friedman",
  "Welch's ANOVA": "welch_anova",
  "Two-Way ANOVA": "twoway_anova",
  "Tukey's HSD": "tukey_hsd",
  "Dunnett's Test": "dunnett",
  "Dunn's Test": "dunn"
};

function renderRules(){
  const body = document.getElementById('rulesBody');
  body.innerHTML = RULES.map(([situation, p, np]) => `
    <tr>
      <td>${situation}</td>
      <td class="test-name" data-id="${RULE_TEST_MAP[p] || ''}">${p}</td>
      <td class="test-name" data-id="${RULE_TEST_MAP[np] || ''}">${np}</td>
    </tr>
  `).join('');
  body.querySelectorAll('td.test-name').forEach(td => {
    if(td.dataset.id){
      td.style.cursor = 'pointer';
      td.addEventListener('click', () => openDrawer(td.dataset.id));
    }
  });
}
renderRules();

// ---------- flowchart SVG generation ----------
// Programmatic tree layout (no hand-placed coordinates). This guarantees
// zero overlap by construction: every subtree gets an exclusive horizontal
// slot sized to its own content, slots are placed side by side with a fixed
// gap, and a node's children are always centered under that slot.

const LEAF_W = 188, LEAF_H = 58;
const QBOX_W = 200, QBOX_H = 70;
const SIBLING_GAP = 30;
const ROW_HEIGHT = 138;

// ---- 1. Build a unified tree model from FLOWCHART ----
// Every tree node: { id, kind: 'question'|'leaf', label, testId?, children: [{label, node, dashed}] }
function buildTreeModel(){
  const leafCache = {}; // unique leaf-instance-id -> tree node (one per distinct `to` target)

  function makeNode(nodeId){
    const q = FLOWCHART.nodes[nodeId];
    if(q){
      return {
        id: nodeId,
        kind: 'question',
        label: q.label,
        children: q.branches.map(b => ({
          label: b.label,
          dashed: false,
          node: b.testId ? makeLeaf(b.to, b.testId) : makeNode(b.to)
        }))
      };
    }
    // Shouldn't reach here for non-leaf ids; fallback safety.
    return { id: nodeId, kind: 'question', label: nodeId, children: [] };
  }

  function makeLeaf(instanceId, testId){
    if(leafCache[instanceId]) return leafCache[instanceId];
    const node = { id: instanceId, kind: 'leaf', testId, children: [] };
    leafCache[instanceId] = node;
    return node;
  }

  const root = makeNode(FLOWCHART.root);

  // Attach post-hoc continuations onto the relevant leaf nodes.
  (FLOWCHART.postHoc || []).forEach(edge => {
    const leafNode = leafCache[edge.from];
    if(!leafNode) return;
    leafNode.children.push({
      label: edge.label,
      dashed: true,
      node: makeNode(edge.to)
    });
  });

  return root;
}

// ---- 2. Compute subtree width bottom-up ----
function nodeOwnWidth(node){
  return node.kind === 'leaf' ? LEAF_W : QBOX_W;
}

function computeSubtreeWidth(node){
  if(node.children.length === 0){
    node._width = nodeOwnWidth(node);
    return node._width;
  }
  let total = 0;
  node.children.forEach((c, i) => {
    total += computeSubtreeWidth(c.node);
    if(i > 0) total += SIBLING_GAP;
  });
  // A node's slot must be at least as wide as its own box too.
  node._width = Math.max(total, nodeOwnWidth(node));
  node._childrenSpan = total; // span occupied by children only (without own-box widening)
  return node._width;
}

// ---- 3. Assign x/y top-down ----
function assignPositions(node, centerX, depth){
  node._x = centerX;
  node._y = depth * ROW_HEIGHT;
  node._depth = depth;
  if(node.children.length === 0) return;

  const span = node._childrenSpan;
  let cursor = centerX - span / 2;
  node.children.forEach(c => {
    const w = c.node._width;
    const childCenter = cursor + w / 2;
    assignPositions(c.node, childCenter, depth + 1);
    cursor += w + SIBLING_GAP;
  });
}

// ---- 4. Flatten tree into render lists (nodes + edges) ----
function flattenTree(root){
  const nodes = [];
  const edges = [];
  (function walk(node){
    nodes.push(node);
    node.children.forEach(c => {
      edges.push({ from: node, to: c.node, label: c.label, dashed: !!c.dashed });
      walk(c.node);
    });
  })(root);
  return { nodes, edges };
}

function nodeBox(node){
  const w = nodeOwnWidth(node);
  const h = node.kind === 'leaf' ? LEAF_H : QBOX_H;
  return { x: node._x - w/2, y: node._y, w, h };
}

function nodeType(testId){
  const t = byId(testId);
  if(!t) return 'question';
  if(t.type === 'parametric') return 'param';
  if(t.type === 'nonparametric') return 'nonparam';
  return 'gatekeeper';
}

function wrapLines(label){
  return label.split('\n');
}

function buildSvg(){
  const root = buildTreeModel();
  computeSubtreeWidth(root);
  assignPositions(root, root._width / 2, 0);
  const { nodes, edges } = flattenTree(root);

  const svg = document.getElementById('flowSvg');
  let defs = `<defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--rule)"></path>
    </marker>
    <marker id="arrowParam" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--param)"></path>
    </marker>
    <marker id="arrowNonparam" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--nonparam)"></path>
    </marker>
    <marker id="arrowGate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--gate)"></path>
    </marker>
  </defs>`;

  let linksHtml = '';
  let nodesHtml = '';

  // ---- edges ----
  edges.forEach(edge => {
    const fromBox = nodeBox(edge.from);
    const toBox = nodeBox(edge.to);
    const fromBottom = { x: edge.from._x, y: fromBox.y + fromBox.h };
    const toTop = { x: edge.to._x, y: toBox.y };

    let colorClass = '';
    let marker = 'url(#arrow)';
    if(edge.dashed){
      colorClass = 'posthoc';
      marker = 'url(#arrow)';
    } else if(edge.to.kind === 'leaf'){
      const nt = nodeType(edge.to.testId);
      colorClass = nt === 'param' ? 'param' : (nt === 'nonparam' ? 'nonparam' : 'gatekeeper');
      marker = colorClass === 'param' ? 'url(#arrowParam)' : (colorClass === 'nonparam' ? 'url(#arrowNonparam)' : 'url(#arrowGate)');
    }

    const midY = fromBottom.y + (toTop.y - fromBottom.y) * 0.55;
    const path = `M ${fromBottom.x} ${fromBottom.y} C ${fromBottom.x} ${midY}, ${toTop.x} ${midY}, ${toTop.x} ${toTop.y}`;
    linksHtml += `<path class="flink ${colorClass}" d="${path}" marker-end="${marker}"></path>`;

    // edge label at midpoint of the straight line between the two x positions,
    // placed just above the midY bend so it never sits on top of either box.
    const labelText = edge.label.split('\n')[0];
    const lx = (fromBottom.x + toTop.x) / 2;
    const ly = midY;
    const estW = labelText.length * 6.5 + 16;
    const labelCls = edge.dashed ? 'posthoc-label' : colorClass;
    linksHtml += `
      <rect class="flabel-bg" x="${lx - estW/2}" y="${ly-10}" width="${estW}" height="18" rx="3"></rect>
      <text class="flabel ${labelCls}" x="${lx}" y="${ly+2}">${labelText}</text>
    `;
  });

  // ---- nodes ----
  nodes.forEach(node => {
    const box = nodeBox(node);
    const isRoot = node === root;

    if(node.kind === 'question'){
      const lines = wrapLines(node.label);
      nodesHtml += `
        <g class="fnode question ${isRoot ? 'root' : ''}" data-id="${node.id}">
          <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"></rect>
          <text class="node-title" x="${node._x}" y="${box.y + box.h/2 - (lines.length-1)*7}">
            ${lines.map((line,i) => `<tspan x="${node._x}" dy="${i===0?0:14}">${line}</tspan>`).join('')}
          </text>
        </g>
      `;
    } else {
      const t = byId(node.testId);
      const nt = nodeType(node.testId);
      const cls = nt === 'param' ? 'param' : (nt === 'nonparam' ? 'nonparam' : 'gatekeeper');
      nodesHtml += `
        <g class="fnode test-node ${cls}" data-id="${node.testId}" tabindex="0" role="button" aria-label="Open ${t.name}">
          <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"></rect>
          <text class="node-title" x="${node._x}" y="${node._y + box.h/2}">${t.short}</text>
        </g>
      `;
    }
  });

  svg.innerHTML = defs + linksHtml + nodesHtml;

  // ---- dynamic viewBox sized exactly to content ----
  let maxX = 0, maxY = 0, minX = Infinity;
  nodes.forEach(node => {
    const box = nodeBox(node);
    minX = Math.min(minX, box.x);
    maxX = Math.max(maxX, box.x + box.w);
    maxY = Math.max(maxY, box.y + box.h);
  });
  const pad = 24;
  const totalW = (maxX - minX) + pad * 2;
  const totalH = maxY + pad * 2;
  svg.setAttribute('viewBox', `${minX - pad} ${-pad} ${totalW} ${totalH}`);
  svg._baseW = Math.max(1080, totalW);
  svg._baseH = totalH * (svg._baseW / totalW);
  applyFlowZoom();

  // ---- interactivity ----
  svg.querySelectorAll('.fnode.test-node').forEach(g => {
    g.addEventListener('click', () => openDrawer(g.dataset.id));
    g.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openDrawer(g.dataset.id); } });
  });
}

// ---- 5. Zoom controls ----
const FLOW_ZOOM_MIN = 0.5, FLOW_ZOOM_MAX = 2.5, FLOW_ZOOM_STEP = 0.15;
let flowZoom = 1;

function applyFlowZoom(){
  const svg = document.getElementById('flowSvg');
  if(!svg._baseW) return;
  svg.style.width = (svg._baseW * flowZoom) + 'px';
  svg.style.height = (svg._baseH * flowZoom) + 'px';

  const label = document.getElementById('flowZoomLabel');
  if(label) label.textContent = Math.round(flowZoom * 100) + '%';

  const zoomInBtn = document.getElementById('flowZoomIn');
  const zoomOutBtn = document.getElementById('flowZoomOut');
  if(zoomInBtn) zoomInBtn.disabled = flowZoom >= FLOW_ZOOM_MAX - 1e-9;
  if(zoomOutBtn) zoomOutBtn.disabled = flowZoom <= FLOW_ZOOM_MIN + 1e-9;
}

function setFlowZoom(value){
  flowZoom = Math.min(FLOW_ZOOM_MAX, Math.max(FLOW_ZOOM_MIN, value));
  applyFlowZoom();
}

document.getElementById('flowZoomIn').addEventListener('click', () => setFlowZoom(flowZoom + FLOW_ZOOM_STEP));
document.getElementById('flowZoomOut').addEventListener('click', () => setFlowZoom(flowZoom - FLOW_ZOOM_STEP));
document.getElementById('flowZoomReset').addEventListener('click', () => setFlowZoom(1));

buildSvg();
