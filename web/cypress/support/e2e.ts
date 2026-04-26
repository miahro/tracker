// cypress/support/e2e.ts
//
// MapLibre throws a WebGL context creation error when running in Cypress
// interactive mode (no GPU available in the sandboxed browser process).
// The error is caught at the source in MapView.tsx, but MapLibre also
// dispatches it as a DOM event — which Cypress surfaces as an uncaught
// exception. Suppress it here so results reflect actual UI behaviour.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(Cypress as any).on('uncaught:exception', (err: Error) => {
  if (
    err.message.includes('webglcontextcreationerror') ||
    err.message.includes('Failed to initialize WebGL') ||
    err.message.includes('WebGL')
  ) {
    return false
  }
  return true
})
