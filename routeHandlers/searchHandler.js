const utils = require("../utils.js");

const searchCollection = async (collection, query) => {
    return await collection.find(query).toArray();
};

async function dynamicSearch(resultName, collection, termName, searchTerm) {
    try {
        const query = {};
        query[termName] = { $regex: searchTerm, $options: 'i' };

        const result = await searchCollection(utils.db.collection(collection), query);

        return { [resultName]: result };
    } catch (error) {
        console.error(error);
        return { [resultName]: [] }; 
    }
}

exports.handleSearchRoute = async function (url, pathSegments, request, response) {
    const searchTerm = utils.sanitizeInput(request.query && request.query.q ? request.query.q : '');


    try {
        const searchResults = {};

        searchResults = await dynamicSearch('categoriesResult', 'categories', 'categoryName', searchTerm);

        utils.statusCodeResponse(response, 200, searchResults, "application/json");
    } catch (error) {
        console.error(error);
        utils.statusCodeResponse(response, 500, "Internal Server Error", "text/plain");
    }
};