import { useThemeMode } from '../../context/ThemeContext'
import './mode-switch.css'

export const ModeSwitch = () => {
  const { mode, setMode } = useThemeMode()

  const handleSelect = (nextMode: 'graduation' | 'corporate') => {
    if (nextMode !== mode) {
      setMode(nextMode)
    }
  }

  return (
    <div className="mode-switch" role="group" aria-label="Cambiar identidad visual">
      <button
        type="button"
        className="mode-switch__option"
        data-active={mode === 'graduation'}
        onClick={() => handleSelect('graduation')}
      >
        Graduación
      </button>
      <button
        type="button"
        className="mode-switch__option"
        data-active={mode === 'corporate'}
        onClick={() => handleSelect('corporate')}
      >
        Corporativo
      </button>
      <span
        className="mode-switch__indicator"
        data-position={mode === 'graduation' ? 'start' : 'end'}
        aria-hidden="true"
      />
    </div>
  )
}

export default ModeSwitch
