#!/usr/bin/env node

var d2c = require("../lib/lib.js");

var args = process.argv.slice(2);

var filesToScan;
if (args[0] === "convert") {
    filesToScan = args[1];
} else {
    filesToScan = args[0];
}
filesToScan = filesToScan || "**/*.js";

var directiveFiles = d2c.analyzeDirectiveFiles(filesToScan);
var good = [];
var bad = [];
directiveFiles.forEach(function (file) {
    if (file.errors.length > 0) {
        bad.push(file);
    } else {
        good.push(file);
    }
});
if (args[0] === "convert") {
    good.forEach(function(fileToConvert) {
        var filename = fileToConvert.path;
        console.log("Converting: " + filename);
        d2c.convertFile(filename);
    });
} else {
    good.forEach(function (file) {
        console.log("OK: " + file.path);
    });
    bad.forEach(function (file) {
        console.log("FAIL: " + file.path);
        file.errors.forEach(function (err) {
            console.log("\t" + err);
        });
    });
    console.log("OK: "+good.length+" (Can be converted)");
    console.log("FAIL: " + bad.length + " (Can not be converted until errors are fixed)");
}
