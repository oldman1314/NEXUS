import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import HistoryPanel from '@/components/history/HistoryPanel'
import './sidebar-history.css'

export default function SidebarHistory() {
  const [historyExpanded, setHistoryExpanded] = useState(false)

  return (
    <div className={`sidebar-section sidebar-section-history ${historyExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="section-header" onClick={() => setHistoryExpanded(!historyExpanded)}>
        <span>History</span>
        {historyExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </div>
      {historyExpanded && <HistoryPanel />}
    </div>
  )
}
