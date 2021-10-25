function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    var uri = request.uri;
    
    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    } 
    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }

    if (host === 'www.lvthillo.com') {    
        var response = {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: { 
                'location': { "value": `https://lvthillo.com${uri}` } 
            }
        };

        return response;
    }

    return request;
}