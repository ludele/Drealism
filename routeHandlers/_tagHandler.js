// Un-needed

const utils = require('../utils');

exports.createTag = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();

        const { contentId, tagName } = request.body;
        const tagId = utils.generateTagId();

        await db.collection('tags').insertOne({
            tagId,
            contentId,
            tagName,
        });

        utils.statusCodeResponse(response, 201, JSON.stringify({ tagId }), 'application/json');
    } catch (error) {
        console.error('Error creating tag:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.getTagsByContentId = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const contentId = pathSegments[1];
        const tags = await db.collection('tags').find({ contentId }).toArray();

        utils.statusCodeResponse(response, 200, JSON.stringify(tags), 'application/json');
    } catch (error) {
        console.error('Error getting tags by content ID:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.searchContentByTags = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const { tagNames } = request.body;
        
        const contentMatchingTags = await db.collection('tags').aggregate([
            {
                $match: { tagName: { $in: tagNames } }
            },
            {
                $lookup: {
                    from: 'content', 
                    localField: 'contentId',
                    foreignField: '_id', 
                    as: 'content'
                }
            }
        ]).toArray();

        utils.statusCodeResponse(response, 200, JSON.stringify(contentMatchingTags), 'application/json');
    } catch (error) {
        console.error('Error searching content by tags:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.updateTag = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const tagId = pathSegments[1];
        const { tagName } = request.body;

        const result = await db.collection('tags').updateOne(
            { tagId },
            {
                $set: {
                    tagName,
                },
            }
        );

        if (result.modifiedCount > 0) {
            utils.statusCodeResponse(response, 200, 'Tag updated successfully', 'text/plain');
        } else {
            utils.statusCodeResponse(response, 404, 'Tag not found', 'text/plain');
        }
    } catch (error) {
        console.error('Error updating tag:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};

exports.deleteTag = async function (url, pathSegments, request, response) {
    try {
        const db = await utils.connectToDatabase();
        const tagId = pathSegments[1];

        const result = await db.collection('tags').deleteOne({ tagId });

        if (result.deletedCount > 0) {
            utils.statusCodeResponse(response, 200, 'Tag deleted successfully', 'text/plain');
        } else {
            utils.statusCodeResponse(response, 404, 'Tag not found', 'text/plain');
        }
    } catch (error) {
        console.error('Error deleting tag:', error);
        utils.statusCodeResponse(response, 500, 'Internal Server Error', 'text/plain');
    }
};