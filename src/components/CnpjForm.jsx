import { useState } from 'react'
import { maskCnpjInput, onlyDigits } from '../utils/format.js'
import { SearchIcon } from './Icons.jsx'

export default function CnpjForm({ onSubmit, loading }) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  const digits = onlyDigits(value)
  const isValid = digits.length === 14
  const showError = touched && value.length > 0 && !isValid

  function handleChange(e) {
    setValue(maskCnpjInput(e.target.value))
  }

  function handlePaste(e) {
    const txt = e.clipboardData.getData('text')
    if (txt) {
      e.preventDefault()
      setValue(maskCnpjInput(txt))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!isValid || loading) return
    onSubmit(digits)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="cnpj" className="block text-sm font-medium text-slate-300 mb-2">
        CNPJ
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            id="cnpj"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00.000.000/0000-00"
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            onBlur={() => setTouched(true)}
            className={`w-full rounded-xl bg-slate-900/60 border px-4 py-3 text-lg tracking-wide
              text-white placeholder-slate-500 outline-none transition
              focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400
              ${showError ? 'border-red-500/60' : 'border-white/10'}`}
            aria-invalid={showError}
            aria-describedby={showError ? 'cnpj-error' : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={!isValid || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl
            bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-3 font-semibold
            text-white shadow-lg shadow-indigo-900/30 transition
            hover:from-indigo-400 hover:to-violet-500 active:scale-[.98]
            disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-indigo-500 disabled:hover:to-violet-600"
        >
          <SearchIcon />
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </div>
      {showError && (
        <p id="cnpj-error" className="mt-2 text-sm text-red-400">
          Informe um CNPJ com 14 dígitos.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Os dados são obtidos da API pública publica.cnpj.ws.
      </p>
    </form>
  )
}
