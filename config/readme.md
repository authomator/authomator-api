Config module
=============

 

-   All variables in `vars.js` are first defined

    These variables are reused in index.js to define variables that might change
    due to environment variables. This file also defines which environment is
    used by default. (default = `development`)

 

-   All variables in index.js are used as defaults, using variables from
    `vars.js`

 

-   If a local.js exists it is used to merge over the previous result

 

-   The resulting config from all operations above is exported
