import * as v from 'valibot'

export const contactSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Name is required'),
    v.maxLength(50, 'Name must be 50 characters or fewer')
  ),
  email: v.pipe(v.string(), v.trim(), v.email('Email must be a valid address')),
  message: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Message is required'),
    v.maxLength(500, 'Message must be 500 characters or fewer')
  ),
})

export type ContactInput = v.InferInput<typeof contactSchema>
export type ContactOutput = v.InferOutput<typeof contactSchema>
