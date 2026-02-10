export const normalizeDeskTree = (result) => {
  const data = (result && result.data) || {};
  const tree = Array.isArray(data.tree) ? data.tree : [];
  const roots = Array.isArray(data.roots) ? data.roots : [];

  return {
    tree: tree.length > 0 ? tree : roots,
    roots: roots.length > 0 ? roots : tree
  };
};

export const callCloudFunction = async (name, data = {}) => {
  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    throw new Error('云能力未初始化');
  }
  const res = await wx.cloud.callFunction({ name, data });
  if (!res || !res.result) {
    throw new Error('云函数返回异常');
  }
  return res.result;
  // #endif

  // #ifndef MP-WEIXIN
  throw new Error('当前平台不支持云函数');
  // #endif
};
