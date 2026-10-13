/**
 * Loss for the readout: 3 decimals normally, scientific notation when that would hide the
 * number (huge after divergence, or so small that 3 decimals would show a misleading "0.000").
 */
export function formatLoss(loss: number): string {
  if (!Number.isFinite(loss)) return '∞'
  const size = Math.abs(loss)
  if (size >= 1000 || (size > 0 && size < 0.001)) return loss.toExponential(1)
  return loss.toFixed(3)
}
