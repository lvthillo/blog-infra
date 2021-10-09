function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;

    if (host === 'www.lvthillo.com') {    
        var response = {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: { 
                'location': { "value": `https://lvthillo.com${request.uri}` } 
            }
        };

        return response;
    }

    return request;
}