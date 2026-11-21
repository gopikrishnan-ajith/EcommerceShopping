
/* =========================================
   FIRESTORE REST API - BASE CONFIGURATION
========================================= */


function buildFirestoreUrl(resourcePath, queryParams = {}) {
    const config = window.FIRESTORE_CONFIG;

    const baseUrl =
        `${config.baseUrl}/projects/${encodeURIComponent(config.projectId)}` +
        `/databases/${encodeURIComponent(config.databaseId)}/documents`;

    // Firestore action endpoints use a colon, without an extra slash.
    const isAction = resourcePath.startsWith(":");

    const path = isAction
        ? resourcePath
        : "/" + resourcePath
            .split("/")
            .map(part => encodeURIComponent(part))
            .join("/");

    let url = baseUrl + path;

    const params = [];

    Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(item => {
                params.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(item)}`
                );
            });
        } else if (value !== undefined && value !== null) {
            params.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            );
        }
    });

    if (params.length > 0) {
        url += "?" + params.join("&");
    }

    return url;
}


/* =========================================
   GENERIC AJAX REQUEST
========================================= */

function firestoreRequest(method, resourcePath, data, queryParams = {}) {

    const url = buildFirestoreUrl(resourcePath, queryParams);

    return $.ajax({

        url: url,

        method: method,

        contentType: "application/json",

        data: data !== undefined
            ? JSON.stringify(data)
            : undefined

    });
}


/* =========================================
   CONVERT JAVASCRIPT TO FIRESTORE VALUE
========================================= */

function encodeFirestoreValue(value) {

    if (value === null) {
        return { nullValue: null };
    }

    if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
    }

    if (typeof value === "string") {
        return { stringValue: value };
    }

    if (typeof value === "boolean") {
        return { booleanValue: value };
    }

    if (typeof value === "number") {

        if (!Number.isFinite(value)) {
            throw new Error("Invalid numeric value");
        }

        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }

        return { doubleValue: value };
    }

    if (Array.isArray(value)) {

        return {
            arrayValue: {
                values: value.map(encodeFirestoreValue)
            }
        };

    }

    if (typeof value === "object") {

        return {
            mapValue: {
                fields: encodeFirestoreFields(value)
            }
        };

    }

    throw new Error("Unsupported Firestore value type");
}


/* =========================================
   CONVERT JAVASCRIPT OBJECT TO FIRESTORE FIELDS
========================================= */

function encodeFirestoreFields(data) {

    const fields = {};

    Object.entries(data).forEach(([key, value]) => {

        if (value !== undefined) {
            fields[key] = encodeFirestoreValue(value);
        }

    });

    return fields;
}


/* =========================================
   CONVERT FIRESTORE VALUE TO JAVASCRIPT
========================================= */

function decodeFirestoreValue(value) {

    if ("stringValue" in value) return value.stringValue;

    if ("integerValue" in value) return Number(value.integerValue);

    if ("doubleValue" in value) return value.doubleValue;

    if ("booleanValue" in value) return value.booleanValue;

    if ("nullValue" in value) return null;

    if ("timestampValue" in value) return value.timestampValue;

    if ("arrayValue" in value) {
        return (value.arrayValue.values || [])
            .map(decodeFirestoreValue);
    }

    if ("mapValue" in value) {
        return decodeFirestoreFields(value.mapValue.fields || {});
    }

    if ("referenceValue" in value) return value.referenceValue;

    if ("geoPointValue" in value) return value.geoPointValue;

    if ("bytesValue" in value) return value.bytesValue;

    return null;
}


/* =========================================
   CONVERT FIRESTORE FIELDS TO JAVASCRIPT OBJECT
========================================= */

function decodeFirestoreFields(fields) {

    const result = {};

    Object.entries(fields || {}).forEach(([key, value]) => {

        result[key] = decodeFirestoreValue(value);

    });

    return result;
}


/* =========================================
   CONVERT FIRESTORE DOCUMENT
========================================= */

function decodeFirestoreDocument(document) {

    const documentId = document.name.split("/").pop();

    const data = decodeFirestoreFields(document.fields || {});

    return {
        ...data,
        Id: data.Id || documentId,
        _documentId: documentId
    };

}


/* =========================================
   GET - READ ONE DOCUMENT
========================================= */

function getDocument(collection, documentId) {

    return firestoreRequest(
        "GET",
        `${collection}/${documentId}`
    ).then(decodeFirestoreDocument);

}


/* =========================================
   GET - READ ALL DOCUMENTS WITH PAGINATION
========================================= */

function getDocuments(collection, pageSize = 20, pageToken = null) {

    return firestoreRequest(
        "GET",
        collection,
        undefined,
        {
            pageSize: pageSize,
            pageToken: pageToken
        }
    ).then(function(response) {

        return {
            documents: (response.documents || [])
                .map(decodeFirestoreDocument),

            nextPageToken: response.nextPageToken || null
        };

    });

}


/* =========================================
   POST - CREATE DOCUMENT
========================================= */

function createDocument(collection, documentId, data) {

    const fields = encodeFirestoreFields(data);

    return firestoreRequest(
        "POST",
        collection,
        { fields: fields },
        { documentId: documentId }
    ).then(decodeFirestoreDocument);

}


/* =========================================
   PATCH - UPDATE DOCUMENT
========================================= */

function updateDocument(collection, documentId, data) {

    const fields = encodeFirestoreFields(data);

    return firestoreRequest(
        "PATCH",
        `${collection}/${documentId}`,
        { fields: fields },
        {
            "updateMask.fieldPaths": Object.keys(data)
        }
    ).then(decodeFirestoreDocument);

}


/* =========================================
   DELETE - DELETE DOCUMENT
========================================= */

function deleteDocument(collection, documentId) {

    return firestoreRequest(
        "DELETE",
        `${collection}/${documentId}`
    );

}


function commitDocumentBatch(operations) {
    const config = window.FIRESTORE_CONFIG;

    const writes = operations.map(function (operation) {
        const documentName =
            `projects/${config.projectId}` +
            `/databases/${config.databaseId}` +
            `/documents/${operation.collection}` +
            `/${operation.documentId}`;

        const write = {
            update: {
                name: documentName,
                fields: encodeFirestoreFields(operation.data)
            },
            updateMask: {
                fieldPaths: Object.keys(operation.data)
            }
        };

        if (operation.type === "create") {
            write.currentDocument = {
                exists: false
            };
        }

        return write;
    });

    const url =
        `${config.baseUrl}/projects/${encodeURIComponent(config.projectId)}` +
        `/databases/${encodeURIComponent(config.databaseId)}` +
        `/documents:commit`;

    return $.ajax({
        url: url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            writes: writes
        })
    });
}



/* =========================================
   QUERY - FILTER DOCUMENTS
========================================= */

function queryDocuments(collection, field, operator, value) {

    const query = {

        structuredQuery: {

            from: [
                { collectionId: collection }
            ],

            where: {

                fieldFilter: {

                    field: {
                        fieldPath: field
                    },

                    op: operator,

                    value: encodeFirestoreValue(value)

                }

            }

        }

    };

    return firestoreRequest(
        "POST",
        ":runQuery",
        query
    ).then(function(response) {

        return response
            .filter(item => item.document)
            .map(item => decodeFirestoreDocument(item.document));

    });

}


/* =========================================
   ERROR MESSAGE HANDLER
========================================= */


function getFirestoreError(error) {
    if (error.responseJSON?.error?.message) {
        return error.responseJSON.error.message;
    }

    if (error.message) {
        return error.message;
    }

    if (error.statusText) {
        return error.statusText;
    }

    return "An unexpected database error occurred.";
}

