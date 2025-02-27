function getLuminance(pixels, index) {
/**
 * Calculate the luminance in gray scale for the pixel at the given index.
 * 
 * @param {Array<number>} pixels - Sequential array with RGBA values for the pixels (`[R1, G1, B1, A1, R2, G2, B2, A2, ...]`).
 * @param {number} index - Index of the R channel of the pixel.
 */
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];

    // Formula for luminance in gray scale
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function turnImgGray(imgData) {
/**
 * Convert canvas Context ImageData to gray scale (inplace).
 * @param {canvas Context ImageData} imgData - canvas Context ImageData
 */

    const pixels = imgData.data;

    // Convert each pixel to gray scale
    for (let i = 0; i < pixels.length; i += 4) {
        const gray = getLuminance(pixels, i);

        // Define R, G and B with the gray value
        pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
    }
}
