const originalImage = document.getElementById('original-image');
const canvas = document.getElementById('canvas');
const zoomSlider = document.getElementById('zoom-slider');
const uploadInput = document.getElementById('upload');

let currentScale = 1;

zoomSlider.addEventListener('input', function() {
    currentScale = zoomSlider.value;
    originalImage.style.transform = `scale(${currentScale})`;
    canvas.style.transform = `scale(${currentScale})`;
});

uploadInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
            originalImage.style.display = 'block'; // Show the image
        }
        reader.readAsDataURL(file);
    }
});