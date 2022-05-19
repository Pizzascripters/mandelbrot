const squareSize = 4;

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
  const cvs = Mandelbrot.cvs = document.getElementById('cvs');
  const ctx = Mandelbrot.ctx = Mandelbrot.cvs.getContext('2d');
  const camera = Mandelbrot.camera = {
    x: -0.5,
    y: 0,
    zoom: 4
  };

  document.body.style.margin = '0px';
  document.body.style.overflow = 'hidden';

  function fullscreen() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    Mandelbrot.generate();
  }

  window.addEventListener('resize', fullscreen);
  fullscreen();

  window.addEventListener('click', (e) => {
    Mandelbrot.updateCamera(
      camera.x + camera.zoom * (e.clientX / cvs.width - 0.5),
      camera.y - cvs.height / cvs.width * camera.zoom * (e.clientY / cvs.height - 0.5),
      camera.zoom
    );
  });

  window.addEventListener('wheel', (e) => {
    Mandelbrot.updateCamera(
      camera.x,
      camera.y,
      camera.zoom * (e.deltaY > 0 ? 2 : .5)
    );
  });
}

const Mandelbrot = {
  cvs: null,
  ctx: null,
  camera: null,
  worker: null,

  generate: (camera) => {
    if(!camera) {
      camera = Mandelbrot.camera;
    }

    if(Mandelbrot.worker) {
      // Prevent overlapping computations and renders
      Mandelbrot.worker.terminate();
    }
    Mandelbrot.worker = new Worker('worker.js');

    Mandelbrot.worker.postMessage({
      x: camera.x - 0.5 * camera.zoom,
      y: - camera.y - 0.5 * camera.zoom * cvs.height / cvs.width,
      interval: squareSize * camera.zoom / cvs.width,
      numPoints: {
        x: Math.ceil(Mandelbrot.cvs.width / squareSize),
        y: Math.ceil(Mandelbrot.cvs.height / squareSize)
      }
    });

    return new Promise((resolve) => {
      Mandelbrot.worker.onmessage = (e) => {
        window.requestAnimationFrame(() => {
          Mandelbrot.draw(e.data);
          resolve();
        });
      }
    });
  },

  updateCamera: (x, y, zoom) => {
    Mandelbrot.generate({x, y, zoom}).then(() => {
      Mandelbrot.camera.x = x;
      Mandelbrot.camera.y = y;
      Mandelbrot.camera.zoom = zoom;
    }).catch(console.log);
  },

  draw: (matrix) => {
    const nx = Mandelbrot.cvs.width / squareSize,
          ny = Mandelbrot.cvs.height / squareSize;
    for(let i = 0; i < ny; i++) {
      for(let j = 0; j < nx; j++) {
        let [r, g, b] = [matrix[i][3*j], matrix[i][3*j+1], matrix[i][3*j+2]];
        Mandelbrot.ctx.fillStyle = `rgb(${r},${g},${b})`;
        Mandelbrot.ctx.fillRect(j * squareSize, i * squareSize, squareSize, squareSize);
      }
    }
  }
}

window.addEventListener('load', init);
