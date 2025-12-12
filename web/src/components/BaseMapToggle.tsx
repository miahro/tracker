// web/src/components/BaseMapToggle.tsx
import React from 'react'
import type { BaseMapId } from '../basemaps'

interface Props {
  value: BaseMapId
  onChange: (value: BaseMapId) => void
}

export function BaseMapToggle({ value, onChange }: Props) {
  const buttonClass = (active: boolean) =>
    ['pillButton', active ? 'pillButtonActive' : ''].filter(Boolean).join(' ')

  return (
    <div className="toggleRow">
      <button
        type="button"
        onClick={() => onChange('nls-vector')}
        className={buttonClass(value === 'nls-vector')}
      >
        NLS vector
      </button>

      <button
        type="button"
        onClick={() => onChange('mapant')}
        className={buttonClass(value === 'mapant')}
      >
        MapAnt
      </button>
    </div>
  )
}
