/** @type {WebGLRenderingContext} */
let gl = null;

let generator = null;
let quad = null;
let capture = false;


function draw() {
    GlUtils.resizeCanvas(gl);

    generator.draw();
    quad.draw();

    if (capture) {
        capture = false;
        const res = 255;
        const pixels = new Uint8Array(res * res * 4);
        gl.readPixels(gl.canvas.width - 265, 10, res, res, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = res;
        canvas.height = res;
        const data = context.createImageData(res, res);
        data.data.set(pixels);
        context.putImageData(data, 0, 0);
        const imgUrl = canvas.toDataURL();

        const link = document.createElement("a");
        link.setAttribute("download", "height_map.png");
        link.setAttribute("href", imgUrl);
        link.click();
        link.remove();
        canvas.remove();
    }

    requestAnimationFrame(draw);
}

async function init() {
    const mainCanvas = document.getElementById("drawCanvas");
    gl = GlUtils.createContext(mainCanvas);

    generator = new Generator();
    quad = new Quad();

    await generator.init(gl);
    await quad.init(gl);

    draw();
}

function downloadHeightMap() {
    capture = true;
}