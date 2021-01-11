# geo-game

[A very cool geography game I made for fun.](http://geo.gaurmand.com)


  - Answer geography questions by clicking on the globe to make your guess
  - The closer your guess is to the correct answer, the more points you get
  - Click and drag to rotate the globe
  - Use the mouse wheel zoom the globe in and out

  ![gif](/screenshots/geo2.gif)

### Tech
--------
Tech/Resources I used to help make this project

* [D3](https://github.com/d3/d3) - Used to render and interact with the globe.
* [webpack](https://github.com/webpack/webpack) - Used to bundle js code and assets.
* [Natural Earth](https://www.naturalearthdata.com/downloads/) - Source of geographic data.

### Building and Testing
-----------------------
Requires Node.js and npm.
Clone repo, install dependencies, build, and open in browser.

```sh
$ git clone https://github.com/gaurmand/geo-game.git
$ cd geo-game
$ npm i
$ npm run test
```

### Todo
---------
 - Improve difficulty settings
 - Improve performance/user experience
 - Add city guessing mode