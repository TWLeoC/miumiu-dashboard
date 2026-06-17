import { useState, useCallback, useRef } from 'react'

export default function useConfirm() {
  const [state, setState] = useState({ open: false, message: '', subMessage: '' })
  const resolveRef = useRef(null)

  const confirm = useCallback((message, subMessage = '') => {
    setState({ open: true, message, subMessage })
    return new Promise((resolve) => { resolveRef.current = resolve })
  }, [])

  const handleClose = useCallback((result) => {
    setState(s => ({ ...s, open: false }))
    resolveRef.current?.(result)
    resolveRef.current = null
  }, [])

  const ConfirmDialog = state.open ? (
    <div
      className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center"
      onClick={() => handleClose(false)}
    >
      <div
        className="bg-white rounded-xl px-7 py-6 min-w-[300px] max-w-[420px] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-gray-900 mb-2 whitespace-pre-line">{state.message}</div>
        {state.subMessage && (
          <div className="text-xs text-gray-500 mb-4">{state.subMessage}</div>
        )}
        <div className={`flex gap-2 justify-end ${state.subMessage ? '' : 'mt-5'}`}>
          <button
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            onClick={() => handleClose(false)}
          >
            取消
          </button>
          <button
            className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={() => handleClose(true)}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, ConfirmDialog }
}
