import { Container } from '@/components/ui-primitives'

export default function Loading() {
  return (
    <main className="page-shell detail-loading" aria-busy="true" aria-label="Loading anime details">
      <Container size="4" px="4" py={{ initial: '7', md: '9' }}>
        <div className="detail-loading-back" />
        <div className="detail-loading-layout">
          <div className="detail-loading-poster loading-shimmer" />
          <div className="detail-loading-copy">
            <div className="detail-loading-title loading-shimmer" />
            <div className="detail-loading-line detail-loading-line-short loading-shimmer" />
            <div className="detail-loading-pills">
              <span className="loading-shimmer" /><span className="loading-shimmer" /><span className="loading-shimmer" />
            </div>
            <div className="detail-loading-rule" />
            <div className="detail-loading-line loading-shimmer" />
            <div className="detail-loading-line loading-shimmer" />
            <div className="detail-loading-line detail-loading-line-medium loading-shimmer" />
          </div>
        </div>
        <span className="sr-only">Loading detailed information and characters…</span>
      </Container>
    </main>
  )
}
