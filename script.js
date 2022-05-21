const cameraPresets = [
  {x: -.5, y: 0, zoom: 4},
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

async function init() {
  const cvs = Mandelbrot.cvs = document.getElementById('cvs');
  const ctx = Mandelbrot.ctx = Mandelbrot.cvs.getContext('2d');
  let inputs = {
    captureMode: false,
    mode: 2
  };

  const overlay = document.getElementById('overlay');

  document.body.style.margin = '0px';
  document.body.style.overflow = 'hidden';

  let camera;
  if(localStorage.mandelbrotCamera) {
    try {
      let camera_ = JSON.parse(localStorage.mandelbrotCamera);
      camera = Mandelbrot.camera = {
        x: typeof camera_.x === 'number' ? camera_.x : -.5,
        y: typeof camera_.y === 'number' ? camera_.y : 0,
        zoom: typeof camera_.zoom === 'number' ? camera_.zoom : 4
      };
    } catch {
      camera = Mandelbrot.camera = {x: -.5, y: 0, zoom: 4};
    }
  } else {
    camera = Mandelbrot.camera = {x: -.5, y: 0, zoom: 4};
  }

  function fullscreen() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    overlay.width = window.innerWidth;
    overlay.height = window.innerHeight;
  }
  window.addEventListener('resize', () => {
    fullscreen();
    Mandelbrot.generate();
  });
  fullscreen();

  function setCameraResolution() {
    switch(inputs.mode) {
      case 1:
        camera.resolution = 8;
        break;
      case 2:
        camera.resolution = 4;
        break;
      case 3:
        camera.resolution = 2;
        break;
      case 4:
        camera.resolution = 1;
        break;
    }
    Mandelbrot.updateCamera(
      camera.x,
      camera.y,
      camera.zoom,
      camera.resolution
    );
  }
  setCameraResolution();

  window.addEventListener('keydown', (e) => {
    if(inputs.captureMode) {
      inputs.captureMode = false;
      return;
    }
    switch(e.key) {
      case ' ':
        inputs.captureMode = !inputs.captureMode;
        break;
      case 'r':
        Mandelbrot.updateCamera(-.5, 0, 4, camera.resolution);
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        inputs.mode = Number(e.key);
        setCameraResolution();
        break;
    }
  });

  window.addEventListener('click', (e) => {
    if(e.buttons === 0 && !inputs.captureMode) {
      Mandelbrot.updateCamera(
        camera.x + camera.zoom * (e.clientX / cvs.width - 0.5),
        camera.y - cvs.height / cvs.width * camera.zoom * (e.clientY / cvs.height - 0.5),
        camera.zoom,
        camera.resolution
      );
    }
  });

  window.addEventListener('wheel', (e) => {
    if(!inputs.captureMode) {
      Mandelbrot.updateCamera(
        camera.x,
        camera.y,
        camera.zoom * (e.deltaY > 0 ? 2 : .5),
        camera.resolution
      );
    }
  });

  while(true) {
    await new Promise((resolve) => {
      drawOverlay(overlay, camera, inputs.captureMode);
      window.requestAnimationFrame(resolve);
    });
  }
}

const Mandelbrot = {
  cvs: null,
  ctx: null,
  camera: null,
  worker: null,
  renderProgress: 0,

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
      interval: camera.resolution * camera.zoom / cvs.width,
      numPoints: {
        x: Math.ceil(Mandelbrot.cvs.width / camera.resolution),
        y: Math.ceil(Mandelbrot.cvs.height / camera.resolution)
      }
    });

    return new Promise((resolve) => {
      Mandelbrot.worker.onmessage = (e) => {
        if(e.data.length) {
          window.requestAnimationFrame(() => {
            Mandelbrot.draw(e.data);
            resolve();
          });
        } else {
          Mandelbrot.renderProgress = e.data;
        }
      }
    });
  },

  updateCamera: (x, y, zoom, resolution) => {
    Mandelbrot.generate({x, y, zoom, resolution}).then(() => {
      Mandelbrot.camera.x = x;
      Mandelbrot.camera.y = y;
      Mandelbrot.camera.zoom = zoom;
      Mandelbrot.camera.resolution = resolution;
      localStorage.mandelbrotCamera = JSON.stringify(Mandelbrot.camera);
    }).catch(console.log);
  },

  draw: (matrix) => {
    const camera = Mandelbrot.camera, cvs = Mandelbrot.cvs, ctx = Mandelbrot.ctx;
    const nx = cvs.width / camera.resolution,
          ny = cvs.height / camera.resolution;

    for(let i = 0; i < ny; i++) {
      for(let j = 0; j < nx; j++) {
        let [r, g, b] = [matrix[i][3*j], matrix[i][3*j+1], matrix[i][3*j+2]];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(j * camera.resolution, i * camera.resolution, camera.resolution, camera.resolution);
      }
    }
  }
}

