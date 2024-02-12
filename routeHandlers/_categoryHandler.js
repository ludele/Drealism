const utils = require('../utils');

exports.getCategories = async function (url, pathSegments, request, response) {
    try {
        let db = await utils.connectToDatabase();
        let cookie = utils.readSessionCookie(request.headers.cookie);
        let session = await db.collection('sessions').findOne({uuid: cookie.session});

        if (!session) {
            utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
            return;
        }

        let userId = session.account; 

        let templatePath = './templates/main.maru';
        console.log("Fetching notes from the database...");
        let notes = await utils.retrieveFromDatabase("drealism", collectionName, { userId: userId });
        console.log("Retrieved categories:", notes);

        //notes.sort((a, b) => new Date(a.date) - new Date(b.date));

        notes.forEach(note => {
            note.title = utils.sanitizeInput(note.title);
            note.content = utils.sanitizeInput(note.content); // Showing a preview of the content
        });

        const fields = [
            { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
            { name: 'content', label: 'Content:', type: 'textarea', placeholder: 'Enter content' }
        ];

        let formHTML = utils.generateDynamicForm(fields, '/notes', 'POST');
        console.log(formHTML);

        // Prepare placeholders with title as a link and some content
        const placeholders = {
            title: "Drealism: Notes",
            script: `<script type="text/javascript" src="/static/js/put-or-delete.js" defer></script>`,
            nav:
            `   <div class="header-box">
                    ${utils.generateRouteList(routes)}
                <div/>
            `,
            form: formHTML,
             
            content: notes.map(note =>
            `   <div>
                    <li class="small-box">
                        <a class="box" href="/notes/${note.noteId}">${note.title}</a>
                        <p class="small-box">${note.content.substring(0, 100)}...</p> <!-- Showing a preview of the content -->
                        <span class="small-box">${note.date} ${note.time}</span>
                    </li>
                <div/>
            `
            ).join('')
        };

    const noteId = pathSegments[0];
        if (noteId) {
            // Retrieve the specific note from the database
            templatePath = './templates/index.maru';
            const note = notes.find(note => note.noteId === noteId);

            const noteFields = [
                { name: 'title', label: 'Title:', type: 'text', placeholder: 'Enter title' },
                { name: 'content', label: 'Content:', type: 'textarea', placeholder: 'Enter content' }
            ];

            // For no forms beside the delete
            const emptyFields = [];

            const currentValues = {
                title: note.title,
                content: note.content,
            };
            
            let formHTML = utils.generateDynamicForm(noteFields, `/notes/${note.noteId}`, 'PUT', currentValues)
            // Only shows a "submit" button with the name delete
            let deleteForm = utils.generateDynamicForm(emptyFields, `/notes/${note.noteId}`, "DELETE")
            
            if (note) {
                // Display the specific note
                placeholders.content = `
                    <div>
                        <p>${note.date} ${note.time}</p>
                    </div>
                    ${formHTML}
                    ${deleteForm}
                `;
            } else {
                // Note not found
                placeholders.content = "<p>Note not found</p>";
            }
        }

        

        await utils.applyTemplate(templatePath, placeholders, response);
    } catch (error) {
        console.error("Error retrieving notes:", error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};

exports.createCategory = async function (url, pathSegments, request, response) {
    try {
        let db = await utils.connectToDatabase();
        let cookie = utils.readSessionCookie(request.headers.cookie);
        let session = await db.collection('sessions').findOne({uuid: cookie.session});

        if (!session) {
            utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
            return;
        }

        const { userId, categoryName } = request.body;
        const categoryId = utils.generateCategoryId();

        await db.collection('categories').insertOne({
            categoryId,
            userId,
            categoryName,
            subcategories: [],
        });

        utils.statusCodeResponse(response, 201, JSON.stringify({ categoryId }), 'application/json');
    } catch (error) {
        console.error('Error creating category:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.getCategoryById = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const categoryId = pathSegments[1];
        const category = await db.collection('categories').findOne({ categoryId });

        if (category) {
            utils.statusCodeResponse(response, 200, JSON.stringify(category), 'application/json');
        } else {
            utils.statusCodeResponse(response, 404, 'Category not found', 'text/plain');
        }
    } catch (error) {
        console.error('Error getting category by ID:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.updateCategory = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const categoryId = pathSegments[1];
        const { categoryName, subcategories } = request.body;

        const result = await db.collection('categories').updateOne(
            { categoryId },
            {
                $set: {
                    categoryName,
                    subcategories,
                },
            }
        );

        if (result.modifiedCount > 0) {
            utils.statusCodeResponse(response, 200, 'Category updated successfully', 'text/plain');
        } else {
            utils.statusCodeResponse(response, 404, 'Category not found', 'text/plain');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.deleteCategory = async function (url, pathSegments, request, response) {
   try {
       const db = await utils.connectToDatabase();
       const categoryId = pathSegments[1];

       const result = await db.collection('categories').deleteOne({ categoryId });

       if (result.deletedCount > 0) {
           utils.statusCodeResponse(response, 200, 'Category deleted successfully', 'text/plain');
       } else {
           utils.statusCodeResponse(response, 404, 'Category not found', 'text/plain');
       }
   } catch (error) {
       console.error('Error deleting category:', error);
       utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
   }
};

exports.getSubcategories = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const categoryId = pathSegments[1];
        const category = await db.collection('categories').findOne({ categoryId });

        if (category) {
            utils.statusCodeResponse(response, 200, JSON.stringify(category.subcategories), 'application/json');
        } else {
            utils.statusCodeResponse(response, 404, 'Category not found', 'text/plain');
        }
    } catch (error) {
        console.error('Error getting subcategories:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

