'use server'

import { signIn, signOut } from "@/lib/auth"

export async function loginWithGoogle() {
    await signIn("google")
}

export async function logout() {
    await signOut()
}
