module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "jest/globals": true
     },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": ["jest"],
    "rules": {
        "indent": [
            "error",
            "tab"
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single",
            { avoidEscape: true }
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-console": [
            "warn"
        ],
    }
};