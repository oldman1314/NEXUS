interface MeteorConfig {
  id: string
  hideTier: number
  style: Record<string, string>
}

const METEOR_PRESETS = [
  { id: 'main', hideTier: 0, size: '5px', glow: '0 0 50px 15px var(--accent-glow)', bg: 'radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(220,235,255,0.9) 30%,rgba(180,210,255,0.6) 55%,rgba(140,180,255,0.3) 75%,transparent 100%)', dur: '2200ms', delay: '0ms' },
  { id: 'sub1', hideTier: 3, size: '3px', glow: '0 0 25px 8px var(--accent-glow)', bg: 'radial-gradient(circle,rgba(255,255,255,0.95) 0%,rgba(200,225,255,0.7) 35%,rgba(160,195,255,0.35) 65%,transparent 100%)', dur: '2000ms', delay: '600ms' },
  { id: 'sub2', hideTier: 3, size: '2.5px', glow: '0 0 20px 6px var(--accent-glow)', bg: 'radial-gradient(circle,rgba(255,255,255,0.9) 0%,rgba(200,225,255,0.6) 35%,rgba(160,195,255,0.3) 65%,transparent 100%)', dur: '1800ms', delay: '1200ms' },
  { id: 'sub3', hideTier: 2, size: '2px', glow: '0 0 18px 5px var(--accent-glow)', bg: 'radial-gradient(circle,rgba(255,255,255,0.85) 0%,rgba(200,225,255,0.5) 35%,rgba(160,195,255,0.25) 65%,transparent 100%)', dur: '1600ms', delay: '1600ms' },
  { id: 'sub4', hideTier: 2, size: '1.5px', glow: '0 0 14px 4px var(--accent-glow)', bg: 'radial-gradient(circle,rgba(255,255,255,0.8) 0%,rgba(200,225,255,0.4) 35%,rgba(160,195,255,0.2) 65%,transparent 100%)', dur: '1400ms', delay: '2000ms' },
]

const TAIL_PRESETS = [
  { id: 'main', hideTier: 0, width: '500px', height: '3px', radius: '2px', dur: '2200ms', delay: '0ms' },
  { id: 'sub1', hideTier: 3, width: '350px', height: '2px', radius: '1.5px', dur: '2000ms', delay: '600ms' },
  { id: 'sub2', hideTier: 3, width: '260px', height: '1.5px', radius: '1px', dur: '1800ms', delay: '1200ms' },
  { id: 'sub3', hideTier: 2, width: '300px', height: '1.2px', radius: '1px', dur: '1600ms', delay: '1600ms' },
  { id: 'sub4', hideTier: 2, width: '200px', height: '1px', radius: '1px', dur: '1400ms', delay: '2000ms' },
]

const HALO_PRESETS = [
  { id: 'main', hideTier: 2, size: '5px', glow: '0 0 60px 30px rgba(140,180,255,0.15),0 0 120px 60px rgba(100,150,255,0.08)', dur: '2200ms', delay: '0ms' },
  { id: 'sub1', hideTier: 2, size: '3px', glow: '0 0 40px 20px rgba(140,180,255,0.12),0 0 80px 40px rgba(100,150,255,0.06)', dur: '2000ms', delay: '600ms' },
  { id: 'sub2', hideTier: 2, size: '2.5px', glow: '0 0 30px 15px rgba(140,180,255,0.10),0 0 60px 30px rgba(100,150,255,0.05)', dur: '1800ms', delay: '1200ms' },
  { id: 'sub3', hideTier: 2, size: '2px', glow: '0 0 25px 12px rgba(140,180,255,0.08),0 0 50px 25px rgba(100,150,255,0.04)', dur: '1600ms', delay: '1600ms' },
  { id: 'sub4', hideTier: 2, size: '1.5px', glow: '0 0 20px 10px rgba(140,180,255,0.06),0 0 40px 20px rgba(100,150,255,0.03)', dur: '1400ms', delay: '2000ms' },
]

const EASE = 'cubic-bezier(0.25,0.1,0.25,1)'

function randRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function makeTailGradient(isMain: boolean): string {
  if (isMain) {
    return 'linear-gradient(90deg,transparent 0%,rgba(140,180,255,0.02) 5%,rgba(160,195,255,0.06) 12%,rgba(180,210,255,0.14) 22%,rgba(200,225,255,0.28) 35%,rgba(220,238,255,0.48) 50%,rgba(240,248,255,0.7) 65%,rgba(255,255,255,0.88) 80%,rgba(255,255,255,0.97) 92%,rgba(255,255,255,1) 100%)'
  }
  return 'linear-gradient(90deg,transparent 0%,rgba(150,190,255,0.03) 8%,rgba(170,205,255,0.08) 18%,rgba(190,220,255,0.18) 30%,rgba(210,232,255,0.34) 44%,rgba(230,242,255,0.52) 58%,rgba(245,250,255,0.72) 72%,rgba(255,255,255,0.9) 86%,rgba(255,255,255,0.98) 96%,rgba(255,255,255,1) 100%)'
}

export function generateMeteorConfigs(): { meteors: MeteorConfig[]; tails: MeteorConfig[]; halos: MeteorConfig[] } {
  const meteors: MeteorConfig[] = []
  const tails: MeteorConfig[] = []
  const halos: MeteorConfig[] = []

  METEOR_PRESETS.forEach((preset, i) => {
    const top = i === 0 ? `${randRange(-20, -5)}px` : `${randRange(0, 15)}%`
    const right = `${randRange(5, 55)}%`
    const animName = `meteorFly${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`
    const tailAnimName = `meteorTailFly${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`

    meteors.push({
      id: preset.id,
      hideTier: preset.hideTier,
      style: {
        '--m-size': preset.size,
        '--m-top': top,
        '--m-right': right,
        '--m-bg': preset.bg,
        '--m-glow': preset.glow,
        animation: `${animName} ${preset.dur} ${EASE} ${preset.delay} both`,
      },
    })

    const tailGradient = makeTailGradient(i === 0)
    tails.push({
      id: preset.id,
      hideTier: TAIL_PRESETS[i].hideTier,
      style: {
        '--t-top': top,
        '--t-right': right,
        '--t-width': TAIL_PRESETS[i].width,
        '--t-height': TAIL_PRESETS[i].height,
        '--t-radius': TAIL_PRESETS[i].radius,
        '--t-bg': tailGradient,
        animation: `${tailAnimName} ${TAIL_PRESETS[i].dur} ${EASE} ${TAIL_PRESETS[i].delay} both`,
      },
    })

    halos.push({
      id: preset.id,
      hideTier: HALO_PRESETS[i].hideTier,
      style: {
        '--h-size': HALO_PRESETS[i].size,
        '--h-top': top,
        '--h-right': right,
        '--h-glow': HALO_PRESETS[i].glow,
        animation: `${animName} ${HALO_PRESETS[i].dur} ${EASE} ${HALO_PRESETS[i].delay} both`,
      },
    })
  })

  return { meteors, tails, halos }
}

