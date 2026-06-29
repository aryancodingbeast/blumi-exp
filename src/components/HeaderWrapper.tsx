import { auth } from '@/lib/auth'
import Header from './Header'

export default async function HeaderWrapper() {
    const session = await auth()
    return <Header session={session} />
}
