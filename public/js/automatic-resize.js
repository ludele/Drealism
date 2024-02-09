const textarea = document.getElementById('content');

// Function to resize textarea based on content
function resizeTextarea() {
    console.log('Resizing textarea...');
    textarea.style.height = 'auto'; // Reset height to auto
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height to scrollHeight
    console.log('Textarea height set to:', textarea.style.height);
}

// Resize textarea initially and on input changes
resizeTextarea();
textarea.addEventListener('input', resizeTextarea);