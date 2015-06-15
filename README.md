Authomator-api
==============

This is a nodejs/express/mongo based authentication server. The goal is to take
care of authentication/registration/password resets using a REST API.

When a user is registered or logged in, 3 tokens are returned which allows the
application to verify the identity:

-   An identity token that describes the identity of the user

-   An access token, which is reduced in size to only include the `sub` field
    (jwt subject) that uniquely identifies the user

-   A refresh token which can be used to request a new set of tokens without
    requiring the user to re-authenticate.

Dependencies
------------

-   mongodb

 

Launch the server
-----------------

*(Assuming you've* [installed Node.js and npm and have a mongodb instance
running][1]*)*

[1]: <http://www.joyent.com/blog/installing-node-and-npm/>

Fork this repository, then clone your fork, and run this in your newly created
directory:

 

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm install
npm start
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

Your authomator API is now up and running! However, it will use defaults that
will probably not be useful.. so read on how to configure it to do some
authomation for you...

 

### Configure the authomator service

Copy the \`config/index.js\` to \`config/local.js\` and start setting up...

 

JWT Tokens contents
===================

 

### IdentityToken contents:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{ 
    sub: '5575e89dd9ebb6c28fa5b358',
    iat: 1432750376,
    exp: 1432753976,
    aud: 'authomator-audience',
    iss: 'authomator',
    emailVerified: false,
    identities: {
        local : {
            email: 'test@test.com'
        }
    },
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### AccessToken contents:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{
    sub: '5575e89dd9ebb6c28fa5b358',
    iat: 1432892404,
    exp: 1432896004,
    aud: 'authomator-audience',
    iss: 'authomator'
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### RefreshToken contents:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{
    sub: '5575e89dd9ebb6c28fa5b358',
    iat: 1432892404,
    exp: 1432896004,
    aud: 'authomator#refresh',
    iss: 'authomator'
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

To consume less bandwith it is advisable to use the accessToken for
authenticating requests to a backend. This token only contains the `sub` in
order to lower the size of each request.

However the identityToken is usefull as it contains all info about the user, so
that a profile can be build in some backend or used in the frontend.

 

Using the service
=================

 

Registering users (POST /api/auth/signup)
-----------------------------------------

 

### Parameters (json body)

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{
    "email":      The email of the user to register
    "password":   The password for the new user
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Codes

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
200 Ok                       User signup successful
422 Unprocessable Entity     Wrong parameters or user exists
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Data

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{ 
        "it":"it.token.data",
        "at":"at.token.data", 
        "rt":"rt.token.data"
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

For more information about the JWT tokens see above for the info about the
tokens.

 

 

Logging in users (POST /api/auth/login)
---------------------------------------

 

### Parameters (json body)

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{
    "email":      The email of the user to register
    "password":   The password for the new user
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Codes

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
200 Ok                       User login was successful
401 Unauthorized             User login failed (invalid credentials)
422 Unprocessable Entity     Wrong parameters (see body for error info)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Data

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{ 
        "it":"it.token.data",
        "at":"at.token.data", 
        "rt":"rt.token.data"
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

For more information about the JWT tokens see above for the info about the
tokens.

 

 

Send password reset mail (POST /api/auth/reset/mail)
----------------------------------------------------

 

### Parameters (json body)

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{
    "email":      The email of the user to register
    "url":        The link that needs to be used in the email
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

The url specified in the parameters is checked if it allowed (see
`config.mail.resetLinkAllowedDomains`). The protocol is also checked if
non-https locations are allowed (see `config.mail.resetLinkAllowNonSecure`).  
The url wil have a query parameter added with the reset token, the name of this
parameter is `reset`. For example this would be the url sent in the email:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
https://url.as.specied/with/paths?andOriginalparam=OK&reset=<reset token>
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Codes

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
201 Ok                       Mail was sent correctly
400 Bad Request              Email is not in use
403 Forbidden                Url is not acceptable (see body for more info)
422 Unprocessable Entity     Wrong parameters (see body for error info)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Data

None

 

 

Refreshing tokens (POST /api/refresh/:refreshtoken)
---------------------------------------------------

 

### Parameters (json body)

None (refreshToken is given in url). Where `<refreshToken>` is the Refresh token
you got when the user logged in or registered. If the token is valid the server
will give you 3 new tokens in a json.

 

### Response Codes

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
200 Ok                       User login was successful
400 Bad Request              Invalid refresh token or invalid user
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 

### Response Data

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{ 
        "it":"it.token.data",
        "at":"at.token.data", 
        "rt":"rt.token.data"
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 
