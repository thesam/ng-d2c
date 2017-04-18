module.exports.convertString = function (code) {
    var recast = require("recast");

    var ast = recast.parse(code);
    var b = recast.types.builders;

    var errors = [];

    recast.visit(ast, {
            visitCallExpression: function (path) {
                var functionName = path.value.callee.property.name;
                if (functionName === "directive") {
                    var directiveName = path.value.arguments[0];
                    var directiveReturnStatement = null;
                    var directiveFunctionExpression = path.value.arguments[1];
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
                            //TODO
                            directiveProperties = [];
                        }
                        var directivePropertyKeys = {};
                        var whitelist = ["scope"];
                        directiveProperties.forEach(function (prop) {
                            if (whitelist.indexOf(prop.key.name) !== -1) {
                                directivePropertyKeys[prop.key.name] = "TODO";
                            } else {
                                errors.push("Property cannot be converted safely: " + prop.key.name);
                            }
                        });
                        if (errors.length === 0) {
                            path.value.callee.property.name = "component";
                            if (directivePropertyKeys.hasOwnProperty("scope")) {
                                properties.push(b.property("init", b.identifier("bindings"), b.objectExpression([])));
                            }
                        }
                        path.value.arguments[1] = b.objectExpression(properties);
                    }
                }
                this.traverse(path);
            }
        }
    );

    var output = undefined;
    if (errors.length === 0) {
        output = recast.print(ast).code;
    }
    return {
        code: output,
        errors: errors
    };
}
