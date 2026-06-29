export default function NotFoundPage() {
    return (
        <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '8rem 1rem' }}>
            <div>
                <p className="label-caps" style={{ marginBottom: '0.8rem', opacity: 0.65 }}>404</p>
                <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', marginBottom: '0.8rem' }}>Page Not Found</h1>
                <p style={{ opacity: 0.65 }}>The page you are looking for does not exist.</p>
            </div>
        </div>
    )
}
