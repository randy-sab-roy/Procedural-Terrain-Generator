precision mediump float;

uniform sampler2D tex;

varying vec2 point;

// https://stackoverflow.com/questions/18453302/how-do-you-pack-one-32bit-int-into-4-8bit-ints-in-glsl-webgl
const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
const vec4 bitDec = 1./bitEnc;
float DecodeFloatRGBA (vec4 v) {
    return dot(v, bitDec);
}

void main() {
    gl_FragColor = vec4(vec3(DecodeFloatRGBA(texture2D(tex, point))), 1.0);
    // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}