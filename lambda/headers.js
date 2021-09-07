function handler(event) {
    var response = event.response;
    var headers = response.headers;
    
    headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload'}; 
    headers['content-security-policy'] = { value: "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'"}; 
    headers['x-content-type-options'] = { value: 'nosniff'}; 
    headers['x-xss-protection'] = {value: '1; mode=block'};
    headers['referrer-policy'] = {value: 'same-origin'};
    headers['x-frame-options'] = {value: 'DENY'};
    
    return response;
}