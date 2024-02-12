document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('DELETE');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Assuming the action URL is dynamically set to include the noteId, like '/notes/delete/YOUR_NOTE_ID_HERE'
        const actionUrl = `/notes/delete/${this.noteId.value}`; 

        fetch(actionUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            // No need to send a body with a DELETE request in this case
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            window.location.reload(); // Reload the page to reflect the changes
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});