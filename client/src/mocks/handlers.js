import { http, HttpResponse } from 'msw';

/**
 * Default MSW request handlers for Sweety client tests.
 * Intercepts Axios requests sent to /api/... endpoints.
 */
export const handlers = [
  // Intercept POST /api/readings (create glucose reading)
  http.post('*/api/readings', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        data: {
          id: 'msw-reading-101',
          value: Number(body.value),
          slot: body.slot,
          readingDate: body.date,
          notes: body.notes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  // Intercept PATCH /api/readings/:id (update reading)
  http.patch('*/api/readings/:id', async ({ params, request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        data: {
          id: params.id,
          value: Number(body.value),
          slot: body.slot,
          readingDate: body.date,
          notes: body.notes || null,
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  }),
];
