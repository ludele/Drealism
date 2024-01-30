const utils = require('../utils');

exports.getCategories = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const categories = await db.collection('categories').find().toArray();

        utils.statusCodeResponse(response, 200, JSON.stringify(categories), 'application/json');
    } catch (error) {
        console.error('Error getting categories:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.createCategory = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();

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