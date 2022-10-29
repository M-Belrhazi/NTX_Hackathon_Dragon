"use strict";

let io = new IO();

// Prepare elements from DOM
// let _td_features = {};
// const columns = ["bpm", "lf", "hf", "lf/hf"]; // columns of cardiac features
// columns.forEach(function (column) {
//   _td_features[column] = document.getElementById(column);
// });
const p_bpm = document.getElementById("bpm");

const _gradientColors = [
  [2, 3, "#ff3030"], 
  [1.5, 2, "#ff5d4b"], 
  [1.1, 1.50, "#ff8a4b"], 
  [0.9, 1.1, "#ffc04b"], 
  [0.75, 0.9, "#ffe74b"], 
  [0.6, 0.75, "#9aff26"], 
  [0.45, 0.6,  "#02ff8a"], 
  [0.3, 0.45, "#20ffff"], 
  [0.15, 0.3, "#14b5ff"], 
  [0.0, 0.15, "#1173ff"], 
];
let container = document.getElementById("circle-container");
var max = 0;
var min = 0;
var column_color = null;
let start = 0;
let stage_one = 0;
let stage_two = 0;
let time = 0;
let play_button = document.getElementById("play");
let video = document.getElementById("video");

let play_video = () => {
  play_button.style.display = "none";
  start = 1;
  time = new Date().getTime();
  video.play();
};

let play_next_video = (src) => {
  let source = document.querySelector('source');
  video.appendChild(source);
  console.log("You're scared!");
  video.pause();
  source.setAttribute('src', src);
  source.setAttribute('type', 'video/mp4');
  video.load();
  video.play();
};

play_button.addEventListener("click", play_video);

// Resize circle on window
// resize();
// window.onresize = resize;

// Load settings from timeflux graph
load_settings().then((settings) => {
  let default_settings = {
    circle: {
      transition: { size: ".5s", color: ".5s" },
      column_color: "lf/hf",
    },
  };
  settings = merge(default_settings, settings);
  column_color = settings.circle.column_color;
  set_css_var("--size-transition", settings.circle.transition.size);
  set_css_var("--color-transition", settings.circle.transition.color);
});

// On connect, subscribe to usefull streams
io.on("connect", () => {
  console.log("connected");
  io.subscribe("rr");
  io.subscribe("radius");
  io.subscribe("cardiac_features");
});

// Display BPM in table
io.on("rr", (data) => {
  if (Object.keys(data).length > 0) {
    let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row
    let column = Object.keys(row)[0]; // First column
    let value = row[column]; // Value
    // Display BPM value in table
    let bpm = 60 / value;
    let new_time = new Date().getTime();
    if (start == 1 && new_time > time + 20000 && stage_one == 0 && stage_two == 0)
    {
      video.pause();
      console.log("You won!");
      start = 2;
      return ;
    }
    if (bpm > 80 && start == 1)
    {
      time = new Date().getTime();
      play_next_video("assets/fantom.mp4");
      stage_one = 1;
    }
    new_time = new Date().getTime();
    if (start == 1 && stage_one == 1 && stage_two == 0 && new_time > time + 20000)
    {
      play_next_video("assets/jumpscare.mp4");
      console.log("You did alright !");
      start = 2;
    }
    if (bpm > 90 && start == 1 && stage_one == 1)
    {
      play_next_video("assets/screamer.mp4");
      console.log("You lost");
      stage_two = 1;
      start = 2;
    }
    // set_css_var("--circle-opacity", 1);
    set_css_var("--circle-color", color_gradient(bpm / 90));
    p_bpm.innerHTML = bpm.toFixed(0);
  }
});

// while (1)
// {
//   if (start == 1 && time > time + 20)
//   {
//     video.pause();
//     console.log("You won!");
//   }
// }


//3 videos : 10 sec first, 10 sec second, pendant ce temps, if > 80 --> 
 // si pas peur au bout de 20 secondes, fini
 // si peur, passe a deuxieme video
 //if au dessus de 90 -> screamer, sinon bravo , la fille chelou qui danse



// // Scaled RR interval defines the circle radius
// io.on("radius", (data) => {
//   if (Object.keys(data).length > 0) {
//     let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row
//     let column = Object.keys(row)[0]; // First column
//     let value = row[column]; // Value
//     value = Math.tanh(value); // Ensure value between 0 and 1
//     value = 1 - Math.tanh(value); // circle radius should decrease when interval increase (ie. when BPM decrease)
//     const px = value * (max - min) + min + "px"; // Transform to pixels
//     set_css_var("--circle-width", px); // Set the width
//     set_css_var("--circle-height", px); // Set the height
//   }
// });

// lf/hf (coherence) level  defines the circle color gradient
// io.on("cardiac_features", (data) => {
//   let row = data[Object.keys(data)[Object.keys(data).length - 1]]; // Last row

//   for (let column in row) {
//     // Display feature value in table
//     _td_features[column].innerHTML = row[column].toFixed(2);
//   }
//   // Set circle color from the chosen feature
//   let value = row[column_color]; // Value between 0 and 1
//   // circle.style.backgroundColor = color_gradient(value * 100)
//   set_css_var("--circle-opacity", 0.7);
//   set_css_var("--circle-color", color_gradient(value));
// });

// Number.prototype.between = function (a, b, inclusive = true) {
//   let min = Math.min.apply(Math, [a, b]),
//     max = Math.max.apply(Math, [a, b]);
//   return inclusive ? this >= min && this <= max : this > min && this < max;
// };

// /**
//  * Return color gradient
//  *
//  * @param {number}  x variable in [0, 1]
//  */
function color_gradient(x) {
  let color = null;
  _gradientColors.forEach(function (_gradientInterval) {
    if (x >= _gradientInterval[0] && x < _gradientInterval[1]) {
      color = _gradientInterval[2];
    }
  });
  return color;
}

/**
 * Set a CSS variable
 *
 * @param {string} name: variable name in css
 * @param {string|number} value
 */
function set_css_var(name, value) {
  document.documentElement.style.setProperty(name, value);
}

/**
 * Estimate min/max of circle giveb container size
 */
// function resize() {
//   let width = container.clientWidth;
//   let height = container.clientHeight;
//   max = width < height ? width : height;
//   min = max / 4;

//   const px = max - min + min + "px"; // Transform to pixels
//   set_css_var("--circle-width", px); // Set the width
//   set_css_var("--circle-height", px); // Set the height
// }