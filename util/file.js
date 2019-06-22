const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {  // fs.unlink to delete the file (from filepath)
        if (err) {
            throw (err);
        }
    });
}

exports.deleteFile = deleteFile;