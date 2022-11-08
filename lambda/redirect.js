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

    if (host.startsWith('www')) {
        // Cut www. from host
        var redirect_host = host.split("www.").pop();
        var response = {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: { 
                'location': { "value": `https://${redirect_host}${uri}` } 
            }
        };

        return response;
    }

    return request;
}