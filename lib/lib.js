var recast = require("recast");
var b = recast.types.builders;
var glob = require("glob");

module.exports = {
    analyzeDirectiveFiles: analyzeDirectiveFiles,
    convertFile: convertFile,
    analyzeString: analyzeString,
    convertString: convertString,
};

function analyzeDirectiveFiles(globPattern) {
    var foundFiles = glob.sync(globPattern);
    return foundFiles.map(function (file) {
        var result = analyzeFile(file);
        result.path = file;
        return result;
    }).filter(function (file) {
        return file.hasDirective;
    });
}

function analyzeString(code) {
    return visitCode(code, false);
}

function convertString(code) {
    return visitCode(code, true);
}

function analyzeFile(file) {
    var fs = require("fs");
    var content = fs.readFileSync(file, "utf8");
    return analyzeString(content);
}

function convertFile(file) {
    var fs = require("fs");
    var content = fs.readFileSync(file, "utf8");
    var converted = convertString(content);
    if (converted.errors.length === 0 && converted.generatedJs) {
        fs.writeFileSync(file, converted.generatedJs);
    } else {
        throw new Error("Tried to convert non-compatible directive!");
    }
}

function visitCode(code, shouldConvert) {

    var ast = recast.parse(code);

    var errors = [];
    var hasDirective = false;

    recast.visit(ast, {
            visitCallExpression: function (path) {
                //TODO: Test for this if-statement
                if (path.value.callee.property) {
                    var functionName = path.value.callee.property.name;
                    //TODO: Test for number of arguments
                    if (functionName === "directive" && path.value.arguments.length === 2) {
                        hasDirective = true;
                        errors = visitDirective(path, shouldConvert);
                    }
                }
                this.traverse(path);
            }
        }
    );

    var output = undefined;
    if (hasDirective && errors.length === 0 && shouldConvert) {
        output = recast.print(ast).code;
    }
    return {
        generatedJs: output,
        errors: errors,
        hasDirective: hasDirective
    };
}

function visitDirective(path, shouldConvert) {
    var errors = [];
    var directiveName = path.value.arguments[0].value;
    var directiveReturnStatement = null;
    //TODO: Verify that this is a function
    var directiveFunctionExpression = path.value.arguments[1];
    if (directiveFunctionExpression.params.length > 0) {
        errors.push("Directive function has injected parameters (Move them to the controller)")
    }
    if (directiveFunctionExpression &&
        directiveFunctionExpression.body &&
        directiveFunctionExpression.body.body &&
        directiveFunctionExpression.body.body.length > 0) {
        //TODO: Verify that this is a return statement
        directiveReturnStatement = directiveFunctionExpression.body.body[directiveFunctionExpression.body.body.length - 1];
    }
    if (directiveReturnStatement) {
        var properties = [];
        var directiveProperties;
        var returnObj = directiveReturnStatement.argument;
        if (returnObj && returnObj.properties) {
            directiveProperties = returnObj.properties;
        } else {
            errors.push("Directive does not return an object");
            return errors;
        }
        var propertiesToCopy = {};
        var bindingsProperties = {};
        var whitelist = ["controller", "controllerAs", "require", "template", "templateUrl", "transclude"];
        var restrictedToElement = false;
        directiveProperties.forEach(function (prop) {
            var propKey = prop.key.name || prop.key.value;
            if (whitelist.indexOf(propKey) !== -1) {
                if (propKey === "controller" && prop.value.type === 'FunctionExpression' && prop.value.body.body.length > 0) {
                    var originalBody = prop.value.body;
                    var newBlockStatement = b.blockStatement([b.expressionStatement(b.assignmentExpression("=",b.memberExpression(b.thisExpression(),b.identifier("$onInit")),b.functionExpression(null,[],originalBody)))]);
                    propertiesToCopy[propKey] = b.functionExpression(prop.value.id,prop.value.params,newBlockStatement);
                } else {
                    propertiesToCopy[propKey] = prop.value;
                }
            } else if (["scope", "bindToController"].indexOf(propKey) !== -1) {
                bindingsProperties[propKey] = prop.value;
            } else if (propKey === "restrict") {
                if (prop.value && prop.value.value === "E") {
                    restrictedToElement = true;
                }
            } else {
                errors.push("Property cannot be converted safely: " + propKey);
            }
        });
        if (!restrictedToElement) {
            errors.push("Directive is not restricted to element (E)");
        }
        if (!bindingsProperties["scope"] || bindingsProperties["scope"].type !== "ObjectExpression") {
            errors.push("Directive does not use isolate scope");
        }
        if (!bindingsProperties["bindToController"]) {
            errors.push("Directive does not use bindToController");
        }
        if (errors.length === 0 && shouldConvert) {
            // This is the point of no return, where we start rewriting the AST!
            path.value.callee.property.name = "component";
            if (bindingsProperties["bindToController"].type === "ObjectExpression") {
                properties.push(b.property("init", b.identifier("bindings"), bindingsProperties["bindToController"]));
            } else {
                properties.push(b.property("init", b.identifier("bindings"), bindingsProperties["scope"]));
            }
            for (var key in propertiesToCopy) {
                properties.push(b.property("init", b.identifier(key), propertiesToCopy[key]));
            }
            path.value.arguments[1] = b.objectExpression(properties);
        }
    }
    return errors;
}
