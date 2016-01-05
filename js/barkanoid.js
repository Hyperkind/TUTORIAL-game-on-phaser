// creates the game object
var game = new Phaser.Game(
  800, 600,                   //sets the background resolution
  Phaser.AUTO,                //allow Phaser to determine canvas or WebGL
  'barkanoid',                //the HTML element ID we connect Phaser to
  {                           //Functions (callbacks) for Phaser to call in
    preload: phaserPreload,   //in different states of its execution
    create: phaserCreate,
    update: phaserUpdate
  }
);

var ball;
var paddle;
var tiles;
var livesText;
var introText;
var background;

var ballOnPaddle = true;
var lives = 3;
var score = 0;

var defaultTextOptions = {
  font: '20px Arial',
  align: 'left',
  fill: '#ffffff'
};

var boldTextOptions = {
  font: '40px Arial',
  fill: '#ffffff',
  align: 'center'
};

// preload callback used to load all assets into phaser
function phaserPreload() {
  // loads the background img
  game.load.image("background", "/assets/background.jpg");
  // loads all the game tiles
  game.load.image('tile0', '/assets/tile0.png');
  game.load.image('tile1', '/assets/tile1.png');
  game.load.image('tile2', '/assets/tile2.png');
  game.load.image('tile3', '/assets/tile3.png');
  game.load.image('tile4', '/assets/tile4.png');
  game.load.image('tile5', '/assets/tile5.png');
  // loads the paddle
  game.load.image('paddle', '/assets/paddle.png');
  // loads the ball
  game.load.image('ball', '/assets/ball.png');
}

// create callback used to create all game related objects, set states and other pre-game running details
function phaserCreate() {
  // starts the games physics
  game.physics.startSystem(Phaser.Physics.ARCADE);
  // allows the ball to collide with walls except the bottom
  game.physics.arcade.checkCollision.down = false;
  // displays the background
  background = game.add.tileSprite(0, 0, 800, 600, "background");

  // creates the tile group
  tiles = game.add.group();
  tiles.enableBody = true;
  tiles.physicsdBodyType = Phaser.Physics.ARCADE;
  // creating N tiles into the tile group
  // creates the rows
  for (var y = 0; y < 4; y++) {
    // creates the columns
    for (var x = 0; x < 15; x++) {
      // randomizes the tile sprite used for each tile
      var randomTileNumber = Math.floor(Math.random() * 6);
      var tile = tiles.create(120 + (x * 36), 100 + (y * 52), 'tile' + randomTileNumber);
      tile.body.bounce.set(1);
      // prevents the tile from moving when hit
      tile.body.immovable = true;
    }
  }

  paddle = game.add.sprite(game.world.centerX, 500, 'paddle');
  paddle.anchor.setTo(0.5, 0.5);
  game.physics.enable(paddle, Phaser.Physics.ARCADE);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.set(1);
  paddle.body.immovable = true;

  // loads the ball into the game
  ball = game.add.sprite(game.world.centerX, paddle.y - 16, 'ball');
  ball.anchor.set(0.5);
  ball.checkWorldBounds = true;
  // applies game physics to the ball
  game.physics.enable(ball, Phaser.Physics.ARCADE);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1);
  // when the ball goes out of bounds, calls the death function
  ball.events.onOutOfBounds.add(helpers.death, this);

  // sets up the score text
  scoreText = game.add.text(32, 550, 'score: 0', defaultTextOptions);
  // sets up the lives text
  livesText = game.add.text(680, 550, 'lives: 3', defaultTextOptions);
  introText = game.add.text(game.world.centerX, 400, '- click to start -', boldTextOptions);
  introText.anchor.setTo(0.5, 0.5);
  game.input.onDown.add(helpers.release, this);

}

// phaser engines update loop that gets called every phaserUpdate
function phaserUpdate() {
  paddle.x = game.input.x;

  // keeps the player within the bounds of the game
  if (paddle.x < 24) {
    paddle.x = 24;
  } else if (paddle.x > game.width - 24) {
    paddle.x = game.width - 24;
  }

  if (ballOnPaddle) {
    // setting the ball on the paddle when player has it
    ball.body.x = paddle.x;
  } else {
    // checks for collisions, the function gets called when the n collides with x
    game.physics.arcade.collide(ball, paddle, helpers.ballCollideWithPaddle, null, this);
    game.physics.arcade.collide(ball, tiles, helpers.ballCollideWithTile, null, this);
  }
}

// set of helper functions
var helpers = {
  // releases the ball from the paddle
  release: function() {
    if (ballOnPaddle) {
      ballOnPaddle = false;
      ball.body.velocity.y = -300;
      ball.body.velocity.x = -75;
      introText.visible = false;
    }
  },

  // when the ball goes out of bounds
  death: function() {
    lives--;
    livesText.text = 'lives: ' + lives;

    if (lives === 0) {
      helpers.gameOver();
    } else {
      ballOnPaddle = true;
      ball.reset(paddle.body.x + 16, paddle.y - 16);
    }
  },

  // when you run out of lives
  gameOver: function() {
    ball.body.velocity.setTo(0, 0);
    introText.text = 'Game Over!';
    introText.visible = true;
  },

  ballCollideWithTile: function(ball, tile) {
    tile.kill();

    // increases the score when tiles are killed
    score += 10;
    scoreText.text = 'score: ' + score;

    // are there any tiles left?
    if (tiles.countLiving() <= 0) {
      // start new level
      score += 1000;
      scoreText.text = 'score: ' + score;
      introText.text = '- Next Level -';

      // attaches the ball to the players paddle on new level
      ballOnPaddle = true;
      ball.body.velocity.set(0);
      ball.x = paddle.x + 16;
      ball.y = paddle.y - 16;

      // tells tiles to revive
      tiles.callAll('revive');
    }
  },

  // callback for when the ball collides with the players paddle
  ballCollideWithPaddle: function(ball, paddle) {
    var diff = 0;

    // bounce physics for the ball movement
    if (ball.x < paddle.x) {
      // ball is on the left-hand side
      diff = paddle.x - ball.x;
      ball.body.velocity.x = (-10 * diff);
    } else if (ball.x > paddle.x) {
      // ball is on the right-hand side
      diff = ball.x - paddle.x;
      ball.body.velocity.x = (10 * diff);
    } else {
      // ball is in the middle
      // adds a little random x to prevent from straight up bounce
      ball.body.velocity.x = 2 + Math.random() * 8;
    }
  }
};