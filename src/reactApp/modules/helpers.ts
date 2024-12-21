export const versionSorter = (a: string, b: string) => {
  const segmentsA = a.split(".").map(Number);
  const segmentsB = b.split(".").map(Number);

  for (let i = 0; i < Math.max(segmentsA.length, segmentsB.length); i++) {
    const segA = segmentsA[i] || 0;
    const segB = segmentsB[i] || 0;

    if (segA !== segB) {
      return segB - segA;
    }
  }

  return 0; // Versions are equal
};
