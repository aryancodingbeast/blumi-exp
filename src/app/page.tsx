import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const session = await auth()
    if (!session) {
        redirect('/login')
    }
    return <ChatClient session={session} />
}
