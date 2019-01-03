var AUTH0_CLIENT_ID = 'IrbblpeZJRMewq8suTx0PcmHlporj6yZ';
var AUTH0_DOMAIN = 'flosser.auth0.com';
var REDIRECT_URI = window.location.href
                    .slice(0, -window.location.hash.length || window.location.href.length)
                    .slice(0, -window.location.search.length || window.location.href.length);
var API_AUDIENCE = 'https://flosser.com/api/';