export const EMBERS = [
  { id: '1', hideTier: 2, style: { '--e-size': '3px', '--e-top': '10%', '--e-right': '16%', '--e-bg': 'rgba(200,225,255,0.9)', '--e-glow': '0 0 4px rgba(160,200,255,0.7)', animation: 'emberDrift 900ms var(--ease-out-quart) 200ms both' } },
  { id: '2', hideTier: 2, style: { '--e-size': '2px', '--e-top': '18%', '--e-right': '24%', '--e-bg': 'rgba(220,235,255,0.85)', '--e-glow': '0 0 3px rgba(180,215,255,0.6)', animation: 'emberDrift 800ms var(--ease-out-quart) 350ms both' } },
  { id: '3', hideTier: 2, style: { '--e-size': '2.5px', '--e-top': '28%', '--e-right': '34%', '--e-bg': 'rgba(180,210,255,0.8)', '--e-glow': '0 0 4px rgba(150,190,255,0.6)', animation: 'emberDrift 850ms var(--ease-out-quart) 500ms both' } },
  { id: '4', hideTier: 2, style: { '--e-size': '2px', '--e-top': '38%', '--e-right': '44%', '--e-bg': 'rgba(200,220,255,0.9)', '--e-glow': '0 0 3px rgba(170,205,255,0.7)', animation: 'emberDrift 750ms var(--ease-out-quart) 600ms both' } },
  { id: '5', hideTier: 2, style: { '--e-size': '1.5px', '--e-top': '48%', '--e-right': '54%', '--e-bg': 'rgba(220,235,255,0.75)', '--e-glow': '0 0 3px rgba(190,220,255,0.5)', animation: 'emberDrift 700ms var(--ease-out-quart) 700ms both' } },
  { id: '6', hideTier: 2, style: { '--e-size': '2px', '--e-top': '56%', '--e-right': '62%', '--e-bg': 'rgba(200,225,255,0.8)', '--e-glow': '0 0 3px rgba(170,210,255,0.5)', animation: 'emberDrift 680ms var(--ease-out-quart) 800ms both' } },
  { id: '7', hideTier: 2, style: { '--e-size': '1.5px', '--e-top': '64%', '--e-right': '70%', '--e-bg': 'rgba(180,210,255,0.7)', '--e-glow': '0 0 2px rgba(150,190,255,0.5)', animation: 'emberDrift 650ms var(--ease-out-quart) 900ms both' } },
  { id: '8', hideTier: 2, style: { '--e-size': '3px', '--e-top': '15%', '--e-right': '38%', '--e-bg': 'rgba(210,230,255,0.85)', '--e-glow': '0 0 5px rgba(170,210,255,0.7)', animation: 'emberDrift 950ms var(--ease-out-quart) 300ms both' } },
  { id: '9', hideTier: 2, style: { '--e-size': '1.5px', '--e-top': '32%', '--e-right': '50%', '--e-bg': 'rgba(180,210,255,0.8)', '--e-glow': '0 0 2px rgba(150,190,255,0.5)', animation: 'emberDrift 680ms var(--ease-out-quart) 550ms both' } },
  { id: '10', hideTier: 2, style: { '--e-size': '2px', '--e-top': '44%', '--e-right': '60%', '--e-bg': 'rgba(200,225,255,0.7)', '--e-glow': '0 0 3px rgba(170,210,255,0.5)', animation: 'emberDrift 700ms var(--ease-out-quart) 650ms both' } },
  { id: '11', hideTier: 2, style: { '--e-size': '1.5px', '--e-top': '22%', '--e-right': '14%', '--e-bg': 'rgba(220,238,255,0.75)', '--e-glow': '0 0 2px rgba(190,220,255,0.5)', animation: 'emberDrift 720ms var(--ease-out-quart) 450ms both' } },
  { id: '12', hideTier: 2, style: { '--e-size': '2px', '--e-top': '52%', '--e-right': '48%', '--e-bg': 'rgba(190,215,255,0.8)', '--e-glow': '0 0 3px rgba(160,200,255,0.5)', animation: 'emberDrift 690ms var(--ease-out-quart) 750ms both' } },
]

