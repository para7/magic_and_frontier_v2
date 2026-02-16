import { createRoute } from 'honox/factory'
import * as v from 'valibot'

import { contactSchema } from '../../schema/contact'

type ApiError = {
  path: string
  message: string
}

const toApiErrors = (issues: v.BaseIssue<unknown>[]): ApiError[] => {
  return issues.map((issue) => {
    const path =
      issue.path
        ?.map((item) => (typeof item.key === 'string' ? item.key : String(item.key)))
        .join('.') ?? 'root'

    return {
      path,
      message: issue.message,
    }
  })
}

export const POST = createRoute(async (c) => {
  const contentType = c.req.header('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    console.log('[API] POST /api/contact -> 400 (invalid content-type)')
    return c.json(
      {
        ok: false,
        errors: [{ path: 'root', message: 'Content-Type must be application/json' }],
      },
      400
    )
  }

  let payload: unknown
  try {
    payload = await c.req.json()
  } catch {
    console.log('[API] POST /api/contact -> 400 (invalid json body)')
    return c.json(
      {
        ok: false,
        errors: [{ path: 'root', message: 'Invalid JSON body' }],
      },
      400
    )
  }

  const result = v.safeParse(contactSchema, payload)
  if (!result.success) {
    console.log(
      `[API] POST /api/contact -> 400 (validation errors: ${result.issues.length})`
    )
    return c.json(
      {
        ok: false,
        errors: toApiErrors(result.issues),
      },
      400
    )
  }

  console.log('[API] POST /api/contact -> 200 (ok)')
  return c.json({
    ok: true,
    data: result.output,
  })
})
