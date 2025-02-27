/**
 * Functions from other files that were used here:
 * - ./parseImg.js/getLuminance
 */

function sampleImg(pixels, width, height, nPoints) {
/**
 * Generate a set of random sample points where the probability of selecting a pixel 
 * is weighted by its luminance — darker pixels have a higher likelihood of being chosen.
 * 
 * @param {Array<number>} pixels - Sequential array with RGBA values for the pixels (`[R1, G1, B1, A1, R2, G2, B2, A2, ...]`).
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 * @returns {Array<Array<number>>} samplePoints - List of points in format `[[x1, y1], [x2, y2], ...]`.
 */
    let count = 0;
    const samplePoints = [];

    while (count < nPoints) {
        const x = Math.floor(Math.random() * (width - 1));
        const y = Math.floor(Math.random() * (height - 1));

        const luminance = getLuminance(pixels, (y * width + x) * 4);

        if (luminance < (Math.random()*255)) {
            samplePoints.push([x, y]);
            count++;
        } 
    }
    return samplePoints;
}

function drawPoints(ctx, points, width, height) {
/**
 * Draw a list of points in the given canvas context.
 * 
 * @param {canvas Context} ctx - canvas Context.
 * @param {Array<Array<number>>} points - List of points in format `[[x1, y1], [x2, y2], ...]`.
 * @param {number} width - Image width.
 * @param {number} height - Image height.
 */
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";

    points.forEach(point => {
        const x = Math.floor(point[0]);
        const y = Math.floor(point[1]);

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}