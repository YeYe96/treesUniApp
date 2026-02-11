const MOCK_TREE = {
  tree: [
    {
      _id: 'root-1',
      title: '致未来的我',
      isMe: true,
      createTime: '2025-01-01',
      children: [
        {
          _id: 'branch-1-1',
          title: '冬日随笔',
          type: 'branch',
          children: [
            { _id: 'letter-1-1-1', type: 'letter', title: 'First Snow', summary: 'The snow fell quietly...', date: '2025-01-15' }
          ]
        }
      ]
    },
    {
      _id: 'root-2',
      title: '来自远方',
      isMe: false,
      createTime: '2025-02-10',
      children: [
        {
          _id: 'letter-2-1',
          type: 'letter',
          title: 'Hello',
          summary: 'Greetings from the other side.',
          date: '2025-02-12'
        }
      ]
    }
  ]
};

export const normalizeDeskTree = (result) => {
  const data = (result && result.data) || {};
  const tree = Array.isArray(data.tree) ? data.tree : [];
  const roots = Array.isArray(data.roots) ? data.roots : [];

  return {
    tree: tree.length > 0 ? tree : roots
  };
};

export const callCloudFunction = async (name, data = {}) => {
  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    console.warn('Cloud not init, using mock for visual check if needed');
  } else {
    try {
      const res = await wx.cloud.callFunction({ name, data });
      if (res && res.result) return res.result;
    } catch (e) {
      console.error('Cloud Error', e);
      throw e;
    }
  }
  // #endif

  // Mock Data for H5 or fallback
  console.log('[Mock Cloud] Call:', name, data);
  await new Promise((r) => setTimeout(r, 600));

  if (name === 'getDeskTree') {
    return { code: 200, data: MOCK_TREE };
  }

  if (name === 'getLetter') {
    return {
      code: 200,
      data: {
        _id: 'mock-letter-detail',
        rootId: 'root-1',
        content: 'This is a mock letter content for demonstration. The snow fell quietly last night, covering the world in a blanket of silence.\n\nEverything feels new again.',
        createTime: new Date().toISOString(),
        fromAlias: 'Stranger'
      }
    };
  }

  if (name === 'sendLetter') {
    return { code: 200, msg: 'Sent', codeValue: 'DEMO-CODE-123' };
  }

  return { code: 200, msg: 'Mock Success' };
};
