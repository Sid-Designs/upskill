import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'

type JwtPayload = {
    userId: string
    status: 'active' | 'pending' | 'blocked'
    role?: string
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
        redirect('/auth/login')
    }

    let decoded: JwtPayload

    try {
        decoded = jwt.decode(accessToken) as JwtPayload
        console.log('Decoded JWT:', decoded)
    } catch {
        redirect('/auth/login')
    }

    if (decoded.status !== 'active') {
        redirect('/auth/verify-email')
    }

    return <div>{children}</div>
}
