import { Show, createSignal } from 'solid-js'
import { render } from 'solid-js/web'

type ContactForm = {
  name: string
  email: string
  message: string
}

type ApiError = {
  path: string
  message: string
}

const ContactFormApp = () => {
  const [form, setForm] = createSignal<ContactForm>({
    name: '',
    email: '',
    message: '',
  })
  const [submitting, setSubmitting] = createSignal(false)
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [status, setStatus] = createSignal('')

  const onInput = (field: keyof ContactForm) => {
    return (e: Event) => {
      const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement
      setForm((prev) => ({ ...prev, [field]: target.value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
      setStatus('')
    }
  }

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setStatus('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form()),
      })

      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; errors?: ApiError[] }
        | { ok?: boolean }
        | null

      if (!res.ok || !body?.ok) {
        const nextErrors: Record<string, string> = {}
        if (body && 'errors' in body && Array.isArray(body.errors)) {
          for (const error of body.errors) {
            nextErrors[error.path] = error.message
          }
        }
        setErrors(nextErrors)
        if (!Object.keys(nextErrors).length) {
          setStatus('Failed to submit the form.')
        }
        return
      }

      setStatus('Submitted successfully.')
    } catch {
      setStatus('Network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article>
      <form onSubmit={onSubmit}>
        <label>
          Name
          <input
            type='text'
            value={form().name}
            onInput={onInput('name')}
            aria-invalid={errors().name ? 'true' : undefined}
            autocomplete='name'
            required
          />
        </label>
        <Show when={errors().name}>
          <small>{errors().name}</small>
        </Show>

        <label>
          Email
          <input
            type='email'
            value={form().email}
            onInput={onInput('email')}
            aria-invalid={errors().email ? 'true' : undefined}
            autocomplete='email'
            required
          />
        </label>
        <Show when={errors().email}>
          <small>{errors().email}</small>
        </Show>

        <label>
          Message
          <textarea
            rows='5'
            value={form().message}
            onInput={onInput('message')}
            aria-invalid={errors().message ? 'true' : undefined}
            required
          />
        </label>
        <Show when={errors().message}>
          <small>{errors().message}</small>
        </Show>

        <button type='submit' aria-busy={submitting()} disabled={submitting()}>
          {submitting() ? 'Sending...' : 'Send'}
        </button>
      </form>

      <Show when={status()}>
        <p role='status'>{status()}</p>
      </Show>
    </article>
  )
}

const mount = () => {
  const root = document.getElementById('app')
  if (root) {
    render(() => <ContactFormApp />, root)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true })
} else {
  mount()
}
