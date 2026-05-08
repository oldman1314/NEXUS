export interface DiffResult {
  leftLines: string[]
  rightLines: string[]
  leftStatus: ('same' | 'removed' | 'modified')[]
  rightStatus: ('same' | 'added' | 'modified')[]
}

export function computeDiff(left: string, right: string): DiffResult {
  const leftLines = left.split('\n')
  const rightLines = right.split('\n')

  const n = leftLines.length
  const m = rightLines.length
  const max = n + m

  if (max === 0) {
    return { leftLines: [], rightLines: [], leftStatus: [], rightStatus: [] }
  }

  const v = new Map<number, number>()
  v.set(1, 0)

  const trace: Map<number, number>[] = []

  let found = false
  for (let d = 0; d <= max; d++) {
    const currentV = new Map<number, number>()
    trace.push(currentV)

    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && (v.get(k - 1) || 0) < (v.get(k + 1) || 0))) {
        x = v.get(k + 1) || 0
      } else {
        x = (v.get(k - 1) || 0) + 1
      }

      let y = x - k

      while (x < n && y < m && leftLines[x] === rightLines[y]) {
        x++
        y++
      }

      v.set(k, x)
      currentV.set(k, x)

      if (x >= n && y >= m) {
        found = true
        break
      }
    }

    if (found) break
  }

  interface EditOp {
    type: 'same' | 'removed' | 'added'
    leftIdx?: number
    rightIdx?: number
  }

  const edits: EditOp[] = []
  let x = n
  let y = m

  for (let d = trace.length - 1; d >= 0; d--) {
    const currentV = trace[d]
    const k = x - y

    let prevK: number
    if (k === -d || (k !== d && (currentV.get(k - 1) || 0) < (currentV.get(k + 1) || 0))) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = d > 0 ? (trace[d - 1].get(prevK) || 0) : 0
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      x--
      y--
      edits.push({ type: 'same', leftIdx: x, rightIdx: y })
    }

    if (d > 0) {
      if (x === prevX) {
        y--
        edits.push({ type: 'added', rightIdx: y })
      } else {
        x--
        edits.push({ type: 'removed', leftIdx: x })
      }
    }
  }

  edits.reverse()

  const resultLeftLines: string[] = []
  const resultRightLines: string[] = []
  const leftStatus: ('same' | 'removed' | 'modified')[] = []
  const rightStatus: ('same' | 'added' | 'modified')[] = []

  let i = 0
  while (i < edits.length) {
    const edit = edits[i]

    if (edit.type === 'same') {
      resultLeftLines.push(leftLines[edit.leftIdx!])
      resultRightLines.push(rightLines[edit.rightIdx!])
      leftStatus.push('same')
      rightStatus.push('same')
      i++
    } else if (edit.type === 'removed') {
      const nextEdit = edits[i + 1]
      if (nextEdit && nextEdit.type === 'added') {
        resultLeftLines.push(leftLines[edit.leftIdx!])
        resultRightLines.push(rightLines[nextEdit.rightIdx!])
        leftStatus.push('modified')
        rightStatus.push('modified')
        i += 2
      } else {
        resultLeftLines.push(leftLines[edit.leftIdx!])
        resultRightLines.push('')
        leftStatus.push('removed')
        rightStatus.push('same')
        i++
      }
    } else if (edit.type === 'added') {
      resultLeftLines.push('')
      resultRightLines.push(rightLines[edit.rightIdx!])
      leftStatus.push('same')
      rightStatus.push('added')
      i++
    }
  }

  return { leftLines: resultLeftLines, rightLines: resultRightLines, leftStatus, rightStatus }
}
