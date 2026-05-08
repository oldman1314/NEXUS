import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { generateMeteorConfigs, EMBERS, STARS, DAWN_RAYS, DAWN_MOTES } from '@/config/themeAnimationConfig'

type PageEffect = { direction: 'to-dark' | 'to-light'; key: number; fadeOut?: boolean } | null

interface ThemePageEffectProps {
  pageEffect: NonNullable<PageEffect>
}

function NightScene({ effectKey }: { effectKey: number }) {
  const { meteors, tails, halos } = useMemo(() => generateMeteorConfigs(), [effectKey])

  return (
    <>
      <div className="theme-night-wash" />
      {meteors.map((m) => (
        <div key={m.id} className={`theme-meteor${m.id === 'main' ? ' theme-meteor--main' : ''}`} data-tier-hide={m.hideTier} style={m.style as React.CSSProperties} />
      ))}
      {tails.map((t) => (
        <div key={t.id} className={`theme-meteor-tail${t.id === 'main' ? ' theme-meteor-tail--main' : ''}`} data-tier-hide={t.hideTier} style={t.style as React.CSSProperties} />
      ))}
      {halos.map((h) => (
        <div key={h.id} className="theme-meteor-halo" data-tier-hide={h.hideTier} style={h.style as React.CSSProperties} />
      ))}
      {EMBERS.map((e) => (
        <div key={e.id} className="theme-ember" data-tier-hide={e.hideTier} style={e.style as React.CSSProperties} />
      ))}
      {STARS.map((s) => (
        <div key={s.id} className="theme-star-field" data-tier-hide={s.hideTier} style={s.style as React.CSSProperties} />
      ))}
    </>
  )
}

function DawnScene() {
  return (
    <>
      <div className="theme-dawn-outer" />
      <div className="theme-dawn-mid" />
      <div className="theme-dawn-core" />
      <div className="theme-dawn-wash" />
      {DAWN_RAYS.map((r) => (
        <div key={r.id} className="theme-dawn-ray" style={r.style as React.CSSProperties} />
      ))}
      {DAWN_MOTES.map((m) => (
        <div key={m.id} className="theme-dawn-mote" style={m.style as React.CSSProperties} />
      ))}
    </>
  )
}

export default function ThemePageEffect({ pageEffect }: ThemePageEffectProps) {
  return createPortal(
    <div
      key={pageEffect.key}
      className={`theme-page-effect theme-page-effect--${pageEffect.direction}${pageEffect.fadeOut ? ' theme-page-effect--fade-out' : ''}`}
    >
      {pageEffect.direction === 'to-dark' && <NightScene key={pageEffect.key} effectKey={pageEffect.key} />}
      {pageEffect.direction === 'to-light' && <DawnScene />}
    </div>,
    document.body
  )
}
