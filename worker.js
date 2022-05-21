const COLOR_CYCLE = 100;

const ESCAPE = 16;

onmessage = async (event) => {
  // e.data : [starting x coord, y coord, x interval, # of points, max iterations]
  const data = event.data;
  const matrix = computeRGBMatrix(
    data.x,
    data.y,
    data.interval,
    data.numPoints.x,
    data.numPoints.y
  );
  postMessage(matrix);
}

function computeRGBMatrix(x, y, interval, nx, ny) {
  const iterations = Math.floor(-100*Math.log2(interval));
  let matrix = new Array(ny);

  for(let i = 0; i < ny; i++) {
    matrix[i] = new Array(3 * nx);
    for(let j = 0; j < nx; j++) {
      let a = x + j * interval, b = y + i * interval, a_ = a, b_ = b;
      let a2 = a * a, b2 = b * b;
      for(let n = 0; n < iterations; n++) {
        b = 2 * a * b + b_;
        a = a2 - b2 + a_;
        a2 = a * a;
        b2 = b * b;
        z = a2 + b2;
        if(z >= ESCAPE) {
          computeColor(matrix[i], 3*j, n, z);
          break;
        }
      }
      if(matrix[i][3*j] === undefined) {
        matrix[i][3*j] = matrix[i][3*j+1] = matrix[i][3*j+2] = 0;
      }
    }
    postMessage((i + 1) / ny);
  }

  return matrix;
}

// Continuous coloring with linear gradient:
//   1     [0, 7, 100]
//   .8575 [0, 2, 0]
//   .6425 [255, 170, 0]
//   .42   [237, 255, 255]
//   .16   [32, 107, 203]
//   0     [0, 7, 100]
// Values are hardcoded for efficiency + no compiler for optimization
function computeColor(row, k, n, z) {
  cn = (10*((n%100)-Math.log2(Math.log2(z))))|0;
  p = cn>0?cn:cn+1000;
  if(p > 642) {
    if(p > 857) {
      let x = (1000-p)*229;
      row[k] = 0;
      row[k+1] = 7-(x*5>>15);
      row[k+2] = 25*(32768-x)>>13;
    } else {
      let x = (857-p)*305;
      row[k] = x>>8;
      row[k+1] = 2+(x*21>>13);
      row[k+2] = 0;
    }
  } else if(p > 420) {
    let x = (642-p)*295;
    row[k] = 255-(x*9>>15);
    row[k+1] = 170+(x*85>>16);
    row[k+2] = x>>8;
  } else if(p > 160) {
    let x = (420-p)*63;
    row[k] = 237-(x*205>>14);
    row[k+1] = 255-(x*37>>12);
    row[k+2] = 255-(x*13>>12);
  } else {
    let x = (160-p)*205;
    row[k] = (32768-x)>>10;
    row[k+1] = 107-(x*25>>13);
    row[k+2] = 203-(x*103>>15);
  }
}
