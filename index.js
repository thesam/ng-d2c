module.exports.convertString = function (code) {
    var recast = require("recast");

    var ast = recast.parse(code);
    var b = recast.types.builders;

    recast.visit(ast, {
            visitCallExpression: function (path) {
                var functionName = path.value.callee.property.name;
                if (functionName === "directive") {
                    var directiveName = path.value.arguments[0];
                    var directiveFunctionExpression = path.value.arguments[1];
                    //TODO: Do a lot of checks to see if this directive is safe to convert
                    // console.log(directiveName);
                    // console.log(directiveFunctionExpression.body.body);
                    //TODO: Verify that this is a return statement
                    var directiveReturnStatement = directiveFunctionExpression.body.body[directiveFunctionExpression.body.body.length -1];
                    console.log(directiveReturnStatement.argument);
                    path.value.callee.property.name = "component";
                    path.value.arguments[1] = directiveReturnStatement.argument || b.objectExpression([]);
                }
                this.traverse(path);
            }
        }
    );

    // console.log(ast.program.body);
    var output = recast.print(ast).code;
    return output;
}
