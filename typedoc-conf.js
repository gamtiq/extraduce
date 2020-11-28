var packageData = require("./package.json");

module.exports = {
    "entryPoint": '"src/index"',
    "excludeNotExported": true,
    "gitRevision": "main",
    "readme": "README.md",
    "theme": "./node_modules/typedoc-light-theme/src",

    "projectName": {
        "link": true,
        "before": '<span class="title">&Escr;&xscr; </span>'
    },
    "links": [
        {
            "text": "GitHub repo",
            "href": packageData.homepage,
            "style": "margin-left: 3rem;"
        }
    ],
    "createFile": ".nojekyll"
};
