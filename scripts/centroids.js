/**
 * Functions from other files that were used here:
 * - ./parseImg.js/getLuminace
 */

function getCentroids(pixels, grid, width, height) {
/**
 * Calculate the centroid weighted by the pixels luminance for each Voronoi region 
 * represented at the given grid.
 * 
 * @param {Array<number>} pixels - Sequential array with RGBA values for the pixels (`[R1, G1, B1, A1, R2, G2, B2, A2, ...]`).
 * @param {Array<Array<number>>} grid - Grid that saves, for each pixel, the closest sample point label.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @returns {Array<Array<number>>} centroids - List of points in format `[[x1, y1], [x2, y2], ...]`.
 */

    // Store the x, y and density accumulator for each Voronoi region
    const densityAccumulator = {};

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const cellValue = String(grid[x][y]);
            if (densityAccumulator[cellValue] == undefined) {
                // Initialize the region accumulators
                densityAccumulator[cellValue] = {
                    'xAcummulator': 0,
                    'yAcummulator': 0,
                    'dAcummulator': 0
                }
            }

            // Weight
            const luminance = 255 - getLuminance(pixels, (y * width + x) * 4);

            densityAccumulator[cellValue]['xAcummulator'] += x*luminance;
            densityAccumulator[cellValue]['yAcummulator'] += y*luminance;
            densityAccumulator[cellValue]['dAcummulator'] += luminance;
        }
    }

    const newSamplePoints = [];

    // Calculate the centroids based on the accumulators
    Object.keys(densityAccumulator).forEach(key => {
        const strKey = String(key);
        const newX = densityAccumulator[strKey]['xAcummulator']/densityAccumulator[strKey]['dAcummulator'];
        const newY = densityAccumulator[strKey]['yAcummulator']/densityAccumulator[strKey]['dAcummulator'];
        newSamplePoints.push([newX, newY])
    });

    return newSamplePoints;
}