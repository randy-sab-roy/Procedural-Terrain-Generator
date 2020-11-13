precision mediump float;

varying vec2 fuv;

void main() {
    gl_FragColor = vec4((sin(fuv.x)+1.0)/2.0, 1.0, 1.0, 1.0);
}