export const STARS = [
  { id: '1', hideTier: 0, style: { '--s-size': '3px', '--s-top': '5%', '--s-left': '10%', '--s-shadow': '0 0 4px 2px rgba(255,255,255,0.8),0 0 20px 6px rgba(160,200,255,0.2)', animation: 'starGlowAndFade 5500ms var(--ease-out-quart) 100ms both' } },
  { id: '2', hideTier: 3, style: { '--s-size': '1.5px', '--s-top': '12%', '--s-left': '58%', '--s-shadow': '0 0 2px 1px rgba(255,255,255,0.6),0 0 10px 3px rgba(160,200,255,0.2)', animation: 'starGlowAndFadeB 6200ms var(--ease-out-quart) 850ms both' } },
  { id: '3', hideTier: 3, style: { '--s-size': '2.5px', '--s-top': '25%', '--s-left': '6%', '--s-shadow': '0 0 4px 2px rgba(255,255,255,0.75),0 0 18px 5px rgba(160,200,255,0.2)', animation: 'starGlowAndFadeC 4800ms var(--ease-out-quart) 350ms both' } },
  { id: '4', hideTier: 2, style: { '--s-size': '1px', '--s-top': '33%', '--s-left': '75%', '--s-bg': 'rgba(255,240,200,0.85)', '--s-shadow': '0 0 2px 1px rgba(255,235,180,0.5),0 0 8px 2px rgba(255,200,120,0.15)', animation: 'starGlowAndFadeB 5800ms var(--ease-out-quart) 1200ms both' } },
  { id: '5', hideTier: 3, style: { '--s-size': '2px', '--s-top': '46%', '--s-left': '22%', '--s-shadow': '0 0 3px 1px rgba(255,255,255,0.7),0 0 16px 4px rgba(160,200,255,0.18)', animation: 'starGlowAndFade 5200ms var(--ease-out-quart) 600ms both' } },
  { id: '6', hideTier: 2, style: { '--s-size': '1.5px', '--s-top': '53%', '--s-left': '85%', '--s-shadow': '0 0 2px 1px rgba(255,255,255,0.6),0 0 10px 3px rgba(160,200,255,0.15)', animation: 'starGlowAndFadeC 6500ms var(--ease-out-quart) 200ms both' } },
  { id: '7', hideTier: 3, style: { '--s-size': '1px', '--s-top': '66%', '--s-left': '40%', '--s-bg': 'rgba(255,235,190,0.85)', '--s-shadow': '0 0 2px 1px rgba(255,230,170,0.5),0 0 8px 2px rgba(255,195,110,0.12)', animation: 'starGlowAndFade 4500ms var(--ease-out-quart) 1500ms both' } },
  { id: '8', hideTier: 0, style: { '--s-size': '3px', '--s-top': '73%', '--s-left': '12%', '--s-shadow': '0 0 4px 2px rgba(255,255,255,0.8),0 0 20px 6px rgba(160,200,255,0.25)', animation: 'starGlowAndFadeB 5600ms var(--ease-out-quart) 50ms both' } },
  { id: '9', hideTier: 2, style: { '--s-size': '1.5px', '--s-top': '80%', '--s-left': '68%', '--s-shadow': '0 0 2px 1px rgba(255,255,255,0.6),0 0 10px 3px rgba(160,200,255,0.15)', animation: 'starGlowAndFadeC 6000ms var(--ease-out-quart) 950ms both' } },
  { id: '10', hideTier: 2, style: { '--s-size': '1px', '--s-top': '20%', '--s-left': '42%', '--s-bg': 'rgba(255,238,195,0.85)', '--s-shadow': '0 0 2px 1px rgba(255,232,175,0.5),0 0 8px 2px rgba(255,198,115,0.12)', animation: 'starGlowAndFade 4200ms var(--ease-out-quart) 1800ms both' } },
  { id: '11', hideTier: 3, style: { '--s-size': '2.5px', '--s-top': '40%', '--s-left': '52%', '--s-shadow': '0 0 4px 2px rgba(255,255,255,0.75),0 0 18px 5px rgba(160,200,255,0.2)', animation: 'starGlowAndFadeB 5400ms var(--ease-out-quart) 450ms both' } },
  { id: '12', hideTier: 2, style: { '--s-size': '1px', '--s-top': '88%', '--s-left': '32%', '--s-bg': 'rgba(255,242,205,0.85)', '--s-shadow': '0 0 2px 1px rgba(255,236,185,0.5),0 0 8px 2px rgba(255,202,125,0.12)', animation: 'starGlowAndFadeC 5000ms var(--ease-out-quart) 1100ms both' } },
  { id: '13', hideTier: 3, style: { '--s-size': '2px', '--s-top': '3%', '--s-left': '35%', '--s-shadow': '0 0 3px 1px rgba(255,255,255,0.7),0 0 16px 4px rgba(160,200,255,0.18)', animation: 'starGlowAndFade 6800ms var(--ease-out-quart) 250ms both' } },
  { id: '14', hideTier: 0, style: { '--s-size': '3.5px', '--s-top': '15%', '--s-left': '80%', '--s-shadow': '0 0 5px 2px rgba(255,255,255,0.85),0 0 25px 8px rgba(160,200,255,0.3)', animation: 'starGlowAndFadeB 5100ms var(--ease-out-quart) 150ms both' } },
  { id: '15', hideTier: 2, style: { '--s-size': '1px', '--s-top': '30%', '--s-left': '92%', '--s-bg': 'rgba(255,236,188,0.85)', '--s-shadow': '0 0 2px 1px rgba(255,228,165,0.5),0 0 8px 2px rgba(255,192,105,0.12)', animation: 'starGlowAndFadeC 4600ms var(--ease-out-quart) 1400ms both' } },
  { id: '16', hideTier: 3, style: { '--s-size': '2px', '--s-top': '58%', '--s-left': '5%', '--s-shadow': '0 0 3px 1px rgba(255,255,255,0.7),0 0 16px 4px rgba(160,200,255,0.18)', animation: 'starGlowAndFade 5900ms var(--ease-out-quart) 700ms both' } },
  { id: '17', hideTier: 2, style: { '--s-size': '1.5px', '--s-top': '70%', '--s-left': '55%', '--s-shadow': '0 0 2px 1px rgba(255,255,255,0.6),0 0 10px 3px rgba(160,200,255,0.15)', animation: 'starGlowAndFadeB 4400ms var(--ease-out-quart) 1050ms both' } },
  { id: '18', hideTier: 0, style: { '--s-size': '3px', '--s-top': '92%', '--s-left': '78%', '--s-shadow': '0 0 4px 2px rgba(255,255,255,0.8),0 0 20px 6px rgba(160,200,255,0.25)', animation: 'starGlowAndFadeC 5700ms var(--ease-out-quart) 300ms both' } },
  { id: '19', hideTier: 2, style: { '--s-size': '1px', '--s-top': '8%', '--s-left': '48%', '--s-bg': 'rgba(255,240,200,0.85)', '--s-shadow': '0 0 2px 1px rgba(255,234,180,0.5),0 0 8px 2px rgba(255,200,120,0.12)', animation: 'starGlowAndFade 6300ms var(--ease-out-quart) 1600ms both' } },
  { id: '20', hideTier: 3, style: { '--s-size': '2.5px', '--s-top': '50%', '--s-left': '95%', '--s-shadow': '0 0 4px 2px rgba(255,255,255,0.75),0 0 18px 5px rgba(160,200,255,0.2)', animation: 'starGlowAndFadeB 4900ms var(--ease-out-quart) 550ms both' } },
]

