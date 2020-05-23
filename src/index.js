const {Globe} = require('./globe');

let globe = new Globe(window.innerWidth, window.innerHeight);
globe.draw()
document.body.appendChild(globe.node());
document.body.style.setProperty('margin', '0')