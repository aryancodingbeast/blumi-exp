import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email || !user.id) return false

            try {
                // Create profile if it doesn't exist
                const { data: existingProfile, error: fetchError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .ilike('email', user.email.trim().toLowerCase())
                    .maybeSingle()

                if (fetchError) {
                    console.error('SignIn Callback - Fetch Error:', fetchError)
                    return false
                }

                if (!existingProfile) {
                    const { error: insertError } = await supabaseAdmin
                        .from('profiles')
                        .insert({
                            id: user.id,
                            name: user.name,
                            email: user.email.trim().toLowerCase(),
                            role: 'BUYER'
                        })

                    if (insertError) {
                        console.error('SignIn Callback - Insert Error:', insertError)
                        return false
                    }
                }

                return true
            } catch (error) {
                console.error('SignIn Callback - Unexpected error:', error)
                return false
            }
        },
        async session({ session, token }: any) {
            if (session.user && session.user.email) {
                try {
                    const { data } = await supabaseAdmin
                        .from('profiles')
                        .select('id, role')
                        .ilike('email', session.user.email.trim().toLowerCase())
                        .maybeSingle()

                    if (data) {
                        session.user.id = data.id
                        session.user.role = data.role
                    }
                } catch (err) {
                    console.error('Session Callback - Error fetching profile:', err)
                }
            }
            return session
        },
        async jwt({ token, user, account, profile }) {
            return token
        }
    },
    pages: {
        signIn: '/login',
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
})
