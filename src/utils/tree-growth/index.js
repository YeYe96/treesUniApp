const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const getCanvasWidth = () => {
  const info = typeof uni !== 'undefined' && uni.getSystemInfoSync ? uni.getSystemInfoSync() : { windowWidth: 375 };
  return info.windowWidth || 375;
};

const hashKey = (key) => {
  const text = `${key}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000;
  }
  return hash;
};

const jitter = (key, amount) => {
  const h = hashKey(key);
  const normalized = h / 1000;
  return (normalized * 2 - 1) * amount;
};

const buildCurve = (from, to, weight = 0) => {
  const vertical = to.y - from.y;
  const baseSag = Math.max(48, vertical * 0.45);
  const sag = baseSag + weight * 14;
  const midY = (from.y + to.y) / 2 + sag;
  const midX = (from.x + to.x) / 2;
  const c1x = from.x + (midX - from.x) * 0.2;
  const c2x = to.x - (to.x - midX) * 0.2;
  return `M ${from.x} ${from.y} C ${c1x} ${midY} ${c2x} ${midY} ${to.x} ${to.y}`;
};

const buildEdge = ({ from, to, key, depth, index, weight }) => {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const duration = clamp(distance * 3.1, 420, 1600);
  const delay = 200 + depth * 260 + index * 120;
  return {
    key,
    d: buildCurve(from, to, weight),
    delay,
    duration
  };
};

const buildGlobalLayout = (roots, width) => {
  const trunkX = width * 0.5;
  const startY = 180;
  const gapY = 160;

  const nodes = (roots || []).map((root, index) => {
    const key = root._id || `root-${index}`;
    const jitterY = jitter(`${key}-y`, 8);
    return {
      ...root,
      key,
      depth: 0,
      x: trunkX,
      y: startY + index * gapY + jitterY,
      delay: 240 + index * 160
    };
  });

  const height = startY + nodes.length * gapY + 220;
  const trunkLength = height - 120 - (startY - 80);

  return {
    nodes,
    edges: [],
    height,
    trunk: {
      x: trunkX,
      y1: startY - 80,
      y2: height - 120,
      delay: 0,
      duration: clamp(trunkLength * 2, 600, 1600)
    }
  };
};

const buildFocusLayout = (root, width) => {
  if (!root) {
    return { nodes: [], edges: [], height: 600, trunk: null };
  }

  const rootX = width * 0.5;
  const rootY = 140;
  const childGapY = 180;
  const sideGap = Math.max(120, width * 0.24);

  const nodes = [];
  const edges = [];
  let maxY = rootY;

  (root.children || []).forEach((child, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const weight = child.children ? child.children.length : 0;

    const key = child._id || `child-${index}`;
    const baseX = rootX + side * (sideGap + row * 42);
    const baseY = rootY + childGapY + row * 90 + weight * 18;
    const x = baseX + jitter(`${key}-x`, 10);
    const y = baseY + jitter(`${key}-y`, 12);

    const edge = buildEdge({
      from: { x: rootX, y: rootY },
      to: { x, y },
      key: `edge-root-${index}`,
      depth: 1,
      index,
      weight
    });
    edges.push(edge);

    nodes.push({
      ...child,
      key,
      depth: 1,
      x,
      y,
      delay: edge.delay + edge.duration * 0.7
    });

    maxY = Math.max(maxY, y);

    (child.children || []).forEach((leaf, leafIndex) => {
      const leafKey = leaf._id || `leaf-${index}-${leafIndex}`;
      const baseLx = x + side * (92 + leafIndex * 28);
      const baseLy = y + childGapY * 0.78 + leafIndex * 36;
      const lx = baseLx + jitter(`${leafKey}-x`, 8);
      const ly = baseLy + jitter(`${leafKey}-y`, 10);

      const leafEdge = buildEdge({
        from: { x, y },
        to: { x: lx, y: ly },
        key: `edge-${index}-${leafIndex}`,
        depth: 2,
        index: leafIndex,
        weight: 1
      });
      edges.push(leafEdge);

      nodes.push({
        ...leaf,
        key: leafKey,
        depth: 2,
        x: lx,
        y: ly,
        delay: leafEdge.delay + leafEdge.duration * 0.7
      });

      maxY = Math.max(maxY, ly);
    });
  });

  return {
    nodes,
    edges,
    height: maxY + 240,
    trunk: null
  };
};

export const buildTreeLayout = ({ mode, roots, focus, width }) => {
  return mode === 'FOCUS' ? buildFocusLayout(focus || (roots || [])[0], width) : buildGlobalLayout(roots || [], width);
};
