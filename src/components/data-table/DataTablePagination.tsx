import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const [jumpPage, setJumpPage] = useState('')
  const [jumpError, setJumpError] = useState('')

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const handleJump = () => {
    setJumpError('')
    const page = parseInt(jumpPage, 10)
    if (isNaN(page)) {
      setJumpError('请输入有效的页码')
      return
    }
    if (page < 1) {
      setJumpError(`页码不能小于 1`)
      return
    }
    if (page > totalPages) {
      setJumpError(`页码不能大于 ${totalPages}`)
      return
    }
    onPageChange(page)
    setJumpPage('')
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="dt-pagination">
      <div className="dt-pagination-left">
        <span className="dt-pagination-info">
          {startItem}-{endItem} of {totalItems}
        </span>
        <select
          className="dt-page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dt-text-muted)' }}>per page</span>
      </div>

      <div className="dt-pagination-controls">
        <button
          className="dt-pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          <ChevronsLeft size={13} />
        </button>
        <button
          className="dt-pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft size={13} />
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="dt-pagination-ellipsis">...</span>
          ) : (
            <button
              key={page}
              className={`dt-pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        )}

        <button
          className="dt-pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight size={13} />
        </button>
        <button
          className="dt-pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          <ChevronsRight size={13} />
        </button>
      </div>

      {totalPages > 10 && (
      <div className="pagination-jump">
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dt-text-muted)' }}>Go to</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <input
            type="number"
            className={`pagination-jump-input ${jumpError ? 'error' : ''}`}
            value={jumpPage}
            onChange={(e) => { setJumpPage(e.target.value); setJumpError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            min={1}
            max={totalPages}
            placeholder="#"
          />
          {jumpError && (
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--error)', whiteSpace: 'nowrap' }}>
              {jumpError}
            </span>
          )}
        </div>
        <button
          className="dt-pagination-btn"
          onClick={handleJump}
          disabled={!jumpPage}
        >
          <ChevronRight size={13} />
        </button>
      </div>
      )}
    </div>
  )
}
