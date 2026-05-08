import './app-menu.css'
import ApiRocketIcon from '@/components/common/ApiRocketIcon'

export default function AppMenu() {
  return (
    <div className="tb-app-menu">
      <div className="tb-app-brand">
        <ApiRocketIcon />
        <span className="title-bar-app-name">NEXUS</span>
      </div>
    </div>
  )
}
