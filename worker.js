const colorCycle = 100;

const L = Math.log(2);

onmessage = (event) => {
  // e.data : [starting x coord, y coord, x interval, # of points, max iterations]
  const data = event.data;
  const [x, y, interval, nx, ny] = [data.x, data.y, data.interval, data.numPoints.x, data.numPoints.y];
  const iterations = data.iterations;
  let matrix = new Array(ny);
  for(let i = 0; i < ny; i++) {
    matrix[i] = new Array(3 * nx);
    for(let j = 0; j < nx; j++) {
      let a = x + j * interval, b = y + i * interval, c = a, d = b;
      let e = a * a, f = b * b;
      for(let k = 0; k < iterations; k++) {
        b = 2 * a * b + d;
        a = e - f + c;
        e = a * a;
        f = b * b;
        g = e + f;
        if(g >= 4) {
          let color = findColor(k);
          matrix[i][3*j] = color[0];
          matrix[i][3*j+1] = color[1];
          matrix[i][3*j+2] = color[2];
          break;
        }
      }
      if(matrix[i][3*j] === undefined) {
        matrix[i][3*j] = matrix[i][3*j+1] = matrix[i][3*j+2] = 0;
      }
    }
  }
  postMessage(matrix);
}

function findColor(j) {
  let p = (j + 1 - (Math.log(Math.log(g) / 2)) / L) % colorCycle / colorCycle;
  if (p > 0.8575) {
    r = (0 - 0) * (p - 0.8575) / (1 - 0.8575) + 0;
    g = (7 - 2) * (p - 0.8575) / (1 - 0.8575) + 2;
    b = (100 - 0) * (p - 0.8575) / (1 - 0.8575) + 0;
  } else if(p > 0.6425) {
    r = (0 - 255) * (p - 0.6425) / (0.8575 - 0.6425) + 255;
    g = (2 - 170) * (p - 0.6425) / (0.8575 - 0.6425) + 170;
    b = (0 - 0) * (p - 0.6425) / (0.8575 - 0.6425) + 0;
  } else if(p > 0.42) {
    r = (255 - 237) * (p - 0.42) / (0.6425 - 0.42) + 237;
    g = (170 - 255) * (p - 0.42) / (0.6425 - 0.42) + 255;
    b = (0 - 255) * (p - 0.42) / (0.6425 - 0.42) + 255;
  } else if(p > 0.16) {
    r = (237 - 32) * (p - 0.16) / (0.42 - 0.16) + 32;
    g = (255 - 107) * (p - 0.16) / (0.42 - 0.16) + 107;
    b = (255 - 203) * (p - 0.16) / (0.42 - 0.16) + 203;
  } else {
    r = (32 - 0) * (p - 0) / (0.16 - 0) + 0;
    g = (107 - 7) * (p - 0) / (0.16 - 0) + 7;
    b = (203 - 100) * (p - 0) / (0.16 - 0) + 100;
  }
  return [Math.floor(r), Math.floor(g), Math.floor(b)];
}
