import { useState, useRef, useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

export function useColumnResize(initialWidths: Record<string, number>) {
  const [widths, setWidths] = useState(initialWidths)
  const widthsRef = useRef(widths)
  widthsRef.current = widths
  const resizeRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null)

  const onResizeStart = useCallback(
    (column: string) => (e: ReactMouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      resizeRef.current = {
        column,
        startX: e.clientX,
        startWidth: widthsRef.current[column],
      }

      const onMouseMove = (ev: globalThis.MouseEvent) => {
        if (!resizeRef.current) return
        const diff = ev.clientX - resizeRef.current.startX
        const newWidth = Math.max(60, resizeRef.current.startWidth + diff)
        setWidths((prev) => ({ ...prev, [resizeRef.current!.column]: newWidth }))
      }

      const onMouseUp = () => {
        resizeRef.current = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [],
  )

  return { widths, onResizeStart }
}
