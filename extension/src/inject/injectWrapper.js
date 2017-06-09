loadScript(chrome.extension.getURL('src/inject/inject.js'))
loadScript(chrome.extension.getURL('src/inject/parameters.js'))
loadScript(chrome.extension.getURL('src/inject/scanner.js'), () => {
  scanner = new Scanner()
})


// Helper function to load a .js file
function loadScript(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback
    head.appendChild(script);
}

chrome.runtime.onMessage.addListener((instruction, sender, sendResponse) => {
  if (validateInstruction(instruction)) {
    this.execute(instruction)
  }
})


function execute(instruction) {
  [instruction.function]()
}

function validateInstruction(instruction) {
  return typeof instruction == 'object' && typeof instruction.function != 'undefined'
}


function scan() {
  scanner.scan()
}