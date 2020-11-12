attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform float time;
uniform sampler2D heightMap;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 pos;

void main() {
    vec3 p = position;
    p.z = p.z + (1.0-texture2D(heightMap, vec2(uv.x, uv.y)).x);
    gl_Position = projection * model * vec4( p, 1.0 );
    
    fcolor = color;
    normal = vec3(0, 0, 1);
    pos = vec3(gl_Position);
}