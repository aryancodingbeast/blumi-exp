export default function ProductSkeleton() {
    return (
        <div style={{ width: '100%' }}>
            <div style={{
                aspectRatio: '3/4',
                marginBottom: '1.2rem',
                borderRadius: 'var(--radius-lg)',
                background: '#eee',
                animation: 'pulse 1.5s infinite ease-in-out'
            }} />
            <div style={{ height: '1.2rem', width: '70%', background: '#eee', marginBottom: '0.5rem', borderRadius: '4px' }} />
            <div style={{ height: '1rem', width: '30%', background: '#eee', borderRadius: '4px' }} />
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    )
}