export const DAWN_RAYS = Array.from({ length: 12 }, (_, i) => {
  const isOdd = i % 2 === 0
  return {
    id: String(i + 1),
    style: {
      '--r-rotate': `${i * 30}deg`,
      '--r-width': isOdd ? '2.5px' : '2px',
      '--r-bg': isOdd
        ? 'linear-gradient(180deg,rgba(255,220,100,0.5) 0%,rgba(255,200,80,0.15) 50%,transparent 100%)'
        : 'linear-gradient(180deg,rgba(255,210,90,0.4) 0%,rgba(255,190,70,0.1) 50%,transparent 100%)',
      animation: `dawnRayGrow ${isOdd ? '1100ms' : '1000ms'} var(--ease-out-quart) ${100 + i * 50}ms both`,
    },
  }
})

export const DAWN_MOTES = [
  { id: '1', style: { '--mt-size': '3px', '--mt-top': '45%', '--mt-left': '42%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 150ms both' } },
  { id: '2', style: { '--mt-size': '4px', '--mt-top': '55%', '--mt-left': '58%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 220ms both' } },
  { id: '3', style: { '--mt-size': '2px', '--mt-top': '38%', '--mt-left': '52%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 290ms both' } },
  { id: '4', style: { '--mt-size': '3px', '--mt-top': '60%', '--mt-left': '40%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 350ms both' } },
  { id: '5', style: { '--mt-size': '2px', '--mt-top': '50%', '--mt-left': '65%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 400ms both' } },
  { id: '6', style: { '--mt-size': '3px', '--mt-top': '42%', '--mt-left': '48%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 180ms both' } },
  { id: '7', style: { '--mt-size': '2px', '--mt-top': '58%', '--mt-left': '44%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 320ms both' } },
  { id: '8', style: { '--mt-size': '4px', '--mt-top': '48%', '--mt-left': '56%', animation: 'dawnMoteRise 700ms var(--ease-out-quart) 260ms both' } },
]
