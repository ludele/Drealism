document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('PUT'); 
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const formData = new FormData(this);
        const formObject = Object.fromEntries(formData.entries()); 
        const actionUrl = this.action; 

        fetch(actionUrl, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject), 
        })
        .then(data => {
            console.log('Success:', data);
            window.location.reload();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('DELETE'); 
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const formData = new FormData(this);
        const formObject = Object.fromEntries(formData.entries()); 
        const actionUrl = this.action;

        fetch(actionUrl, {
            method: 'DELETE', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject), 
        })
        .then(data => {
            console.log('Success:', data);
            window.location.reload();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});