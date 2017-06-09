class Scanner {

  constructor () {
    this.parameters = new Parameters
    this.target = document.URL
    this.contexts = [];
    this.payloads = {};
  }

  scan () {
    /*this.parameters.get().forEach((param) => {
      console.log(this.target, param)
    })*/

    this.url = this.target
    console.log('Scanning ' + this.url)

    // TODO: Test which characters are reflected

    // Generate a random string to identify reflected payload
    var token = this.generateToken(8);

    // Base request to identify context
    this.loadUrl(this.appendStringToParams(this.url, token), 'GET', (response) => {
      this.getReflectedInstances(token, response, this.executePayloads);
    });
  }

  // Tests array of payloads
  executePayloads(payloadsToTest) {
    console.log(payloadsToTest);
    // add script to intercept alert
    var actualCode = '(' + function() {
      falert =  function(payload) {
        console.log('Yay! alert registered for payload ' + payload);
      }
    } + ')();';
    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head||document.documentElement).appendChild(script);
    script.remove();
    for (var i = 0; i < payloadsToTest.length; i++) {
      // insert the payload id into payload
      let modifiedPayload = payloadsToTest[i].substring(0,
        payloadsToTest[i].lastIndexOf("alert(") + "alert(".length) + '\'' + xssHamster.scanner.appendStringToParams(xssHamster.scanner.url, payloadsToTest[i]).replace(/'/g, "\\'") + '\'' +
        payloadsToTest[i].substring(payloadsToTest[i].lastIndexOf("alert(") + "alert(".length);
      console.log(xssHamster.scanner.appendStringToParams(xssHamster.scanner.url, modifiedPayload))
      xssHamster.scanner.loadUrl(xssHamster.scanner.appendStringToParams(xssHamster.scanner.url, modifiedPayload), 'GET', (response) => {
        var div = document.createElement('div');
        div.innerHTML = '<div style="display: none;">' + response + '</div>';
        (document.head||document.documentElement).appendChild(div);
        // div.remove();
      });
    }
  }

  // Generates a random token of size length
  generateToken(length) {
    return (Math.random().toString(36)+'00000000000000000').slice(2, length + 2);
  }

  // Load content of url asynchronously
  // TODO: support authentication, post data
  loadUrl(url, method, callback) {
    console.log('loading ' + url)

    fetch(url, { method: 'GET'}).then((response) => {
      return response.text();
    }).then((text) => {
      callback(text);
    });
  }

  // returns an array of query parameters
  getQueryParams(url) {
      var request = {};
      var pairs = url.substring(url.indexOf('?') + 1).split('&');
      for (var i = 0; i < pairs.length; i++) {
          if (!pairs[i])
              continue;
          var pair = pairs[i].split('=');
          request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
       }
       return request;
  }

  // Identify parameters of query
  // TODO: look in url as well
  appendStringToParams(url, string) {
    var originalParams = this.getQueryParams(url);
    var updatedParams = {};
    for (var key in originalParams) {
      if (Object.prototype.hasOwnProperty.call(originalParams, key)) {
          updatedParams[key] = originalParams[key] + string;
      }
    }
    return this.updateUrl(url, updatedParams);
  }

  // returns the url with the specified params
  updateUrl(url, params) {
    return url.split('?')[0] + '?' + Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
  }

  //gets instances where payload is completely reflected
  getReflectedInstances(payload, response, callback) {
    var payloadsToTest = [];
    if (response.includes(payload)) {
      console.log('Using payloads for type general')
      payloadsToTest=payloadsToTest.concat(this.payloads.general)
    }
    this.prepareDOM(response, payload, (node, type) => {
      console.log('found match with ' + node.tagName + type.typeName);
      // test to see if this matches one of our contexts
      for (var i=0; i < this.contexts.length; i++) {
        if(this.contexts[i].type.toUpperCase() == node.tagName.toUpperCase()) {
          console.log('Using payloads for type ' + this.contexts[i].type)
          if (this.contexts[i].matches.includes('*')
            || this.contexts[i].matches.includes(type.attributeName.toLowerCase()) ) {
            payloadsToTest = payloadsToTest.concat(this.payloads[this.contexts[i].file.split('.')[0]]);
          }
        }
      }
    }, () => {
      callback(payloadsToTest);
    });
  }

  prepareDOM(html, search, callback, finished) {
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(html, "text/html");
    this.iterateDOM(htmlDoc, search, callback, finished);
  }

  iterateDOM(node, search, callback, finished, level=0) {
    var parentNode = node;
    var hasGrandchildren = false;
    var node = node.firstChild;
    while(node) {
        if (node.hasChildNodes()) {
          this.iterateDOM(node, search, callback, finished, level+1);
          hasGrandchildren = true;
        }
        if (node.tagName && node.hasAttributes()) { //check attributes
          for (var attribute of node.attributes) {
            if (attribute.value.includes(search)) {
              callback(node, {
                'typeName': 'attribute',
                'attributeName': attribute.name
              })
            }
          }
        }
        node = node.nextSibling;
    }
    if (!hasGrandchildren) {
      if (parentNode.innerHTML.includes(search)) {
        callback(parentNode, {
          'typeName': 'innerHTML'
        });
      }
    }
    if (level == 0) {
      finished();
    }
  }
}
