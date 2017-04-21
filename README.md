# ng-d2c
Converts AngularJS directives to components. Tries to avoid converting directives that can not be converted safety.

### Before
```
angular.module("foo").directive("simple", function () {
    return {
        scope: {},
        bindToController: true,
        restrict: "E"
    };
});
```
### After
```
angular.module("foo").component("simple", {
    bindings: {}
});
```

## Usage
WARNING: Always use version control software and review the changes made by this tool before committing your new components!

```
# Find and analyze directives in .js files in the current directory and subdirectories
ng-d2c
# Convert all directives which can be converted safely in the current directory and subdirectories
ng-d2c convert
```