function drawOverlay(cvs, camera, captureMode) {
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  if(captureMode) {
    return;
  }

  const INFO_TEXT = [
    [24, 24, 'Camera:', ''],
    [34, 28, 'X', formatFloat(camera.x)],
    [34, 24, 'Y', formatFloat(camera.y)],
    [34, 24, 'Zoom', ' ' + camera.zoom.toExponential(3)],
    [24, 32, 'Render:', ''],
    [34, 28, 'Progress', `${(Mandelbrot.renderProgress * 100).toFixed(0)}%`],
  ];
  const INFO_BOX_WIDTH = 460;
  const INFO_BOX_HEIGHT = 200;
  const INFO_COLUMN_WIDTH = 160;

  const CONTROL_TEXT = [
    [20, 24, 'Camera controls:', ''],
    [30, 28, 'LMB', 'Set center'],
    [30, 24, 'Wheel', 'Zoom'],
    [30, 24, 'R', 'Reset'],
    [20, 32, 'Resolution controls:', ''],
    [30, 28, '1', '8 pixels (fastest)', camera.resolution === 8],
    [30, 24, '2', '4 pixels', camera.resolution === 4],
    [30, 24, '3', '2 pixels', camera.resolution === 2],
    [30, 24, '4', '1 pixel', camera.resolution === 1],
    [20, 32, 'Other controls:', ''],
    [30, 28, 'Space', 'Toggle capture mode'],
  ];
  const CONTROL_BOX_WIDTH = 440;
  const CONTROL_BOX_HEIGHT = 310;
  const CONTROL_COLUMN_WIDTH = 160;

  // draw boxes
  ctx.fillStyle = 'rgba(220, 220, 230, .8)';
  ctx.fillRect(0, 0, INFO_BOX_WIDTH, INFO_BOX_HEIGHT);
  ctx.fillRect(cvs.width - CONTROL_BOX_WIDTH, 0, CONTROL_BOX_WIDTH, CONTROL_BOX_HEIGHT);

  // draw info text
  ctx.font = '20px Monospace';
  let y = 0;
  for(let i = 0; i < INFO_TEXT.length; i++) {
    ctx.fillStyle = INFO_TEXT[i][4] ? '#cc0000' : '#000000';
    y += INFO_TEXT[i][1];
    ctx.fillText(INFO_TEXT[i][2], INFO_TEXT[i][0], y);
    ctx.fillText(INFO_TEXT[i][3], INFO_TEXT[i][0] + INFO_COLUMN_WIDTH, y);
  }

  // draw control text
  ctx.font = '20px Monospace';
  y = 0;
  for(let i = 0; i < CONTROL_TEXT.length; i++) {
    ctx.fillStyle = CONTROL_TEXT[i][4] ? '#cc0000' : '#000000';
    y += CONTROL_TEXT[i][1];
    ctx.fillText(CONTROL_TEXT[i][2], cvs.width - CONTROL_BOX_WIDTH + CONTROL_TEXT[i][0], y);
    ctx.fillText(CONTROL_TEXT[i][3], cvs.width - CONTROL_BOX_WIDTH + CONTROL_TEXT[i][0] + CONTROL_COLUMN_WIDTH, y);
  }
}

function formatFloat(n) {
  let str = (n < 0 ? '-' : ' ');
  n = Math.abs(n);
  str += Math.floor(n) + '.';
  for(let i = 0; i < 4; i++) {
    if(i !== 0) str += ' ';
    n = (n * 1000) % 1000;
    str += String(Math.floor(n)).padStart(3, '0');
  }
  return str;
}

window.addEventListener('load', init);
