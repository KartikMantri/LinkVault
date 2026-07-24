'use server'

import { redirect } from 'next/navigation'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/server'

const AuthSchema = z.object({
  email: z.email({ error: 'Please enter a valid email.' }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters.' }),
})

export type AuthState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const validated = AuthSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp(validated.data)

  if (error) {
    return { message: error.message }
  }

  redirect('/library')
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const validated = AuthSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    return { message: error.message }
  }

  redirect('/library')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
