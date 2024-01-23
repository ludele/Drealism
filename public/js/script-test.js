function chooseOption(index) {
   fetch(`/notes`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-Option-Index': index.toString(),
     },
   })
     .then((response) => response.text())
     .then((html) => {
       document.getElementsByClassName('main-container').innerHTML = html;
     });
 }
 
 fetch('/notes/')
   .then((response) => response.text())
   .then((html) => {
       document.getElementsByClassName('main-container').innerHTML = html;
   });
 