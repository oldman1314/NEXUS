import { useRef } from 'react'
import { Search, ChevronDown, Sparkles, Sun, Moon, Monitor, Type, Activity } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { usePerformanceStore } from '@/stores/usePerformanceStore'
import Tooltip from '@/components/common/Tooltip'
import Popover from '@/components/common/Popover'
import ThemeTransitionIcon from '@/components/common/ThemeTransitionIcon'
import ThemePageEffect from '@/components/common/ThemePageEffect'
import { useThemeTransition } from '@/hooks/useThemeTransition'
import WindowControls from './WindowControls'
import EnvSwitcher from './EnvSwitcher'
import type { AccentColor, VisualStyle, FontFamily } from '@/types'
import './toolbar-area.css'

interface ToolbarAreaProps {
  onCommandPaletteOpen: () => void
}

const ACCENT_COLORS = [
  { name: 'blue' as AccentColor, value: '#007aff', darkValue: '#0a84ff' },
  { name: 'purple' as AccentColor, value: '#af52de', darkValue: '#bf5af2' },
  { name: 'indigo' as AccentColor, value: '#5856d6', darkValue: '#5e5ce6' },
  { name: 'pink' as AccentColor, value: '#ff2d55', darkValue: '#ff375f' },
  { name: 'rose' as AccentColor, value: '#ff6482', darkValue: '#ff6b8a' },
  { name: 'red' as AccentColor, value: '#ff3b30', darkValue: '#ff453a' },
  { name: 'orange' as AccentColor, value: '#ff9500', darkValue: '#ff9f0a' },
  { name: 'green' as AccentColor, value: '#34c759', darkValue: '#30d158' },
  { name: 'mint' as AccentColor, value: '#00c7be', darkValue: '#63e6be' },
  { name: 'teal' as AccentColor, value: '#5ac8fa', darkValue: '#64d2ff' },
  { name: 'cyan' as AccentColor, value: '#32ade6', darkValue: '#70d7ff' },
]

const THEME_MODES = ['light', 'dark', 'system'] as const
const THEME_ICONS: Record<string, React.ReactNode> = {
  light: <Sun size={13} />,
  dark: <Moon size={13} />,
  system: <Monitor size={13} />,
}
const THEME_LABELS: Record<string, string> = { light: 'Light', dark: 'Dark', system: 'System' }

const FONT_OPTIONS: { key: FontFamily; label: string; preview: string }[] = [
  { key: 'harmonyos', label: '鸿蒙黑体', preview: 'HarmonyOS' },
  { key: 'lxgw', label: '霞鹜文楷', preview: 'LXGW WenKai' },
  { key: 'misans', label: 'MiSans', preview: 'MiSans' },
  { key: 'noto', label: '思源黑体', preview: 'Noto Sans' },
  { key: 'sarasa', label: '更纱黑体', preview: 'Sarasa' },
]

