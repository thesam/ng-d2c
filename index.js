#!/usr/bin/env node

var d2c = require("./lib/lib.js");

var args = process.argv.slice(2);

var analyzedFiles = d2c.analyzeFiles("**/*.js");
var good = [];
var bad = [];
analyzedFiles.forEach(function (file) {
    if (file.result.errors.length > 0) {
        bad.push(file);
    } else {
        good.push(file);
    }
});
good.forEach(function (file) {
    console.log("OK: " + file.file);
});
bad.forEach(function (file) {
    console.log("FAIL: " + file.file);
    file.result.errors.forEach(function (err) {
        console.log("\t" + err);
    });
});
console.log("OK: "+good.length+" (Can be converted)");
console.log("FAIL: " + bad.length + " (Can not be converted until errors are fixed)");
if (args[0] === "convert") {
    good.forEach(function(fileToConvert) {
        var filename = fileToConvert.file;
        console.log("Converting: " + filename);
        d2c.convertFiles([filename]);
    });
}
