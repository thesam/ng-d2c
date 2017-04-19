# ng-d2c
A tool for converting AngularJS directives to components. Tries to avoid converting directives that can not be converted safety.


## Usage
WARNING: Always use version control software and review the output of this tool before committing your new components!

```
# Find and analyze directives in .js files in the current directory and subdirectories
ng-d2c
# Convert all directives which can be converted safely in the current directory and subdirectories
ng-d2c convert
```