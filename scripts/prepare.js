// Runs husky if installed; silently skips if not (e.g. Docker production install)
try {
  const { default: husky } = await import('husky');
  husky();
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND' && e.code !== 'MODULE_NOT_FOUND') {
    console.error(e);
    process.exit(1);
  }
  // husky not installed — OK in production / Docker
}
