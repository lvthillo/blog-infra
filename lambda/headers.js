function handler(event) {
    var response = event.response;
    var headers = response.headers;
    
    headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload'}; 
    //clashes with hugo inline scripts
    //headers['content-security-policy'] = { value: "default-src https://www.google-analytics.com; img-src 'self' https://www.google-analytics.com ssl.google-analytics.com www.google.com analytics.google.com; connect-src www.google-analytics.com stats.g.doubleclick.net ampcid.google.com analytics.google.com; script-src 'self' https://www.google-analytics.com https://ssl.google-analytics.com https://www.googletagmanager.com https://google-analytics.com 'sha256-0CvETIgOK2clmfWGF5sSIEiekhHQQDQzs6qA3VIIZiU=' 'sha256-a72MzDH/lZnJJFjeA4unJdesRzjwr3TeZVNYucgNkJk=' 'sha256-YuKrUzfHifZMvulN9J+ICcG12MJdVW5ShCH03Gb4RZ4=' 'sha256-X5avg43RTxt2cSum+E3xICbowEMaOBxeBiNh05CXDTY=' 'sha256-4O+m6kk1wMpldFXFB8ldHkY/86U5xWfKtcSWERnGmhA=' 'sha256-z2izUJPvGYTnFTpFb7prEv2Soyt9qIS/B/aWU80v7As=' 'sha256-0CvETIgOK2clmfWGF5sSIEiekhHQQDQzs6qA3VIIZiU=' 'sha256-a72MzDH/lZnJJFjeA4unJdesRzjwr3TeZVNYucgNkJk='; style-src 'self' https://cdnjs.cloudflare.com; object-src 'none'; frame-ancestors 'none'"};
    headers['x-content-type-options'] = { value: 'nosniff'}; 
    headers['x-xss-protection'] = {value: '1; mode=block'};
    headers['referrer-policy'] = {value: 'same-origin'};
    headers['x-frame-options'] = {value: 'DENY'};
    
    return response;
}