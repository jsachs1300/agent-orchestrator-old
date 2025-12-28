const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../dist/app/index');
const {
  resetRequirementsStore
} = require('../dist/core/orchestration-v2/requirements-store');

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test('POST /v1/requirements/bulk requires agent headers and pm role', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    });

    assert.strictEqual(res.status, 401);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk stores requirements for pm role', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-001',
        title: 'LLM-driven routing only',
        priority: 'P0',
        acceptance: ['No heuristic intent classification'],
        constraints: ['No additional properties in routing schema'],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.deepStrictEqual(body, { requirements: payload });
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk returns 409 for duplicate req_id', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-010',
        title: 'Duplicate check',
        priority: 'P1',
        acceptance: [],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#dupe',
        status: 'derived'
      }
    ];

    await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.deepStrictEqual(body, {
      error: 'requirement_exists',
      message: 'One or more requirements already exist',
      duplicates: ['REQ-010']
    });
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects empty req_id', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: '   ',
        title: 'Empty req_id',
        priority: 'P1',
        acceptance: [],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk defaults status to derived when omitted', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-004',
        title: 'Default status derived',
        priority: 'P1',
        acceptance: ['Status defaults'],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#defaults'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.deepStrictEqual(body, {
      requirements: [
        {
          ...payload[0],
          status: 'derived'
        }
      ]
    });
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects unexpected fields', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-002',
        title: 'Bad payload',
        priority: 'P1',
        acceptance: [],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived',
        extra: 'nope'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects empty priority', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-011',
        title: 'Empty priority',
        priority: '   ',
        acceptance: [],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects invalid priority', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-012',
        title: 'Invalid priority',
        priority: 'P9',
        acceptance: [],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects duplicate req_id in payload', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-013',
        title: 'Duplicate payload',
        priority: 'P2',
        acceptance: ['A'],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      },
      {
        req_id: 'REQ-013',
        title: 'Duplicate payload again',
        priority: 'P2',
        acceptance: ['B'],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects non-string acceptance entries', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-005',
        title: 'Bad acceptance',
        priority: 'P1',
        acceptance: ['ok', 42],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects empty string acceptance entries', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-014',
        title: 'Empty acceptance entry',
        priority: 'P1',
        acceptance: ['  '],
        constraints: [],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects non-string constraints entries', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-006',
        title: 'Bad constraints',
        priority: 'P1',
        acceptance: [],
        constraints: ['ok', null],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('POST /v1/requirements/bulk rejects empty string constraints entries', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-015',
        title: 'Empty constraints entry',
        priority: 'P1',
        acceptance: ['ok'],
        constraints: ['   '],
        source_ref: 'REQUIREMENTS.md#routing',
        status: 'derived'
      }
    ];

    const res = await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 400);
  } finally {
    await server.close();
  }
});

test('GET /v1/requirements/:req_id requires agent headers', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const res = await fetch(`${server.baseUrl}/v1/requirements/REQ-999`);

    assert.strictEqual(res.status, 401);
  } finally {
    await server.close();
  }
});

test('GET /v1/requirements/:req_id returns stored requirement', async () => {
  resetRequirementsStore();
  const server = await startServer();

  try {
    const payload = [
      {
        req_id: 'REQ-003',
        title: 'Deterministic context',
        priority: 'P2',
        acceptance: ['Context from state only'],
        constraints: ['No global state return'],
        source_ref: 'REQUIREMENTS.md#context',
        status: 'derived'
      }
    ];

    await fetch(`${server.baseUrl}/v1/requirements/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Role': 'pm',
        'X-Agent-Id': 'pm-1'
      },
      body: JSON.stringify(payload)
    });

    const res = await fetch(`${server.baseUrl}/v1/requirements/REQ-003`, {
      headers: {
        'X-Agent-Role': 'coder',
        'X-Agent-Id': 'coder-1'
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body, payload[0]);
  } finally {
    await server.close();
  }
});
