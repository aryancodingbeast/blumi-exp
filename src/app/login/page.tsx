import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { loginWithGoogle } from '@/actions/auth'
import LoginClient from './LoginClient'

interface PageProps {
    searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function LoginPage({ searchParams }: PageProps) {
    const session = await auth()
    if (session) redirect('/')

    // If it's an array, extract the first string, or default to undefined
    const errorStr = Array.isArray(searchParams?.error)
        ? searchParams?.error[0]
        : searchParams?.error

    return <LoginClient loginAction={loginWithGoogle} error={errorStr} />
}
