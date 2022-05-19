const squareSize = 8;
const iterations = 25000;

const cameraPresets = [
  {x: -.5, y: 0, zoom: 2},
  {x: -1.05, y: .305, zoom: .5},
  {x: -1.256, y: .381, zoom: .02},
  {x: -.02, y: .792, zoom: .05},
  {x: -.04, y: .8, zoom: .01},
  {x: -.0358, y: .80246, zoom: .0005},
  {x: .42, y: .34, zoom: .05},
  {x: -.16, y: -1.035, zoom: .05},
  {x: -1.985505512, y: .0000002037, zoom: .000000005},
  {x: .2500997, y: .00000152, zoom: .0000005},
  {x: .2500999, y: .00000159, zoom: .00000005},
];


function init() {
  const cvs = document.getElementById("cvs");
  const ctx = cvs.getContext("2d");

  let camera = {
    x: -0.5,
    y: 0,
    zoom: 4
  };

  document.body.style.margin = "0px";
  document.body.style.overflow = "hidden";

  function fullscreen() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    generateMandelbrot(cvs, ctx, camera);
  }

  window.addEventListener("resize", fullscreen);
  fullscreen();

  window.addEventListener('click', (e) => {
    camera.x += camera.zoom * (e.clientX / cvs.width - 0.5);
    camera.y += -cvs.height / cvs.width * camera.zoom * (e.clientY / cvs.height - 0.5)
    generateMandelbrot(cvs, ctx, camera);
  });

  window.addEventListener('wheel', (e) => {
    if(e.deltaY > 0) {
      camera.zoom *= 2;
    } else {
      camera.zoom /= 2;
    }
    generateMandelbrot(cvs, ctx, camera);
  });
}

async function generateMandelbrot(cvs, ctx, camera) {
  const startX = camera.x - 0.5 * camera.zoom;
  const startY = - camera.y - 0.5 * camera.zoom * cvs.height / cvs.width;
  const interval = squareSize * camera.zoom / cvs.width;
  const numPoints = cvs.width / squareSize;

  let i = 0;
  let matrix = [];

  const worker = new Worker('worker.js');
  worker.postMessage([startX, startY, interval, numPoints, iterations]);

  worker.onmessage = (e) => {
    matrix.push(e.data);
    if(i * squareSize < cvs.height) {
      worker.postMessage([startX, e.data[0] + interval, interval, numPoints, iterations]);
    }
    let y = i * squareSize;
    let row = matrix[i];
    i++;
    window.requestAnimationFrame(() => draw(cvs, ctx, camera, y, row));
  }
}

function draw(cvs, ctx, camera, y, points) {
  for(let i = 0; i < cvs.width / squareSize; i++) {
    let x = i * squareSize;
    let [r, g, b] = [points[3*i+1], points[3*i+2], points[3*i+3]];
    ctx.fillStyle = "rgb("+r+","+g+","+b+")";
    ctx.fillRect(x, y, squareSize, squareSize);
  }
  return new Promise((resolve) => {
    window.requestAnimationFrame(resolve);
  });
}

window.addEventListener("load", init);
