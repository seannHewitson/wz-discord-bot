const multipliers = [2, 1.75, 1.75, 1.75, 1.5, 1.5, 1.5, 1.25, 1.25, 1.25]

export const getMultiplier = (position: number) => {
  if (position < 1 || position > multipliers.length) return 1
  return multipliers[position - 1]
}
