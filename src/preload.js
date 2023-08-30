const { readFile } = require('fs/promises');
const {basename} = require('path')

window.preload = {
    readFile: function(path) {
        return readFile(path);
    },
    basename: function(path) {
        return basename(path)
    }
}