const { ServerHeartbeatSucceededEvent } = require("mongodb");
const utils = require("../utils.js");

exports.handleSearchRoute = async function(url, pathSegments, request, response) {
    
    let db = await utils.connectToDatabase(); 
    let urlParts = new URL(request.url, `http://${request.headers.host}`);
    let searchQuery = urlParts.searchParams.get("query");
    searchQuery = searchQuery ? String(searchQuery) : '';
    console.log("Search Query:", searchQuery, typeof searchQuery);

    let cookie; 
    cookie = utils.readSessionCookie(request.headers.cookie, response);
 
    if (!cookie || typeof cookie.session === 'undefined' || typeof cookie.account === 'undefined') {
       return;
    }

    let session = await db.collection('sessions').findOne({uuid: cookie.session});
    if (!session) {
        return utils.statusCodeResponse(response, 401, "Unauthorized: Session not found", "text/plain");
    }
    let userId = session.account;

    // Perform the search across collections
    let collections = ['notes', 'tasks', 'categories'];
    let searchResults = await Promise.all(collections.map(collection => 
        db.collection(collection).find({
            userId: userId,
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } },
            ]
        }).toArray()
    ));

    content = searchResults.map(doc =>
        `   <div>
                <li class="small-box">
                    <a class="box" href="/notes/${doc.noteId}">${doc.title}</a>
                    <p class="small-box">${doc.content}...</p> <!-- Showing a preview of the content -->
                    <span class="small-box">${doc.date} ${doc.time}</span>
                </li>
            <div/>
        `
        ).join('');

    console.log(searchResults)
    const searchFormFields = [
        { name: 'query', label: 'Search Query', type: 'text', placeholder: 'Enter search terms...' }
    ];
    
    let searchFormHTML = utils.generateDynamicForm(searchFormFields, '/search', 'GET');

    const placeholders = {
        nav: `<div class="header-box">${utils.generateRouteList(utils.routes)}</div>`,
        content: content, // Pass the results to the template
        form: searchFormHTML
    };
    await utils.applyTemplate('./templates/main.maru', placeholders, response);
};