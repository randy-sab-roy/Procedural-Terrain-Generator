attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform float time;
uniform sampler2D heightMap;

varying vec4 fcolor;

void main() {
    vec3 pos = position;
    pos.z = pos.z + (1.0-texture2D(heightMap, vec2(uv.x, uv.y)).x);
    gl_Position = projection * model * vec4( pos, 1.0 );

    fcolor = color;
}