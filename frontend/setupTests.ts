import '@testing-library/jest-dom'

// Minimal global fetch stub for tests
if (typeof global.fetch === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	;(global as any).fetch = (..._args: any[]) =>
		Promise.resolve({ ok: true, json: async () => ({}) })
}
// Stub window.alert (jsdom doesn't implement)
if (typeof (global as any).alert === 'undefined') {
	;(global as any).alert = (..._args: any[]) => {}
}
if (typeof window !== 'undefined' && typeof (window as any).alert === 'undefined') {
	;(window as any).alert = (..._args: any[]) => {}
}