export default function ToolbarArea({ onCommandPaletteOpen }: ToolbarAreaProps) {
  const view = useUIStore((s) => s.view)
  const themeToggleRef = useRef<HTMLButtonElement>(null)

  const perfCurrentFps = usePerformanceStore((s) => s.currentFps)
  const perfPanelOpen = usePerformanceStore((s) => s.panelOpen)
  const togglePerfPanel = usePerformanceStore((s) => s.togglePanel)

  const {
    themeAnimState,
    pageEffect,
    handleThemeToggle,
    handleQuickToggle,
    resolvedMode,
    mode,
    accentColor,
    setAccentColor,
    visualStyle,
    setVisualStyle,
    fontFamily,
    setFontFamily,
  } = useThemeTransition()

  return (
    <div className="tb-toolbar-area" style={{ display: 'var(--tb-show-tools)' }}>
      <div className="tb-toolbar-group">
        {view === 'request' && <EnvSwitcher />}
        {view === 'request' && <div className="tb-toolbar-divider" />}

        <Tooltip content={`Performance Monitor (FPS: ${perfCurrentFps})`} placement="bottom">
          <button
            className={`tb-tool-btn tb-perf-btn ${perfPanelOpen ? 'tb-perf-btn--active' : ''}`}
            onClick={togglePerfPanel}
            aria-label="Performance monitor"
          >
            <Activity size={14} />
            <span className="tb-perf-fps">{perfCurrentFps}</span>
          </button>
        </Tooltip>

        <Tooltip content={resolvedMode === 'dark' ? 'Switch to Light' : 'Switch to Dark'} placement="bottom">
          <button
            ref={themeToggleRef}
            className={`tb-tool-btn tb-theme-toggle ${themeAnimState !== 'idle' ? 'tb-theme-toggle--animating' : ''}`}
            onClick={handleQuickToggle}
            aria-label="Toggle theme"
          >
            {themeAnimState !== 'idle' ? (
              <ThemeTransitionIcon size={14} state={themeAnimState} />
            ) : (
              resolvedMode === 'dark' ? <Moon size={14} /> : <Sun size={14} />
            )}
          </button>
        </Tooltip>

        <Tooltip content="Search (Ctrl+K)" placement="bottom">
          <button className="tb-tool-btn" onClick={onCommandPaletteOpen} aria-label="Global search">
            <Search size={14} />
          </button>
        </Tooltip>

        <div className="tb-toolbar-divider" />

        <Popover
          trigger={
            <Tooltip content="Appearance" placement="bottom">
              <button className="tb-tool-btn tb-settings-btn" aria-label="Appearance settings">
                <Sparkles size={14} />
                <ChevronDown size={10} className="tb-settings-chevron" />
              </button>
            </Tooltip>
          }
          placement="bottom-end"
        >
          <div className="tb-settings-dropdown">
            <div className="tb-settings-section">
              <div className="tb-settings-section-label">Theme</div>
              <div className="tb-theme-options-inline">
                {THEME_MODES.map((m) => (
                  <button
                    key={m}
                    className={`tb-theme-chip ${mode === m ? 'active' : ''}`}
                    onClick={() => handleThemeToggle(m)}
                  >
                    {mode === m && m !== 'system' ? (
                      <ThemeTransitionIcon size={12} state={themeAnimState} />
                    ) : (
                      THEME_ICONS[m]
                    )}
                    <span>{THEME_LABELS[m]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="tb-actions-divider" />

            <div className="tb-settings-section">
              <div className="tb-settings-section-label">
                <Sparkles size={12} />
                <span>Visual Style</span>
              </div>
              <div className="tb-style-options-inline">
                <button
                  className={`tb-style-chip ${visualStyle === 'classic' ? 'active' : ''}`}
                  onClick={() => setVisualStyle('classic' as VisualStyle)}
                >
                  <span className="tb-style-chip-preview classic" />
                  Classic
                </button>
                <button
                  className={`tb-style-chip ${visualStyle === 'immersive' ? 'active' : ''}`}
                  onClick={() => setVisualStyle('immersive' as VisualStyle)}
                >
                  <span className="tb-style-chip-preview immersive" />
                  Immersive
                </button>
              </div>
            </div>

            <div className="tb-actions-divider" />

            <div className="tb-settings-section">
              <div className="tb-settings-section-label">Accent Color</div>
              <div className="tb-accent-dots">
                {ACCENT_COLORS.map((c) => (
                  <Tooltip key={c.name} content={c.name.charAt(0).toUpperCase() + c.name.slice(1)}>
                    <button
                      className={`tb-accent-dot ${accentColor === c.name ? 'active' : ''}`}
                      style={{ background: resolvedMode === 'dark' ? c.darkValue : c.value }}
                      onClick={() => setAccentColor(c.name)}
                      aria-label={`${c.name} accent`}
                    />
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="tb-actions-divider" />

            <div className="tb-settings-section">
              <div className="tb-settings-section-label">
                <Type size={12} />
                <span>Font</span>
              </div>
              <div className="tb-font-options">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.key}
                    className={`tb-font-chip ${fontFamily === f.key ? 'active' : ''}`}
                    onClick={() => setFontFamily(f.key)}
                    data-font-preview={f.key}
                  >
                    <span className="tb-font-chip-name">{f.label}</span>
                    <span className="tb-font-chip-preview">{f.preview} 你好世界</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Popover>
      </div>

      <WindowControls />

      {pageEffect && (
        <ThemePageEffect key={pageEffect.key} pageEffect={pageEffect} />
      )}
    </div>
  )
}
