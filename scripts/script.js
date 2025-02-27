/**
 * Read input image, generate the stippling image and display on canvas.
 * 
 * Functions from other files that were used here:
 * - ./parseImg.js/turnImgGray
 * - ./sampleImg.js/sampleImg
 * - ./sampleImg.js/drawPoints
 * - ./jumpFlooding.js/jumpFlooding
 * - ./jumpFloodingGPU.js/jumpFloodingGPU
 * - ./centroids.js/getCentroids
 */

function changeButtons(disabled) {
    document.getElementById("upload").disabled = disabled;
    document.getElementById("npoints").disabled = disabled;
    document.getElementById("iter").disabled = disabled;
    document.getElementById("cancel-btn").disabled = !disabled;
    const uploadLabel = document.getElementById("upload-label");
    const loading = document.getElementById("loading");

    if (disabled) {
        uploadLabel.classList.add("disabled");
        loading.style.display = "block";
    }
    else {  
        uploadLabel.classList.remove("disabled");
        loading.style.display = "none";
    }
}

window.onload = function() {
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    let cancel = false;
    let visualizeIterations = document.getElementById("visulize-iterations");
    
    document.getElementById('download').addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'image.png';
        link.href = canvas.toDataURL();
        link.click();
    });
    
    document.getElementById('cancel-btn').addEventListener('click', function(event) {
        cancel = true;
        changeButtons(false);
        document.getElementById('upload').value = '';
    });

    document.getElementById('upload').addEventListener('change', function(event) {
        visualizeIterations.innerText = "";

        cancel = false;

        let file = event.target.files[0];
        if (!file) return;

        changeButtons(true);
    
        // Save the uploaded image
        let img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = async function() {        
            const npoints = document.getElementById('npoints').value;
            const niter = document.getElementById('iter').value;

            let width = img.width;
            let height = img.height;
            
            ctx.clearRect(0, 0, width, height);

            // Adjust the canvas size based on the image dimensions
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0);
            let imgData = ctx.getImageData(0, 0, width, height);
            
            // Change image data to gray scale
            turnImgGray(imgData);
            ctx.putImageData(imgData, 0, 0);

            // Sample image points based on the luminance distribution
            let samplePoints = sampleImg(imgData.data, width, height, npoints);

            // Bloco para tentar usar a gpu
            let useGPU = false;
            let grid;           

            try {
                grid = await jumpFloodingGPU(samplePoints, width, height);
                if (grid) {
                    useGPU = true;
                    console.log("Jump Flooding executado com GPU.");
                } else {
                    throw new Error("Fallback para CPU");
                }
            } catch (error) {
                console.warn("Jump Flooding GPU falhou, utilizando CPU.", error);
                grid = jumpFlooding(samplePoints, width, height);
            } 
            
            grid = jumpFlooding(samplePoints, width, height);

            // Fim
            let i = 0;

            function iterate() {
                let imax = niter ? niter : 100;
                if (i < imax) {
                    visualizeIterations.innerText = "Iteration " + (i+1) + " of " + imax;
                    if (cancel === true) {
                        return;
                    }

                    const grid = jumpFlooding(samplePoints, width, height);
                    samplePoints = getCentroids(imgData.data, grid, width, height);
                    drawPoints(ctx, samplePoints, width, height);
                    i++;
                    requestAnimationFrame(iterate);
                } else {
                    changeButtons(false);
                    document.getElementById('upload').value = '';
                }
            }
            iterate();
        };
    });
};