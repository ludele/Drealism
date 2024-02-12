document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('PUT'); 
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const formData = new FormData(this);
        const actionUrl = this.action; 

        fetch(actionUrl, {
            method: 'PUT', 
            body: formData,
            headers: {
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});