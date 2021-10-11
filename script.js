var cvs
var ctx

window.addEventListener("load", init);
function init() {
  cvs = document.getElementById("cvs");
  ctx = cvs.getContext("2d");

  document.body.style.margin = "0px";
  document.body.style.overflow = "hidden";

  function fullscreen() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    Painter.draw();
  }
  window.addEventListener("resize", fullscreen);
  fullscreen();
}

function setZoom(id) {
  switch(id) {
    case 0:
      centerX = -0.5
      centerY = 0
      zoom = 2
      break
    case 1:
      centerX = -1.05
      centerY = 0.305
      zoom = 0.5
      break
    case 2:
      centerX = -1.256
      centerY = 0.381
      zoom = 0.02
      break
    case 3:
      centerX = -0.02
      centerY = 0.792
      zoom = 0.05
      break
    case 4:
      centerX = -0.040
      centerY = 0.800
      zoom = 0.01
      break
    case 5:
      centerX = -0.0358
      centerY = 0.80246
      zoom = 0.0005
      break
    case 6:
      centerX = 0.42
      centerY = 0.34
      zoom = 0.05
      break
    case 7:
      centerX = -0.16
      centerY = -1.035
      zoom = 0.05
      break
    case 8:
      centerX = -1.985505512
      centerY = 0.0000002037
      zoom = 0.000000005
      break
    case 9:
      centerX = 0.2500997
      centerY = 0.00000152
      zoom = 0.0000005
      break
    case 10:
      centerX = 0.2500999
      centerY = 0.00000159
      zoom = 0.00000005
      break
  }
}
const squareSize = 8;
const iterations = 25000;
const scheme = 2;
const cycle = 100;
const moving = true;

if(localStorage.centerX) {
  centerX = Number(localStorage.centerX);
  centerY = Number(localStorage.centerY);
  zoom = Number(localStorage.zoom);
}

const gradient = [
  [0, 0, 7, 100],
  [0.5, 32, 107, 203]
];

window.addEventListener('click', (e) => {
  if(moving) {
    centerX += zoom * (e.clientX / cvs.width - 0.5);
    centerY += -cvs.height / cvs.width * zoom * (e.clientY / cvs.height - 0.5)
    Painter.draw();
  }
});

window.addEventListener('wheel', (e) => {
  if(moving) {
    if(e.deltaY > 0){
      zoom *= 2
    } else {
      zoom /= 2
    }
    Painter.draw();
  }
});

const Painter = {
  draw: () => {
    localStorage.centerX = centerX;
    localStorage.centerY = centerY;
    localStorage.zoom = zoom;

    let y = 0;
    function callback() {
      Painter.drawRow(y);
      y += squareSize;
      if(y < cvs.height) window.requestAnimationFrame(callback);
    }
    callback();
  },
  drawRow: (y) => {
    if(y === undefined) y = 0;
    for(let x = 0; x < cvs.width; x += squareSize) Painter.drawPixel(x, y);
  },
  drawPixel: (x, y) => {
    let tx = zoom * (x / cvs.width - 0.5) + centerX;
    let ty = (cvs.height / cvs.width) * zoom * (y / cvs.height - 0.5) - centerY;
    var v = mandelbrot(tx, ty);
    if(v === Infinity) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, squareSize, squareSize);
    } else {
      switch(scheme) {
          case 0:
            a = v * 5;
            r = a / 2;
            g = 0;
            b = a / 2;
            ctx.fillStyle = "rgb("+r+","+g+","+b+")";
            break;
          case 1:
            hue = v % 360
            ctx.fillStyle = "hsl("+hue+",50%,50%)"
            break
          case 2:
            p = (v % cycle) / cycle
            if(p > 0.8575){
              r = (0 - 0) * (p - 0.8575) / (1 - 0.8575) + 0
              g = (7 - 2) * (p - 0.8575) / (1 - 0.8575) + 2
              b = (100 - 0) * (p - 0.8575) / (1 - 0.8575) + 0
            }else if(p > 0.6425){
              r = (0 - 255) * (p - 0.6425) / (0.8575 - 0.6425) + 255
              g = (2 - 170) * (p - 0.6425) / (0.8575 - 0.6425) + 170
              b = (0 - 0) * (p - 0.6425) / (0.8575 - 0.6425) + 0
            }else if(p > 0.42){
              r = (255 - 237) * (p - 0.42) / (0.6425 - 0.42) + 237
              g = (170 - 255) * (p - 0.42) / (0.6425 - 0.42) + 255
              b = (0 - 255) * (p - 0.42) / (0.6425 - 0.42) + 255
            }else if(p > 0.16){
              r = (237 - 32) * (p - 0.16) / (0.42 - 0.16) + 32
              g = (255 - 107) * (p - 0.16) / (0.42 - 0.16) + 107
              b = (255 - 203) * (p - 0.16) / (0.42 - 0.16) + 203
            }else{
              r = (32 - 0) * (p - 0) / (0.16 - 0) + 0
              g = (107 - 7) * (p - 0) / (0.16 - 0) + 7
              b = (203 - 100) * (p - 0) / (0.16 - 0) + 100
            }
            r = Math.floor(r)
            g = Math.floor(g)
            b = Math.floor(b)
            ctx.fillStyle = "rgb("+r+","+g+","+b+")"
            break
          case 3:
            p = (v % cycle) / cycle
            for (var i = gradient.length - 1; i >= 0; i--){
              g = gradient[i][0]
              if(p <= g) continue
              n = i - 1
              if(n === -1) n = gradient.length - 1
              r = i + 1
              if(r === gradient.length) r = 0
              s = gradient[r][0]
              if(s === 0) s = 1
              r = (gradient[n][1] - gradient[i][1]) * (p - g) / (s - g) + gradient[i][1]
              g = (gradient[n][2] - gradient[i][2]) * (p - g) / (s - g) + gradient[i][2]
              b = (gradient[n][3] - gradient[i][3]) * (p - g) / (s - g) + gradient[i][3]
              r = Math.floor(r)
              g = Math.floor(g)
              b = Math.floor(b)
              ctx.fillStyle = "rgb("+r+","+g+","+b+")"
              break
            }
            break
      }

      ctx.fillRect(x, y, squareSize, squareSize);
    }
  }
}

// Determines how many iterations a+bi takes to leave a radius 2 circle
function mandelbrot(a, b) {
  const L=Math.log(2),c=a,d=b;
  let i=0,e=a*a,f=b*b;
  for(;;){
    b=2*a*b+d;
    a=e-f+c;
    e=a*a;
    f=b*b;
    g=e+f;
    if(++i>=iterations)return Infinity;
    if(g>=4)return i+1-(Math.log(Math.log(g)/2))/L;
  }
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
